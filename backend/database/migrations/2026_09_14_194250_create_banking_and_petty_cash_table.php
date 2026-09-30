<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Linked COA asset account
            $table->string('account_name');
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('iban')->nullable();
            $table->string('swift_code')->nullable();
            $table->string('currency_code', 5)->default('AED');
            $table->decimal('opening_balance', 15, 2)->default(0.00);
            $table->decimal('current_balance', 15, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'account_number']);
        });

        Schema::create('petty_cash_funds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Linked COA asset account
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('fund_name');
            $table->string('custodian_name');
            $table->decimal('float_amount', 15, 2)->default(0.00);
            $table->decimal('current_balance', 15, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('petty_cash_vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('petty_cash_fund_id')->constrained('petty_cash_funds')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Expense account
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('voucher_number', 50);
            $table->date('voucher_date');
            $table->decimal('amount', 15, 2);
            $table->string('paid_to');
            $table->text('description');
            $table->enum('status', ['draft', 'approved', 'posted'])->default('posted');
            $table->timestamps();

            $table->unique(['company_id', 'voucher_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('petty_cash_vouchers');
        Schema::dropIfExists('petty_cash_funds');
        Schema::dropIfExists('bank_accounts');
    }
};
