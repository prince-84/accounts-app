<?php

namespace Database\Seeders;

use App\Models\BankAccount;
use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\Company;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\ExchangeRate;
use App\Models\PettyCashFund;
use App\Models\User;
use App\Models\Vendor;
use App\Services\AccountingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Currencies
        $currencies = [
            ['code' => 'AED', 'name' => 'UAE Dirham', 'symbol' => 'AED'],
            ['code' => 'SAR', 'name' => 'Saudi Riyal', 'symbol' => 'SAR'],
            ['code' => 'PKR', 'name' => 'Pakistani Rupee', 'symbol' => 'Rs.'],
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£'],
        ];

        foreach ($currencies as $curr) {
            Currency::updateOrCreate(['code' => $curr['code']], $curr);
        }

        // 2. Default User
        $user = User::updateOrCreate(
            ['email' => 'admin@accounts.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        // 3. The 3 Companies
        $companiesData = [
            [
                'id' => 1,
                'name' => 'The 5th Dimension Corporate Consultancy',
                'legal_name' => 'The 5th Dimension Corporate Consultancy LLC',
                'country' => 'United Arab Emirates',
                'company_code' => 'DXB',
                'base_currency_code' => 'AED',
                'tax_registration_number' => '100234567800003',
                'tax_rate' => 5.00,
                'tax_label' => 'TRN (VAT)',
                'address' => 'Floor 28, Boulevard Plaza Tower 1, Downtown Dubai, UAE',
            ],
            [
                'id' => 2,
                'name' => 'Ascension',
                'legal_name' => 'Ascension Management Consulting Co.',
                'country' => 'Saudi Arabia',
                'company_code' => 'KSA',
                'base_currency_code' => 'SAR',
                'tax_registration_number' => '310123456700003',
                'tax_rate' => 15.00,
                'tax_label' => 'VAT (ZATCA)',
                'address' => 'King Fahd Road, Al Olaya, Riyadh 12213, Saudi Arabia',
            ],
            [
                'id' => 3,
                'name' => 'Brysona Consulting (PVT) Ltd',
                'legal_name' => 'Brysona Consulting (PVT) Ltd',
                'country' => 'Pakistan',
                'company_code' => 'PK',
                'base_currency_code' => 'PKR',
                'tax_registration_number' => '8472910-4',
                'tax_rate' => 18.00,
                'tax_label' => 'NTN / STRN',
                'address' => 'Suite 402, Business Avenue, Shahrah-e-Faisal, Karachi, Pakistan',
            ],
        ];

        $accountingService = new AccountingService();

        foreach ($companiesData as $cData) {
            $company = Company::updateOrCreate(['id' => $cData['id']], $cData);

            // User Company link
            DB::table('user_company')->updateOrInsert(
                ['user_id' => $user->id, 'company_id' => $company->id],
                ['role' => 'owner', 'updated_at' => now(), 'created_at' => now()]
            );

            // Default Head Office Branch
            $branch = Branch::updateOrCreate(
                ['company_id' => $company->id, 'branch_code' => $company->company_code . '-HQ'],
                [
                    'branch_name' => $company->name . ' - Head Office',
                    'is_head_office' => true,
                    'is_active' => true,
                    'address' => $company->address,
                ]
            );

            // 4. Standard Chart of Accounts
            $accounts = [
                // Assets
                ['code' => '1010', 'name' => 'Main Operating Bank Account', 'type' => 'asset', 'sub_type' => 'bank_cash', 'is_system' => true, 'opening_balance' => 150000.00],
                ['code' => '1020', 'name' => 'Petty Cash Fund', 'type' => 'asset', 'sub_type' => 'bank_cash', 'is_system' => true, 'opening_balance' => 5000.00],
                ['code' => '1030', 'name' => 'Accounts Receivable Control', 'type' => 'asset', 'sub_type' => 'accounts_receivable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '1040', 'name' => 'Input VAT / Tax Receivable', 'type' => 'asset', 'sub_type' => 'tax_receivable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '1050', 'name' => 'Office Equipment & Laptops', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'is_system' => false, 'opening_balance' => 45000.00],

                // Liabilities
                ['code' => '2010', 'name' => 'Accounts Payable Control', 'type' => 'liability', 'sub_type' => 'accounts_payable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '2020', 'name' => 'Output VAT / Tax Payable', 'type' => 'liability', 'sub_type' => 'tax_payable', 'is_system' => true, 'opening_balance' => 0.00],
                ['code' => '2030', 'name' => 'Accrued Expenses & Salaries Payable', 'type' => 'liability', 'sub_type' => 'current_liability', 'is_system' => false, 'opening_balance' => 12000.00],

                // Equity
                ['code' => '3010', 'name' => "Owner's Share Capital", 'type' => 'equity', 'sub_type' => 'equity', 'is_system' => true, 'opening_balance' => 150000.00],
                ['code' => '3020', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub_type' => 'equity', 'is_system' => true, 'opening_balance' => 38000.00],

                // Revenue
                ['code' => '4010', 'name' => 'Corporate Advisory Services', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '4020', 'name' => 'Taxation & Audit Consulting', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '4030', 'name' => 'Business Setup & Licensing Fees', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'is_system' => false, 'opening_balance' => 0.00],

                // Expenses
                ['code' => '5010', 'name' => 'Salaries & Consultant Fees', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5020', 'name' => 'Office Rent & Workspace Lease', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5030', 'name' => 'Professional & Legal Compliance', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5040', 'name' => 'Travel, Visa & Logistics', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5050', 'name' => 'Cloud & Software Subscriptions', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
                ['code' => '5060', 'name' => 'Bank Charges & Transaction Fees', 'type' => 'expense', 'sub_type' => 'operating_expense', 'is_system' => false, 'opening_balance' => 0.00],
            ];

            $createdAccounts = [];
            foreach ($accounts as $acc) {
                $acc['company_id'] = $company->id;
                $acc['current_balance'] = $acc['opening_balance'];
                $createdAccounts[$acc['code']] = ChartOfAccount::updateOrCreate(
                    ['company_id' => $company->id, 'code' => $acc['code']],
                    $acc
                );
            }

            // Bank Account setup
            BankAccount::updateOrCreate(
                ['company_id' => $company->id, 'account_number' => 'ACC-' . $company->company_code . '-01'],
                [
                    'account_id' => $createdAccounts['1010']->id,
                    'account_name' => $company->name . ' Primary Bank',
                    'bank_name' => $company->country === 'United Arab Emirates' ? 'Emirates NBD' : ($company->country === 'Saudi Arabia' ? 'Al Rajhi Bank' : 'Habib Bank Limited (HBL)'),
                    'currency_code' => $company->base_currency_code,
                    'opening_balance' => 150000.00,
                    'current_balance' => 150000.00,
                    'iban' => $company->company_code . '9876543210123456',
                ]
            );

            // Petty Cash Fund setup
            PettyCashFund::updateOrCreate(
                ['company_id' => $company->id, 'fund_name' => 'Office Petty Cash Float'],
                [
                    'account_id' => $createdAccounts['1020']->id,
                    'branch_id' => $branch->id,
                    'custodian_name' => 'Operations Manager',
                    'float_amount' => 5000.00,
                    'current_balance' => 5000.00,
                ]
            );

            // Seed sample Customers
            $customer1 = Customer::updateOrCreate(
                ['company_id' => $company->id, 'email' => 'finance@apexglobal.com'],
                [
                    'name' => 'Apex Global Logistics',
                    'phone' => '+971 4 800 1234',
                    'tax_number' => 'TRN-APEX-8899',
                    'address' => 'Business Bay, Tower 4, Suite 1202',
                    'opening_balance' => 0.00,
                    'current_balance' => 0.00,
                ]
            );

            $customer2 = Customer::updateOrCreate(
                ['company_id' => $company->id, 'email' => 'accounts@novainnovations.io'],
                [
                    'name' => 'Nova Innovations FZCO',
                    'phone' => '+971 4 900 5678',
                    'tax_number' => 'TRN-NOVA-3344',
                    'address' => 'DSO HQ Building, Dubai Silicon Oasis',
                    'opening_balance' => 0.00,
                    'current_balance' => 0.00,
                ]
            );

            // Seed sample Vendors
            $vendor1 = Vendor::updateOrCreate(
                ['company_id' => $company->id, 'email' => 'billing@datacenter.net'],
                [
                    'name' => 'CloudScale Infrastructure',
                    'phone' => '+1 800 555 0199',
                    'tax_number' => 'VEND-CS-1010',
                    'address' => 'Tech Hub, Silicon Valley, CA',
                    'opening_balance' => 0.00,
                    'current_balance' => 0.00,
                ]
            );

            // Create initial sample Journal Voucher via AccountingService
            try {
                $accountingService->createJournalEntry([
                    'company_id' => $company->id,
                    'branch_id' => $branch->id,
                    'voucher_type' => 'JV',
                    'entry_date' => now()->format('Y-m-d'),
                    'reference' => 'SETUP-001',
                    'narration' => 'Opening Balance Equity & Asset Recognition',
                    'currency_code' => $company->base_currency_code,
                    'exchange_rate' => 1.0,
                ], [
                    [
                        'account_id' => $createdAccounts['1050']->id, // Dr. Office Equipment
                        'description' => 'Office Hardware & IT Setup',
                        'debit' => 15000.00,
                        'credit' => 0,
                    ],
                    [
                        'account_id' => $createdAccounts['3010']->id, // Cr. Share Capital
                        'description' => 'Capital injection in equipment',
                        'debit' => 0,
                        'credit' => 15000.00,
                    ]
                ], true);
            } catch (\Exception $e) {
                // Keep moving if duplicate
            }
        }
    }
}
