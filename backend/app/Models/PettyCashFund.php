<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PettyCashFund extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'account_id',
        'branch_id',
        'fund_name',
        'custodian_name',
        'float_amount',
        'current_balance',
        'is_active',
    ];

    protected $casts = [
        'float_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function vouchers(): HasMany
    {
        return $this->hasMany(PettyCashVoucher::class);
    }

    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }
}
