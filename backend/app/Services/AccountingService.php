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
     * Robust accounting date parser that accurately handles:
     * - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
     * - DD-MM-YY, DD/MM/YY, DD.MM.YY (2-digit years: 26 -> 2026)
     * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
     * - Excel numeric serial dates (e.g. 45513)
     * - Standard human text dates (e.g. "26 Aug 2026", "August 26, 2026")
     */
    public static function parseFlexibleDate(?string $rawDate): string
    {
        if (empty($rawDate)) {
            return date('Y-m-d');
        }

        $str = trim((string)$rawDate);
        if ($str === '') {
            return date('Y-m-d');
        }

        // 1. Excel numeric serial date (e.g. 30000 - 80000)
        if (is_numeric($str) && (float)$str > 30000 && (float)$str < 80000) {
            $timestamp = ((float)$str - 25569) * 86400;
            return gmdate('Y-m-d', (int)$timestamp);
        }

        // 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (4-digit year at start)
        if (preg_match('/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/', $str, $m)) {
            return sprintf('%04d-%02d-%02d', (int)$m[1], (int)$m[2], (int)$m[3]);
        }

        // 3. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (4-digit year at end)
        if (preg_match('/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/', $str, $m)) {
            return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
        }

        // 4. DD-MM-YY or DD/MM/YY or DD.MM.YY (2-digit year at end)
        if (preg_match('/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2})$/', $str, $m)) {
            $shortYear = (int)$m[3];
            $year = $shortYear < 70 ? (2000 + $shortYear) : (1900 + $shortYear);
            return sprintf('%04d-%02d-%02d', $year, (int)$m[2], (int)$m[1]);
        }

        // 5. Fallback: replace '/' or '.' with '-' so strtotime treats European day-first
        $dashStr = str_replace(['/', '.'], '-', $str);
        $ts = strtotime($dashStr);
        if ($ts !== false && $ts > 0) {
            return date('Y-m-d', $ts);
        }

        return date('Y-m-d');
    }

    /**
     * Create and post a balanced General Journal Entry.
     */
    public function createJournalEntry(array $data, array $lines, bool $autoPost = true): JournalEntry
    {
        return DB::transaction(function () use ($data, $lines, $autoPost) {
            $companyId = $data['company_id'];
            $company = Company::findOrFail($companyId);

            // Normalize entry date
            $data['entry_date'] = self::parseFlexibleDate($data['entry_date'] ?? null);

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
    public function updateAccountBalance(int $accountId, float $debit, float $credit): void
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
     * Reverse Account balance when a Journal Entry is deleted or reversed.
     */
    public function reverseAccountBalance(int $accountId, float $debit, float $credit): void
    {
        $account = ChartOfAccount::find($accountId);
        if (!$account) return;

        // Assets and Expenses decrease on Debit removal, increase on Credit removal
        if (in_array($account->type, ['asset', 'expense'])) {
            $account->current_balance -= ($debit - $credit);
        } else {
            $account->current_balance -= ($credit - $debit);
        }

        $account->save();
    }

    /**
     * Update an existing General Journal Entry.
     */
    public function updateJournalEntry(int $id, array $data, array $lines, bool $autoPost = true): JournalEntry
    {
        return DB::transaction(function () use ($id, $data, $lines, $autoPost) {
            $entry = JournalEntry::withoutGlobalScope('company')->with(['lines' => function ($q) {
                $q->withoutGlobalScope('company');
            }])->findOrFail($id);
            $companyId = $entry->company_id;

            // 1. Calculate new debit and credit totals
            $totalDebit = 0;
            $totalCredit = 0;
            foreach ($lines as $line) {
                $totalDebit += (float) ($line['debit'] ?? 0);
                $totalCredit += (float) ($line['credit'] ?? 0);
            }

            if (abs($totalDebit - $totalCredit) > 0.001) {
                throw new Exception("Unbalanced Journal Entry! Total Debit ({$totalDebit}) must equal Total Credit ({$totalCredit}).");
            }

            // 2. Revert previous balances if posted
            if ($entry->status === 'posted') {
                foreach ($entry->lines as $oldLine) {
                    $this->reverseAccountBalance($oldLine->account_id, (float)$oldLine->debit, (float)$oldLine->credit);
                }
            }

            // 3. Delete existing lines
            $entry->lines()->delete();

            // 4. Update entry header
            $entryDate = isset($data['entry_date']) ? self::parseFlexibleDate($data['entry_date']) : $entry->entry_date;
            $entry->update([
                'voucher_type' => $data['voucher_type'] ?? $entry->voucher_type,
                'entry_date' => $entryDate,
                'reference' => $data['reference'] ?? $entry->reference,
                'narration' => $data['narration'] ?? $entry->narration,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'status' => $autoPost ? 'posted' : 'draft',
                'posted_at' => $autoPost ? ($entry->posted_at ?? now()) : null,
            ]);

            // 5. Create new lines and post new balances
            $exchangeRate = (float) $entry->exchange_rate;
            foreach ($lines as $line) {
                $debit = (float) ($line['debit'] ?? 0);
                $credit = (float) ($line['credit'] ?? 0);

                JournalEntryLine::create([
                    'company_id' => $companyId,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line['account_id'],
                    'description' => $line['description'] ?? $entry->narration,
                    'debit' => $debit,
                    'credit' => $credit,
                    'base_currency_amount' => ($debit > 0 ? $debit : $credit) * $exchangeRate,
                ]);

                if ($autoPost) {
                    $this->updateAccountBalance($line['account_id'], $debit, $credit);
                }
            }

            return $entry->fresh(['lines.account']);
        });
    }

    /**
     * Delete a Journal Entry, reverting GL balances if posted.
     */
    public function deleteJournalEntry(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $entry = JournalEntry::with('lines')->findOrFail($id);

            // Revert balances for each line if posted
            if ($entry->status === 'posted') {
                foreach ($entry->lines as $line) {
                    $this->reverseAccountBalance($line->account_id, (float)$line->debit, (float)$line->credit);
                }
            }

            // Delete lines and entry
            $entry->lines()->delete();
            return (bool) $entry->delete();
        });
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
