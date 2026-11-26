<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalAccountController extends Controller
{
    /**
     * Seed default Personal Chart of Accounts based on bank-statement-format.xlsx if empty.
     */
    public static function ensureDefaultAccounts(): void
    {
        if (PersonalAccount::count() > 0) {
            return;
        }

        $defaults = [
            // Bank & Cash Assets
            ['code' => 'P-1010', 'name' => 'ADCB Personal Bank', 'type' => 'asset', 'account_number' => '10500706132001', 'description' => 'Primary ADCB personal bank account'],
            ['code' => 'P-1020', 'name' => 'Al Hilal', 'type' => 'asset', 'account_number' => null, 'description' => 'Al Hilal Bank / Account'],
            ['code' => 'P-1030', 'name' => 'Transfer / Cash', 'type' => 'asset', 'account_number' => null, 'description' => 'Cash & internal personal transfers'],
            ['code' => 'P-1100', 'name' => 'Investment', 'type' => 'asset', 'account_number' => null, 'description' => 'Personal investments & portfolio'],

            // Personal & Client Ledgers (Receivables / Payables / Related Entities)
            ['code' => 'P-1201', 'name' => 'FS Advisory', 'type' => 'ledger', 'account_number' => null, 'description' => 'FS Advisory Real Estate LLC ledger'],
            ['code' => 'P-1202', 'name' => 'Coreunity', 'type' => 'ledger', 'account_number' => null, 'description' => 'Coreunity company ledger'],
            ['code' => 'P-1203', 'name' => 'IRMG', 'type' => 'ledger', 'account_number' => null, 'description' => 'IRMG receivable / ledger'],
            ['code' => 'P-1204', 'name' => 'Client / Friend Ledger', 'type' => 'ledger', 'account_number' => null, 'description' => 'General client or friend recoverable ledger'],
            ['code' => 'P-1205', 'name' => 'Meeraj', 'type' => 'ledger', 'account_number' => null, 'description' => 'Muhammad Merajuddin ledger'],
            ['code' => 'P-1206', 'name' => 'Naeem bhai', 'type' => 'ledger', 'account_number' => null, 'description' => 'Naeem bhai personal ledger'],
            ['code' => 'P-1207', 'name' => 'Mr Abdullah', 'type' => 'ledger', 'account_number' => null, 'description' => 'Mr Abdullah ledger'],
            ['code' => 'P-1208', 'name' => 'Mr Nasser Al Budoor', 'type' => 'ledger', 'account_number' => null, 'description' => 'Mr Nasser Al Budoor ledger'],
            ['code' => 'P-1209', 'name' => 'Mr Yeung', 'type' => 'ledger', 'account_number' => null, 'description' => 'Mr Yeung ledger'],
            ['code' => 'P-1210', 'name' => 'Khan Lord Muhammad', 'type' => 'ledger', 'account_number' => null, 'description' => 'Khan Lord Muhammad ledger'],

            // Liabilities
            ['code' => 'P-2010', 'name' => 'ADIB Card Payment', 'type' => 'liability', 'account_number' => null, 'description' => 'ADIB Credit Card payments & balance'],

            // Income
            ['code' => 'P-4010', 'name' => 'Commission Income', 'type' => 'income', 'account_number' => null, 'description' => 'Personal commission & advisory income'],

            // Expenses
            ['code' => 'P-5010', 'name' => 'Personal', 'type' => 'expense', 'account_number' => null, 'description' => 'General personal expenses'],
            ['code' => 'P-5020', 'name' => 'Family Expense', 'type' => 'expense', 'account_number' => null, 'description' => 'Family, groceries, dining & household'],
            ['code' => 'P-5030', 'name' => 'Household & Bills', 'type' => 'expense', 'account_number' => null, 'description' => 'Home rent, utilities, internet & bills'],
            ['code' => 'P-5040', 'name' => 'Travel', 'type' => 'expense', 'account_number' => null, 'description' => 'Fuel, parking, flights & travel'],
            ['code' => 'P-5050', 'name' => 'Medical', 'type' => 'expense', 'account_number' => null, 'description' => 'Medical & healthcare expenses'],
            ['code' => 'P-5060', 'name' => 'Entertainment', 'type' => 'expense', 'account_number' => null, 'description' => 'Entertainment & leisure'],
            ['code' => 'P-5070', 'name' => 'Business', 'type' => 'expense', 'account_number' => null, 'description' => 'Business-related personal outlays'],
            ['code' => 'P-5080', 'name' => 'Salary Expense', 'type' => 'expense', 'account_number' => null, 'description' => 'Staff/personal salary payouts'],
            ['code' => 'P-5090', 'name' => 'Bank Charges & Tax', 'type' => 'expense', 'account_number' => null, 'description' => 'Bank transfer charges, VAT & fees'],
            ['code' => 'P-5100', 'name' => 'Adjustment', 'type' => 'expense', 'account_number' => null, 'description' => 'Reconciliation & balance adjustments'],
            ['code' => 'P-5999', 'name' => 'Other Expense', 'type' => 'expense', 'account_number' => null, 'description' => 'Miscellaneous personal expenses'],
        ];

        foreach ($defaults as $acc) {
            PersonalAccount::create($acc);
        }
    }

    public function index(): JsonResponse
    {
        self::ensureDefaultAccounts();

        $accounts = PersonalAccount::orderBy('type')
            ->orderBy('code')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $accounts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:30',
            'name' => 'required|string|max:120',
            'type' => 'required|in:asset,liability,equity,income,expense,ledger',
            'account_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'opening_balance' => 'nullable|numeric',
        ]);

        $account = PersonalAccount::create([
            'user_id' => $request->user()?->id,
            'code' => $validated['code'] ?? null,
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'account_number' => $validated['account_number'] ?? null,
            'description' => $validated['description'] ?? null,
            'opening_balance' => $validated['opening_balance'] ?? 0,
            'current_balance' => $validated['opening_balance'] ?? 0,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Personal account created successfully',
            'data' => $account,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $account = PersonalAccount::findOrFail($id);

        $validated = $request->validate([
            'code' => 'nullable|string|max:30',
            'name' => 'required|string|max:120',
            'type' => 'required|in:asset,liability,equity,income,expense,ledger',
            'account_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'opening_balance' => 'nullable|numeric',
        ]);

        $account->update([
            'code' => $validated['code'] ?? $account->code,
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'account_number' => $validated['account_number'] ?? $account->account_number,
            'description' => $validated['description'] ?? $account->description,
            'opening_balance' => $validated['opening_balance'] ?? $account->opening_balance,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Personal account updated successfully',
            'data' => $account,
        ]);
    }

    public function toggleActive($id): JsonResponse
    {
        $account = PersonalAccount::findOrFail($id);
        $account->is_active = !$account->is_active;
        $account->save();

        return response()->json([
            'success' => true,
            'message' => 'Personal account status updated',
            'data' => $account,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $account = PersonalAccount::findOrFail($id);

        if ($account->bankStatements()->exists() || $account->categorizedTransactions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete account with existing bank statement transactions. Deactivate it instead.',
            ], 422);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Personal account deleted successfully',
        ]);
    }
}
