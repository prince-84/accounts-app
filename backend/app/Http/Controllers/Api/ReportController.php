<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Bill;
use App\Models\ChartOfAccount;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Trial Balance Report.
     */
    public function trialBalance(Request $request): JsonResponse
    {
        $accounts = ChartOfAccount::orderBy('code')->get();

        $rows = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($accounts as $account) {
            $balance = (float) $account->current_balance;

            $debit = 0;
            $credit = 0;

            if (in_array($account->type, ['asset', 'expense'])) {
                if ($balance >= 0) {
                    $debit = $balance;
                } else {
                    $credit = abs($balance);
                }
            } else {
                if ($balance >= 0) {
                    $credit = $balance;
                } else {
                    $debit = abs($balance);
                }
            }

            if ($debit > 0 || $credit > 0) {
                $rows[] = [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'sub_type' => $account->sub_type,
                    'debit' => $debit,
                    'credit' => $credit,
                ];

                $totalDebit += $debit;
                $totalCredit += $credit;
            }
        }

        $isBalanced = abs($totalDebit - $totalCredit) < 0.01;

        return response()->json([
            'success' => true,
            'data' => [
                'rows' => $rows,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'difference' => abs($totalDebit - $totalCredit),
                'is_balanced' => $isBalanced,
            ],
        ]);
    }

    /**
     * Profit & Loss / Income Statement.
     */
    public function incomeStatement(Request $request): JsonResponse
    {
        $revenueAccounts = ChartOfAccount::where('type', 'revenue')->orderBy('code')->get();
        $expenseAccounts = ChartOfAccount::where('type', 'expense')->orderBy('code')->get();

        $totalRevenue = 0;
        $revenues = [];
        foreach ($revenueAccounts as $acc) {
            $val = (float) $acc->current_balance;
            $revenues[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'amount' => $val,
            ];
            $totalRevenue += $val;
        }

        $totalExpense = 0;
        $expenses = [];
        foreach ($expenseAccounts as $acc) {
            $val = (float) $acc->current_balance;
            $expenses[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'amount' => $val,
            ];
            $totalExpense += $val;
        }

        $netProfit = $totalRevenue - $totalExpense;

        return response()->json([
            'success' => true,
            'data' => [
                'revenues' => $revenues,
                'total_revenue' => $totalRevenue,
                'expenses' => $expenses,
                'total_expenses' => $totalExpense,
                'net_profit' => $netProfit,
            ],
        ]);
    }

    /**
     * Balance Sheet.
     */
    public function balanceSheet(Request $request): JsonResponse
    {
        $assetAccounts = ChartOfAccount::where('type', 'asset')->orderBy('code')->get();
        $liabilityAccounts = ChartOfAccount::where('type', 'liability')->orderBy('code')->get();
        $equityAccounts = ChartOfAccount::where('type', 'equity')->orderBy('code')->get();

        // Calculate Net Profit
        $totalRevenue = (float) ChartOfAccount::where('type', 'revenue')->sum('current_balance');
        $totalExpense = (float) ChartOfAccount::where('type', 'expense')->sum('current_balance');
        $currentPeriodNetProfit = $totalRevenue - $totalExpense;

        $totalAssets = 0;
        $assets = [];
        foreach ($assetAccounts as $acc) {
            $val = (float) $acc->current_balance;
            $assets[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'sub_type' => $acc->sub_type,
                'amount' => $val,
            ];
            $totalAssets += $val;
        }

        $totalLiabilities = 0;
        $liabilities = [];
        foreach ($liabilityAccounts as $acc) {
            $val = (float) $acc->current_balance;
            $liabilities[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'sub_type' => $acc->sub_type,
                'amount' => $val,
            ];
            $totalLiabilities += $val;
        }

        $totalEquity = 0;
        $equity = [];
        foreach ($equityAccounts as $acc) {
            $val = (float) $acc->current_balance;
            $equity[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'sub_type' => $acc->sub_type,
                'amount' => $val,
            ];
            $totalEquity += $val;
        }

        // Add current period net profit to equity
        $totalEquityWithProfit = $totalEquity + $currentPeriodNetProfit;
        $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquityWithProfit;

        return response()->json([
            'success' => true,
            'data' => [
                'assets' => $assets,
                'total_assets' => $totalAssets,
                'liabilities' => $liabilities,
                'total_liabilities' => $totalLiabilities,
                'equity' => $equity,
                'current_period_profit' => $currentPeriodNetProfit,
                'total_equity' => $totalEquityWithProfit,
                'total_liabilities_and_equity' => $totalLiabilitiesAndEquity,
                'is_balanced' => abs($totalAssets - $totalLiabilitiesAndEquity) < 0.01,
            ],
        ]);
    }

    /**
     * Account General Ledger.
     */
    public function ledger(Request $request): JsonResponse
    {
        $accountId = $request->get('account_id');
        if (!$accountId) {
            $account = ChartOfAccount::first();
            $accountId = $account ? $account->id : null;
        }

        if (!$accountId) {
            return response()->json(['success' => false, 'message' => 'No account found'], 404);
        }

        $account = ChartOfAccount::findOrFail($accountId);

        $lines = JournalEntryLine::with(['journalEntry.branch'])
            ->where('account_id', $accountId)
            ->whereHas('journalEntry', function ($q) {
                $q->where('status', 'posted');
            })
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.id')
            ->select('journal_entry_lines.*')
            ->get();

        $runningBalance = (float) $account->opening_balance;
        $isDebitNormal = in_array($account->type, ['asset', 'expense']);

        $transactions = [];
        foreach ($lines as $line) {
            $debit = (float) $line->debit;
            $credit = (float) $line->credit;

            if ($isDebitNormal) {
                $runningBalance += ($debit - $credit);
            } else {
                $runningBalance += ($credit - $debit);
            }

            $transactions[] = [
                'id' => $line->id,
                'entry_number' => $line->journalEntry->entry_number,
                'date' => $line->journalEntry->entry_date,
                'voucher_type' => $line->journalEntry->voucher_type,
                'reference' => $line->journalEntry->reference,
                'description' => $line->description,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'account' => $account,
                'opening_balance' => (float) $account->opening_balance,
                'current_balance' => (float) $account->current_balance,
                'transactions' => $transactions,
            ],
        ]);
    }

    /**
     * Dashboard KPI Summary.
     */
    public function dashboardSummary(Request $request): JsonResponse
    {
        // 1. Total Receivables from AR Control
        $arAccount = ChartOfAccount::where('sub_type', 'accounts_receivable')->first();
        $totalReceivables = $arAccount ? (float) $arAccount->current_balance : (float) Customer::sum('current_balance');

        // 2. Total Payables from AP Control
        $apAccount = ChartOfAccount::where('sub_type', 'accounts_payable')->first();
        $totalPayables = $apAccount ? (float) $apAccount->current_balance : (float) Vendor::sum('current_balance');

        // 3. Cash & Bank Balance
        $bankBalance = (float) ChartOfAccount::where('sub_type', 'bank_cash')->sum('current_balance');

        // 4. Net Profit
        $totalRevenue = (float) ChartOfAccount::where('type', 'revenue')->sum('current_balance');
        $totalExpense = (float) ChartOfAccount::where('type', 'expense')->sum('current_balance');
        $netProfit = $totalRevenue - $totalExpense;

        // Recent Invoices
        $recentInvoices = Invoice::with('customer')
            ->orderBy('invoice_date', 'desc')
            ->orderBy('id', 'desc')
            ->take(5)
            ->get();

        // Recent Journal Transactions
        $recentTransactions = JournalEntry::with('lines.account')
            ->where('status', 'posted')
            ->orderBy('entry_date', 'desc')
            ->orderBy('id', 'desc')
            ->take(5)
            ->get();

        // Real Upcoming Unpaid/Pending Bills
        $upcomingPayments = Bill::with('vendor')
            ->whereIn('status', ['unpaid', 'partially_paid', 'pending'])
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();

        // Real Expense Breakdown by Account
        $expenseAccounts = ChartOfAccount::where('type', 'expense')
            ->where('current_balance', '>', 0)
            ->orderBy('current_balance', 'desc')
            ->take(6)
            ->get();

        $expenseBreakdown = $expenseAccounts->map(function ($acc) {
            return [
                'name' => $acc->name,
                'value' => (float) $acc->current_balance,
            ];
        });

        // Real Monthly Trends (12 months of current year)
        $currentYear = date('Y');
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $monthlyTrends = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthPad = str_pad($m, 2, '0', STR_PAD_LEFT);
            $monthRevenue = (float) Invoice::whereYear('invoice_date', $currentYear)
                ->whereMonth('invoice_date', $monthPad)
                ->sum('total_amount');

            $monthExpense = (float) Bill::whereYear('bill_date', $currentYear)
                ->whereMonth('bill_date', $monthPad)
                ->sum('total_amount');

            $monthlyTrends[] = [
                'month' => $months[$m - 1],
                'revenue' => $monthRevenue,
                'expenses' => $monthExpense,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'kpi' => [
                    'revenue' => $totalRevenue,
                    'expenses' => $totalExpense,
                    'profit' => $netProfit,
                    'receivables' => $totalReceivables,
                    'payables' => $totalPayables,
                    'bank_balance' => $bankBalance,
                ],
                'recent_invoices' => $recentInvoices,
                'recent_transactions' => $recentTransactions,
                'upcoming_payments' => $upcomingPayments,
                'expense_breakdown' => $expenseBreakdown,
                'monthly_trends' => $monthlyTrends,
            ],
        ]);
    }
}
