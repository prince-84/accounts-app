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
        Schema::create('currencies', function (Blueprint $table) {
            $table->string('code', 5)->primary();
            $table->string('name');
            $table->string('symbol', 10);
            $table->timestamps();
        });

        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->cascadeOnDelete();
            $table->string('from_currency', 5);
            $table->string('to_currency', 5);
            $table->decimal('rate', 15, 6);
            $table->date('effective_date');
            $table->timestamps();

            $table->foreign('from_currency')->references('code')->on('currencies')->cascadeOnDelete();
            $table->foreign('to_currency')->references('code')->on('currencies')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('currencies');
    }
};
