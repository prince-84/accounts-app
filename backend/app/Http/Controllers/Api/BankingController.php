<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
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
}
