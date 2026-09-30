<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\Company;
use App\Models\Currency;
use App\Models\PettyCashFund;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    /**
     * Get all active companies.
     */
    public function index(): JsonResponse
    {
        $companies = Company::with('branches')
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $companies,
        ]);
    }

    /**
     * Get a specific company.
     */
    public function show($id): JsonResponse
    {
        $company = Company::with('branches')->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $company,
        ]);
    }

    /**
     * List supported live currencies.
     */
    public function currencies(): JsonResponse
    {
        $currencies = [
            ['code' => 'AED', 'name' => 'UAE Dirham', 'symbol' => 'AED', 'country' => 'United Arab Emirates', 'flag' => '🇦🇪', 'default_tax' => 5.0, 'tax_label' => 'TRN (VAT)'],
            ['code' => 'SAR', 'name' => 'Saudi Riyal', 'symbol' => 'SAR', 'country' => 'Saudi Arabia', 'flag' => '🇸🇦', 'default_tax' => 15.0, 'tax_label' => 'VAT (ZATCA)'],
            ['code' => 'PKR', 'name' => 'Pakistani Rupee', 'symbol' => 'Rs.', 'country' => 'Pakistan', 'flag' => '🇵🇰', 'default_tax' => 18.0, 'tax_label' => 'NTN / STRN'],
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'country' => 'United States', 'flag' => '🇺🇸', 'default_tax' => 0.0, 'tax_label' => 'Sales Tax'],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'country' => 'United Kingdom', 'flag' => '🇬🇧', 'default_tax' => 20.0, 'tax_label' => 'VAT'],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'country' => 'European Union', 'flag' => '🇪🇺', 'default_tax' => 20.0, 'tax_label' => 'VAT'],
            ['code' => 'QAR', 'name' => 'Qatari Riyal', 'symbol' => 'QR', 'country' => 'Qatar', 'flag' => '🇶🇦', 'default_tax' => 0.0, 'tax_label' => 'Tax ID'],
            ['code' => 'KWD', 'name' => 'Kuwaiti Dinar', 'symbol' => 'KD', 'country' => 'Kuwait', 'flag' => '🇰🇼', 'default_tax' => 0.0, 'tax_label' => 'Tax ID'],
            ['code' => 'BHD', 'name' => 'Bahraini Dinar', 'symbol' => 'BD', 'country' => 'Bahrain', 'flag' => '🇧🇭', 'default_tax' => 10.0, 'tax_label' => 'VAT'],
            ['code' => 'OMR', 'name' => 'Omani Rial', 'symbol' => 'OMR', 'country' => 'Oman', 'flag' => '🇴🇲', 'default_tax' => 5.0, 'tax_label' => 'VAT'],
            ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'CA$', 'country' => 'Canada', 'flag' => '🇨🇦', 'default_tax' => 5.0, 'tax_label' => 'GST / HST'],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$', 'country' => 'Australia', 'flag' => '🇦🇺', 'default_tax' => 10.0, 'tax_label' => 'GST'],
            ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹', 'country' => 'India', 'flag' => '🇮🇳', 'default_tax' => 18.0, 'tax_label' => 'GSTIN'],
        ];

        return response()->json([
            'success' => true,
            'data' => $currencies,
        ]);
    }

    /**
     * Create a new company with standard accounts and initial branch.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'country' => 'required|string|max:100',
            'city' => 'nullable|string|max:100',
            'company_code' => 'required|string|max:10|uppercase|unique:companies,company_code',
            'base_currency_code' => 'required|string|max:5',
            'currency_symbol' => 'nullable|string|max:10',
            'tax_registration_number' => 'nullable|string|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_label' => 'nullable|string|max:50',
            'fiscal_year_start_month' => 'nullable|integer|min:1|max:12',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string',
        ]);

        if (empty($validated['legal_name'])) {
            $validated['legal_name'] = $validated['name'];
        }

        if (empty($validated['tax_label'])) {
            $validated['tax_label'] = 'VAT';
        }

        if (!isset($validated['tax_rate'])) {
            $validated['tax_rate'] = 5.00;
        }

        if (empty($validated['currency_symbol'])) {
            $validated['currency_symbol'] = $validated['base_currency_code'];
        }

        $company = DB::transaction(function () use ($validated) {
            $company = Company::create($validated);

            // 1. Create Default Head Office Branch
            $branch = Branch::create([
                'company_id' => $company->id,
                'branch_name' => $company->name . ' - Head Office',
                'branch_code' => $company->company_code . '-HQ',
                'address' => $company->address ?: ($company->city ? $company->city . ', ' . $company->country : $company->country),
                'is_head_office' => true,
                'is_active' => true,
            ]);

            // 2. Standard Enterprise Chart of Accounts
            $standardAccounts = [
                // Assets
                ['code' => '1010', 'name' => 'Main Operating Bank Account', 'type' => 'asset', 'sub_type' => 'bank_cash', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '1020', 'name' => 'Petty Cash Fund', 'type' => 'asset', 'sub_type' => 'bank_cash', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '1030', 'name' => 'Accounts Receivable Control', 'type' => 'asset', 'sub_type' => 'accounts_receivable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '1040', 'name' => 'Input VAT / Tax Receivable', 'type' => 'asset', 'sub_type' => 'tax_receivable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '1050', 'name' => 'Office Equipment & Furniture', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'is_system' => false, 'opening_balance' => 0.00],

                // Liabilities
                ['code' => '2010', 'name' => 'Accounts Payable Control', 'type' => 'liability', 'sub_type' => 'accounts_payable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '2020', 'name' => 'Output VAT / Tax Payable', 'type' => 'liability', 'sub_type' => 'tax_payable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '2030', 'name' => 'Accrued Expenses & Salaries Payable', 'type' => 'liability', 'sub_type' => 'current_liability', 'is_system' => false, 'opening_balance' => 0.00],

                // Equity
                ['code' => '3010', 'name' => "Owner's Share Capital", 'type' => 'equity', 'sub_type' => 'equity', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '3020', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub_type' => 'equity', 'is_system' => true, 'opening_balance' => 0.00],

                // Revenue
                ['code' => '4010', 'name' => 'Operating Revenue / Sales', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '4020', 'name' => 'Consulting & Advisory Services', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '4030', 'name' => 'Other Income', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'is_system' => false, 'opening_balance' => 0.00],

                // Expenses
                ['code' => '5010', 'name' => 'Salaries & Wages', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5020', 'name' => 'Office Rent & Utilities', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5030', 'name' => 'Professional & Legal Compliance', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5040', 'name' => 'Marketing & Advertising', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5050', 'name' => 'Software & Cloud Subscriptions', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5060', 'name' => 'Bank Charges & Transaction Fees', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
            ];

            $createdAccounts = [];
            foreach ($standardAccounts as $acc) {
                $acc['company_id'] = $company->id;
                $acc['current_balance'] = $acc['opening_balance'];
                $createdAccounts[$acc['code']] = ChartOfAccount::create($acc);
            }

            // 3. Create Primary Bank Account
            BankAccount::create([
                'company_id' => $company->id,
                'account_id' => $createdAccounts['1010']->id,
                'account_name' => $company->name . ' Primary Bank',
                'bank_name' => 'Corporate Treasury Bank',
                'currency_code' => $company->base_currency_code,
                'opening_balance' => 0.00,
                'current_balance' => 0.00,
                'account_number' => 'ACC-' . $company->company_code . '-01',
            ]);

            // 4. Create Petty Cash Fund
            PettyCashFund::create([
                'company_id' => $company->id,
                'branch_id' => $branch->id,
                'account_id' => $createdAccounts['1020']->id,
                'fund_name' => 'Head Office Petty Cash',
                'custodian_name' => 'Accounts Manager',
                'float_amount' => 5000.00,
                'current_balance' => 5000.00,
            ]);

            // 5. Link users to company
            $users = User::all();
            foreach ($users as $u) {
                DB::table('user_company')->updateOrInsert(
                    ['user_id' => $u->id, 'company_id' => $company->id],
                    ['role' => 'owner', 'updated_at' => now(), 'created_at' => now()]
                );
            }

            return $company->load('branches');
        });

        return response()->json([
            'success' => true,
            'data' => $company,
            'message' => 'Company created successfully with full Chart of Accounts and banking records',
        ], 201);
    }

    /**
     * Update company settings.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'country' => 'sometimes|required|string|max:100',
            'city' => 'nullable|string|max:100',
            'company_code' => [
                'sometimes',
                'required',
                'string',
                'max:10',
                'uppercase',
                Rule::unique('companies', 'company_code')->ignore($company->id),
            ],
            'base_currency_code' => 'sometimes|required|string|max:5',
            'currency_symbol' => 'nullable|string|max:10',
            'tax_registration_number' => 'nullable|string|max:100',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_label' => 'nullable|string|max:50',
            'fiscal_year_start_month' => 'nullable|integer|min:1|max:12',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $company->update($validated);

        return response()->json([
            'success' => true,
            'data' => $company->load('branches'),
            'message' => 'Company settings updated successfully',
        ]);
    }

    /**
     * Delete a company and all its associated data.
     */
    public function destroy($id): JsonResponse
    {
        $company = Company::find($id);
        if (!$company) {
            $company = Company::where('company_code', $id)->first();
        }

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found or has already been deleted.',
            ], 404);
        }

        if (Company::count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the only remaining company in the system.',
            ], 422);
        }

        $companyName = $company->name;

        DB::transaction(function () use ($company) {
            $company->delete();
        });

        return response()->json([
            'success' => true,
            'message' => "Company '{$companyName}' deleted successfully.",
        ]);
    }
}
