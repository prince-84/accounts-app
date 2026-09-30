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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Bank or Cash Account
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('receipt_number', 50);
            $table->date('receipt_date');
            $table->decimal('amount', 15, 2);
            $table->string('currency_code', 5)->default('AED');
            $table->decimal('exchange_rate', 15, 6)->default(1.000000);
            $table->string('payment_method', 50)->default('bank_transfer');
            $table->string('reference_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'receipt_number']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('chart_of_accounts')->cascadeOnDelete(); // Bank or Cash Account
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('payment_number', 50);
            $table->date('payment_date');
            $table->decimal('amount', 15, 2);
            $table->string('currency_code', 5)->default('AED');
            $table->decimal('exchange_rate', 15, 6)->default(1.000000);
            $table->string('payment_method', 50)->default('bank_transfer');
            $table->string('reference_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'payment_number']);
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('payable_type'); // Invoice or Bill
            $table->unsignedBigInteger('payable_id');
            $table->string('payment_type'); // Receipt or Payment
            $table->unsignedBigInteger('payment_id');
            $table->decimal('allocated_amount', 15, 2);
            $table->timestamps();

            $table->index(['payable_type', 'payable_id']);
            $table->index(['payment_type', 'payment_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('receipts');
    }
};
