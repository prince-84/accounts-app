<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\ChartOfAccount;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Models\PettyCashVoucher;
use App\Models\Receipt;
use App\Models\Vendor;
use Exception;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Create and post a balanced General Journal Entry.
     */
    public function createJournalEntry(array $data, array $lines, bool $autoPost = true): JournalEntry
    {
        return DB::transaction(function () use ($data, $lines, $autoPost) {
            $companyId = $data['company_id'];
            $company = Company::findOrFail($companyId);

            // Calculate debit and credit
            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($lines as $line) {
                $totalDebit += (float) ($line['debit'] ?? 0);
                $totalCredit += (float) ($line['credit'] ?? 0);
            }

            // Accounting rule: Total Debit MUST equal Total Credit
            if (abs($totalDebit - $totalCredit) > 0.001) {
                throw new Exception("Unbalanced Journal Entry! Total Debit ({$totalDebit}) must equal Total Credit ({$totalCredit}).");
            }

            // Generate entry number if not provided
            if (empty($data['entry_number'])) {
                $prefix = $company->company_code . '-' . ($data['voucher_type'] ?? 'JV');
                $count = JournalEntry::where('company_id', $companyId)->count() + 1;
                $data['entry_number'] = sprintf('%s-%05d', $prefix, $count);
            }

            $data['total_debit'] = $totalDebit;
            $data['total_credit'] = $totalCredit;
            $data['status'] = $autoPost ? 'posted' : 'draft';
            $data['posted_at'] = $autoPost ? now() : null;
            $data['currency_code'] = $data['currency_code'] ?? $company->base_currency_code;
            $data['exchange_rate'] = $data['exchange_rate'] ?? 1.0;

            $entry = JournalEntry::create($data);

            foreach ($lines as $line) {
                $debit = (float) ($line['debit'] ?? 0);
                $credit = (float) ($line['credit'] ?? 0);
                $exchangeRate = (float) $entry->exchange_rate;

                $entryLine = JournalEntryLine::create([
                    'company_id' => $companyId,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line['account_id'],
                    'description' => $line['description'] ?? $entry->narration,
                    'debit' => $debit,
                    'credit' => $credit,
                    'base_currency_amount' => ($debit > 0 ? $debit : $credit) * $exchangeRate,
                ]);

                // Update Account current balance if posted
                if ($autoPost) {
                    $this->updateAccountBalance($line['account_id'], $debit, $credit);
                }
            }

            return $entry;
        });
    }

    /**
     * Update Account balance based on account type normal balance.
     */
    protected function updateAccountBalance(int $accountId, float $debit, float $credit): void
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) return;

        // Assets and Expenses increase on Debit, decrease on Credit
        // Liabilities, Equity, and Revenue increase on Credit, decrease on Debit
        if (in_array($account->type, ['asset', 'expense'])) {
            $account->current_balance += ($debit - $credit);
        } else {
            $account->current_balance += ($credit - $debit);
        }

        $account->save();
    }

    /**
     * Post an Invoice to General Ledger.
     */
    public function postInvoiceToGL(Invoice $invoice): JournalEntry
    {
        return DB::transaction(function () use ($invoice) {
            $company = Company::findOrFail($invoice->company_id);

            // Find Control Accounts
            $arAccount = ChartOfAccount::where('company_id', $invoice->company_id)
                ->where('sub_type', 'accounts_receivable')
                ->first()
                ?? ChartOfAccount::where('company_id', $invoice->company_id)->where('type', 'asset')->first();

            $salesAccount = ChartOfAccount::where('company_id', $invoice->company_id)
                ->where('sub_type', 'operating_revenue')
                ->first()
                ?? ChartOfAccount::where('company_id', $invoice->company_id)->where('type', 'revenue')->first();

            $taxAccount = ChartOfAccount::where('company_id', $invoice->company_id)
                ->where('sub_type', 'tax_payable')
                ->first();

            $lines = [];

            // Debit AR for total amount
            $lines[] = [
                'account_id' => $arAccount->id,
                'description' => "Invoice #{$invoice->invoice_number} - Customer: {$invoice->customer->name}",
                'debit' => (float) $invoice->total_amount,
                'credit' => 0,
            ];

            // Credit Sales for subtotal
            $lines[] = [
                'account_id' => $salesAccount->id,
                'description' => "Invoice #{$invoice->invoice_number} - Revenue",
                'debit' => 0,
                'credit' => (float) $invoice->subtotal,
            ];

            // Credit Tax if tax amount > 0
            if ((float) $invoice->tax_amount > 0 && $taxAccount) {
                $lines[] = [
                    'account_id' => $taxAccount->id,
                    'description' => "Invoice #{$invoice->invoice_number} - {$company->tax_label} Output Tax",
                    'debit' => 0,
                    'credit' => (float) $invoice->tax_amount,
                ];
            }

            $journalEntry = $this->createJournalEntry([
                'company_id' => $invoice->company_id,
                'branch_id' => $invoice->branch_id,
                'voucher_type' => 'INV',
                'entry_date' => $invoice->invoice_date,
                'reference' => $invoice->invoice_number,
                'narration' => "Sales Invoice for {$invoice->customer->name}",
                'currency_code' => $invoice->currency_code,
                'exchange_rate' => $invoice->exchange_rate,
            ], $lines, true);

            $invoice->journal_entry_id = $journalEntry->id;
            $invoice->save();

            // Update customer balance
            $customer = $invoice->customer;
            $customer->current_balance += (float) $invoice->total_amount;
            $customer->save();

            return $journalEntry;
        });
    }

    /**
     * Post a Customer Receipt to General Ledger.
     */
    public function postReceiptToGL(Receipt $receipt): JournalEntry
    {
        return DB::transaction(function () use ($receipt) {
            $arAccount = ChartOfAccount::where('company_id', $receipt->company_id)
                ->where('sub_type', 'accounts_receivable')
                ->first();

            $lines = [
                [
                    'account_id' => $receipt->account_id, // Bank/Cash
                    'description' => "Receipt #{$receipt->receipt_number} from {$receipt->customer->name}",
                    'debit' => (float) $receipt->amount,
                    'credit' => 0,
                ],
                [
                    'account_id' => $arAccount->id, // AR
                    'description' => "Receipt #{$receipt->receipt_number} payment applied",
                    'debit' => 0,
                    'credit' => (float) $receipt->amount,
                ]
            ];

            $journalEntry = $this->createJournalEntry([
                'company_id' => $receipt->company_id,
                'branch_id' => $receipt->branch_id,
                'voucher_type' => 'RV',
                'entry_date' => $receipt->receipt_date,
                'reference' => $receipt->receipt_number,
                'narration' => "Payment received from {$receipt->customer->name}",
                'currency_code' => $receipt->currency_code,
                'exchange_rate' => $receipt->exchange_rate,
            ], $lines, true);

            $receipt->journal_entry_id = $journalEntry->id;
            $receipt->save();

            // Update customer balance
            $customer = $receipt->customer;
            $customer->current_balance -= (float) $receipt->amount;
            $customer->save();

            return $journalEntry;
        });
    }

    /**
     * Post a Vendor Bill to General Ledger.
     */
    public function postBillToGL(Bill $bill): JournalEntry
    {
        return DB::transaction(function () use ($bill) {
            $company = Company::findOrFail($bill->company_id);

            $apAccount = ChartOfAccount::where('company_id', $bill->company_id)
                ->where('sub_type', 'accounts_payable')
                ->first();

            $expenseAccount = ChartOfAccount::where('company_id', $bill->company_id)
                ->where('sub_type', 'operating_expense')
                ->first()
                ?? ChartOfAccount::where('company_id', $bill->company_id)->where('type', 'expense')->first();

            $taxAccount = ChartOfAccount::where('company_id', $bill->company_id)
                ->where('sub_type', 'tax_receivable')
                ->first();

            $lines = [];

            // Debit Expense
            $lines[] = [
                'account_id' => $expenseAccount->id,
                'description' => "Bill #{$bill->bill_number} - Vendor: {$bill->vendor->name}",
                'debit' => (float) $bill->subtotal,
                'credit' => 0,
            ];

            // Debit Tax if applicable
            if ((float) $bill->tax_amount > 0 && $taxAccount) {
                $lines[] = [
                    'account_id' => $taxAccount->id,
                    'description' => "Bill #{$bill->bill_number} - Input Tax",
                    'debit' => (float) $bill->tax_amount,
                    'credit' => 0,
                ];
            }

            // Credit AP
            $lines[] = [
                'account_id' => $apAccount->id,
                'description' => "Bill #{$bill->bill_number} - Payable to {$bill->vendor->name}",
                'debit' => 0,
                'credit' => (float) $bill->total_amount,
            ];

            $journalEntry = $this->createJournalEntry([
                'company_id' => $bill->company_id,
                'branch_id' => $bill->branch_id,
                'voucher_type' => 'BILL',
                'entry_date' => $bill->bill_date,
                'reference' => $bill->bill_number,
                'narration' => "Vendor Bill from {$bill->vendor->name}",
                'currency_code' => $bill->currency_code,
                'exchange_rate' => $bill->exchange_rate,
            ], $lines, true);

            $bill->journal_entry_id = $journalEntry->id;
            $bill->save();

            // Update vendor balance
            $vendor = $bill->vendor;
            $vendor->current_balance += (float) $bill->total_amount;
            $vendor->save();

            return $journalEntry;
        });
    }

    /**
     * Post a Vendor Payment to General Ledger.
     */
    public function postPaymentToGL(Payment $payment): JournalEntry
    {
        return DB::transaction(function () use ($payment) {
            $apAccount = ChartOfAccount::where('company_id', $payment->company_id)
                ->where('sub_type', 'accounts_payable')
                ->first();

            $lines = [
                [
                    'account_id' => $apAccount->id, // Dr. AP
                    'description' => "Payment #{$payment->payment_number} to {$payment->vendor->name}",
                    'debit' => (float) $payment->amount,
                    'credit' => 0,
                ],
                [
                    'account_id' => $payment->account_id, // Cr. Bank/Cash
                    'description' => "Payment #{$payment->payment_number} disbursed",
                    'debit' => 0,
                    'credit' => (float) $payment->amount,
                ]
            ];

            $journalEntry = $this->createJournalEntry([
                'company_id' => $payment->company_id,
                'branch_id' => $payment->branch_id,
                'voucher_type' => 'PV',
                'entry_date' => $payment->payment_date,
                'reference' => $payment->payment_number,
                'narration' => "Payment disbursed to {$payment->vendor->name}",
                'currency_code' => $payment->currency_code,
                'exchange_rate' => $payment->exchange_rate,
            ], $lines, true);

            $payment->journal_entry_id = $journalEntry->id;
            $payment->save();

            // Update vendor balance
            $vendor = $payment->vendor;
            $vendor->current_balance -= (float) $payment->amount;
            $vendor->save();

            return $journalEntry;
        });
    }

    /**
     * Post a Petty Cash Expense Voucher to General Ledger.
     */
    public function postPettyCashVoucherToGL(PettyCashVoucher $voucher): JournalEntry
    {
        return DB::transaction(function () use ($voucher) {
            $fund = $voucher->fund;

            $lines = [
                [
                    'account_id' => $voucher->account_id, // Dr. Expense
                    'description' => "Petty Cash Voucher #{$voucher->voucher_number} - Paid to: {$voucher->paid_to}",
                    'debit' => (float) $voucher->amount,
                    'credit' => 0,
                ],
                [
                    'account_id' => $fund->account_id, // Cr. Petty Cash Float Asset
                    'description' => "Petty cash disbursement for {$voucher->description}",
                    'debit' => 0,
                    'credit' => (float) $voucher->amount,
                ]
            ];

            $journalEntry = $this->createJournalEntry([
                'company_id' => $voucher->company_id,
                'voucher_type' => 'PV',
                'entry_date' => $voucher->voucher_date,
                'reference' => $voucher->voucher_number,
                'narration' => "Petty Cash Expense: {$voucher->description}",
            ], $lines, true);

            $voucher->journal_entry_id = $journalEntry->id;
            $voucher->save();

            // Decrease petty cash fund current balance
            $fund->current_balance -= (float) $voucher->amount;
            $fund->save();

            return $journalEntry;
        });
    }
}
