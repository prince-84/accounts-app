<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\Company;
use App\Models\PettyCashFund;
use App\Models\PettyCashVoucher;
use App\Services\AccountingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BankingController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    public function accounts(): JsonResponse
    {
        $accounts = BankAccount::with('chartOfAccount')->get();
        return response()->json(['success' => true, 'data' => $accounts]);
    }

    public function pettyCash(): JsonResponse
    {
        $funds = PettyCashFund::with(['chartOfAccount', 'vouchers.expenseAccount'])->get();
        return response()->json(['success' => true, 'data' => $funds]);
    }

    public function createPettyCashVoucher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'petty_cash_fund_id' => 'required|exists:petty_cash_funds,id',
            'account_id' => 'required|exists:chart_of_accounts,id', // Expense account
            'voucher_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'paid_to' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        try {
            $voucher = DB::transaction(function () use ($validated) {
                $company = Company::findOrFail($validated['company_id']);
                $count = PettyCashVoucher::where('company_id', $company->id)->count() + 1;
                $voucherNumber = sprintf('%s-PCV-%05d', $company->company_code, $count);

                $voucher = PettyCashVoucher::create([
                    'company_id' => $company->id,
                    'petty_cash_fund_id' => $validated['petty_cash_fund_id'],
                    'account_id' => $validated['account_id'],
                    'voucher_number' => $voucherNumber,
                    'voucher_date' => $validated['voucher_date'],
                    'amount' => $validated['amount'],
                    'paid_to' => $validated['paid_to'],
                    'description' => $validated['description'],
                    'status' => 'posted',
                ]);

                // Auto-post to GL
                $this->accountingService->postPettyCashVoucherToGL($voucher);

                return $voucher;
            });

            return response()->json([
                'success' => true,
                'message' => 'Petty Cash Voucher created and posted to GL successfully',
                'data' => $voucher->load(['fund', 'expenseAccount']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'from_account_id' => 'required|exists:chart_of_accounts,id',
            'to_account_id' => 'required|exists:chart_of_accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'reference' => 'nullable|string|max:100',
            'narration' => 'nullable|string',
        ]);

        try {
            $entry = $this->accountingService->createJournalEntry([
                'company_id' => $validated['company_id'],
                'voucher_type' => 'CV',
                'entry_date' => $validated['transfer_date'],
                'reference' => $validated['reference'] ?? 'TRANSFER',
                'narration' => $validated['narration'] ?? 'Bank/Cash Transfer',
            ], [
                [
                    'account_id' => $validated['to_account_id'],
                    'description' => 'Funds received via transfer',
                    'debit' => (float) $validated['amount'],
                    'credit' => 0,
                ],
                [
                    'account_id' => $validated['from_account_id'],
                    'description' => 'Funds transferred out',
                    'debit' => 0,
                    'credit' => (float) $validated['amount'],
                ]
            ], true);

            return response()->json([
                'success' => true,
                'message' => 'Transfer completed and Contra Voucher posted to GL',
                'data' => $entry,
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function importStatement(Request $request): JsonResponse
    {
        $companyId = $request->header('X-Company-Id') 
            ?? $request->input('company_id') 
            ?? (app()->bound('activeCompany') ? app('activeCompany')->id : null);

        $validated = $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'offset_account_id' => 'nullable|exists:chart_of_accounts,id',
        ]);

        $bankAccount = BankAccount::where('company_id', $companyId)->findOrFail($validated['bank_account_id']);

        $rawRows = [];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->getRealPath();
            $handle = fopen($path, 'r');
            if ($handle !== false) {
                $header = fgetcsv($handle);
                if (!$header) {
                    return response()->json(['success' => false, 'message' => 'CSV file is empty.'], 422);
                }

                $cleanHeaders = array_map(function($h) {
                    return strtolower(trim(str_replace([' ', '_', '-', '/', '\\'], '', (string)$h)));
                }, $header);

                while (($data = fgetcsv($handle)) !== false) {
                    if (empty(array_filter($data))) continue;
                    $row = [];
                    foreach ($cleanHeaders as $idx => $key) {
                        $row[$key] = isset($data[$idx]) ? trim($data[$idx]) : '';
                    }
                    $rawRows[] = $row;
                }
                fclose($handle);
            }
        } elseif ($request->has('transactions')) {
            $rawRows = $request->input('transactions');
        } else {
            return response()->json(['success' => false, 'message' => 'Please provide a statement CSV file or transactions list.'], 422);
        }

        if (empty($rawRows)) {
            return response()->json(['success' => false, 'message' => 'No statement rows found to import.'], 422);
        }

        // Determine offset account
        $offsetAccount = null;
        if (!empty($validated['offset_account_id'])) {
            $offsetAccount = ChartOfAccount::where('company_id', $companyId)->find($validated['offset_account_id']);
        }

        if (!$offsetAccount) {
            $offsetAccount = ChartOfAccount::where('company_id', $companyId)
                ->where(function($q) {
                    $q->where('name', 'like', '%clearing%')
                      ->orWhere('name', 'like', '%suspense%');
                })
                ->where('id', '!=', $bankAccount->account_id)
                ->first();

            if (!$offsetAccount) {
                $offsetAccount = ChartOfAccount::create([
                    'company_id' => $companyId,
                    'code' => '9990',
                    'name' => 'Bank Clearing & Suspense',
                    'type' => 'liability',
                    'sub_type' => 'current_liability',
                    'description' => 'Temporary holding account for imported bank statement lines pending reconciliation',
                    'is_system' => true,
                    'is_active' => true,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $importedCount = 0;
            $netChange = 0.0;

            foreach ($rawRows as $idx => $row) {
                $date = $row['date'] ?? $row['valuedate'] ?? $row['bookingdate'] ?? date('Y-m-d');
                $desc = $row['description'] ?? $row['narration'] ?? $row['particulars'] ?? $row['details'] ?? 'Bank statement transaction';
                $ref = $row['reference'] ?? $row['ref'] ?? $row['chequeno'] ?? $row['transid'] ?? 'STATEMENT';

                // Detect deposit vs withdrawal
                $withdrawal = (float)str_replace(',', '', (string)($row['withdrawal'] ?? $row['debit'] ?? $row['out'] ?? 0));
                $deposit = (float)str_replace(',', '', (string)($row['deposit'] ?? $row['credit'] ?? $row['in'] ?? 0));

                if ($withdrawal <= 0 && $deposit <= 0 && isset($row['amount'])) {
                    $amt = (float)str_replace(',', '', (string)$row['amount']);
                    if ($amt > 0) {
                        $deposit = $amt;
                    } elseif ($amt < 0) {
                        $withdrawal = abs($amt);
                    }
                }

                if ($deposit <= 0 && $withdrawal <= 0) {
                    continue; // Skip zero rows
                }

                if ($deposit > 0) {
                    // Deposit: Debit Bank Account (Asset increases), Credit Offset Account
                    $this->accountingService->createJournalEntry([
                        'company_id' => $companyId,
                        'voucher_type' => 'CV',
                        'entry_date' => date('Y-m-d', strtotime($date)),
                        'reference' => $ref,
                        'narration' => $desc,
                    ], [
                        [
                            'account_id' => $bankAccount->account_id,
                            'description' => $desc,
                            'debit' => $deposit,
                            'credit' => 0,
                        ],
                        [
                            'account_id' => $offsetAccount->id,
                            'description' => $desc,
                            'debit' => 0,
                            'credit' => $deposit,
                        ],
                    ], true);

                    $bankAccount->current_balance += $deposit;
                    $netChange += $deposit;
                } else {
                    // Withdrawal: Debit Offset Account, Credit Bank Account (Asset decreases)
                    $this->accountingService->createJournalEntry([
                        'company_id' => $companyId,
                        'voucher_type' => 'CV',
                        'entry_date' => date('Y-m-d', strtotime($date)),
                        'reference' => $ref,
                        'narration' => $desc,
                    ], [
                        [
                            'account_id' => $offsetAccount->id,
                            'description' => $desc,
                            'debit' => $withdrawal,
                            'credit' => 0,
                        ],
                        [
                            'account_id' => $bankAccount->account_id,
                            'description' => $desc,
                            'debit' => 0,
                            'credit' => $withdrawal,
                        ],
                    ], true);

                    $bankAccount->current_balance -= $withdrawal;
                    $netChange -= $withdrawal;
                }

                $importedCount++;
            }

            $bankAccount->save();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$importedCount} bank statement transactions.",
                'data' => [
                    'imported_count' => $importedCount,
                    'net_change' => $netChange,
                    'new_balance' => $bankAccount->current_balance,
                ],
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Statement import failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}
