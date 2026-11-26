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
        Schema::create('personal_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code', 30)->nullable();
            $table->string('name', 120);
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense', 'ledger'])->default('expense');
            $table->string('account_number', 100)->nullable();
            $table->text('description')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0.00);
            $table->decimal('current_balance', 15, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['type', 'is_active']);
        });

        Schema::create('personal_bank_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('personal_account_id')->nullable()->constrained('personal_accounts')->nullOnDelete();
            $table->foreignId('category_account_id')->nullable()->constrained('personal_accounts')->nullOnDelete();
            $table->string('bank_name', 100)->default('ADCB');
            $table->string('account_number', 100)->nullable();
            $table->date('transaction_date');
            $table->text('description');
            $table->decimal('debit', 15, 2)->default(0.00);
            $table->decimal('credit', 15, 2)->default(0.00);
            $table->decimal('balance', 15, 2)->default(0.00);
            $table->string('category', 120)->nullable();
            $table->text('notes')->nullable();
            $table->string('statement_month', 30)->nullable();
            $table->boolean('is_opening')->default(false);
            $table->string('import_batch', 60)->nullable();
            $table->timestamps();

            $table->index(['transaction_date']);
            $table->index(['category']);
            $table->index(['bank_name', 'account_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_bank_statements');
        Schema::dropIfExists('personal_accounts');
    }
};
