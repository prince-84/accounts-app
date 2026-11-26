<?php

use App\Http\Controllers\Api\BankingController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\ChartOfAccountController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\PersonalAccountController;
use App\Http\Controllers\Api\PersonalBankStatementController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Middleware\IdentifyCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public company list & currencies
Route::get('/companies', [CompanyController::class, 'index']);
Route::post('/companies', [CompanyController::class, 'store']);
Route::get('/companies/{id}', [CompanyController::class, 'show']);
Route::put('/companies/{id}', [CompanyController::class, 'update']);
Route::delete('/companies/{id}', [CompanyController::class, 'destroy']);
Route::get('/currencies', [CompanyController::class, 'currencies']);

// Company-Scoped API routes
Route::middleware([IdentifyCompany::class])->group(function () {
    // Chart of Accounts
    Route::get('/chart-of-accounts', [ChartOfAccountController::class, 'index']);
    Route::post('/chart-of-accounts', [ChartOfAccountController::class, 'store']);
    Route::put('/chart-of-accounts/{id}', [ChartOfAccountController::class, 'update']);
    Route::post('/chart-of-accounts/{id}/toggle-active', [ChartOfAccountController::class, 'toggleActive']);

    // Journal Entries (Double-Entry Engine)
    Route::get('/journal-entries', [JournalEntryController::class, 'index']);
    Route::post('/journal-entries', [JournalEntryController::class, 'store']);
    Route::get('/journal-entries/{id}', [JournalEntryController::class, 'show']);
    Route::put('/journal-entries/{id}', [JournalEntryController::class, 'update']);
    Route::delete('/journal-entries/{id}', [JournalEntryController::class, 'destroy']);
    Route::post('/journal-entries/bulk-delete', [JournalEntryController::class, 'bulkDestroy']);
    Route::post('/journal-entries/import', [JournalEntryController::class, 'import']);

    // Accounts Receivable (AR): Customers & Invoices
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::post('/invoices/{id}/payment', [InvoiceController::class, 'recordPayment']);

    // Accounts Payable (AP): Vendors & Bills
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::post('/vendors', [VendorController::class, 'store']);
    Route::get('/bills', [BillController::class, 'index']);
    Route::post('/bills', [BillController::class, 'store']);
    Route::get('/bills/{id}', [BillController::class, 'show']);
    Route::post('/bills/{id}/payment', [BillController::class, 'recordPayment']);

    // Banking & Petty Cash
    Route::get('/banking/accounts', [BankingController::class, 'accounts']);
    Route::get('/banking/petty-cash', [BankingController::class, 'pettyCash']);
    Route::post('/banking/petty-cash/voucher', [BankingController::class, 'createPettyCashVoucher']);
    Route::post('/banking/transfer', [BankingController::class, 'transfer']);
    Route::post('/banking/import-statement', [BankingController::class, 'importStatement']);

    // Financial Reports & Live Analytics
    Route::get('/reports/trial-balance', [ReportController::class, 'trialBalance']);
    Route::get('/reports/income-statement', [ReportController::class, 'incomeStatement']);
    Route::get('/reports/balance-sheet', [ReportController::class, 'balanceSheet']);
    Route::get('/reports/ledger', [ReportController::class, 'ledger']);
    Route::get('/reports/dashboard-summary', [ReportController::class, 'dashboardSummary']);
});

// Owner Personal Accounts & Bank Statements (Independent of Corporate Company Scope)
Route::prefix('personal')->group(function () {
    // Personal Chart of Accounts
    Route::get('/accounts', [PersonalAccountController::class, 'index']);
    Route::post('/accounts', [PersonalAccountController::class, 'store']);
    Route::put('/accounts/{id}', [PersonalAccountController::class, 'update']);
    Route::post('/accounts/{id}/toggle-active', [PersonalAccountController::class, 'toggleActive']);
    Route::delete('/accounts/{id}', [PersonalAccountController::class, 'destroy']);

    // Personal Bank Statements & Excel Template
    Route::get('/bank-statements/template', [PersonalBankStatementController::class, 'downloadTemplate']);
    Route::post('/bank-statements/import', [PersonalBankStatementController::class, 'import']);
    Route::post('/bank-statements/bulk-delete', [PersonalBankStatementController::class, 'bulkDestroy']);
    Route::get('/bank-statements', [PersonalBankStatementController::class, 'index']);
    Route::post('/bank-statements', [PersonalBankStatementController::class, 'store']);
    Route::get('/bank-statements/{id}', [PersonalBankStatementController::class, 'show']);
    Route::put('/bank-statements/{id}', [PersonalBankStatementController::class, 'update']);
    Route::delete('/bank-statements/{id}', [PersonalBankStatementController::class, 'destroy']);
});
