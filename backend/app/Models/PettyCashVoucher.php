<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCashVoucher extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'petty_cash_fund_id',
        'account_id',
        'journal_entry_id',
        'voucher_number',
        'voucher_date',
        'amount',
        'paid_to',
        'description',
        'status',
    ];

    protected $casts = [
        'voucher_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(PettyCashFund::class, 'petty_cash_fund_id');
    }

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }
}
