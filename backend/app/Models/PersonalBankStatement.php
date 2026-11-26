<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalBankStatement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'personal_account_id',
        'category_account_id',
        'bank_name',
        'account_number',
        'transaction_date',
        'description',
        'debit',
        'credit',
        'balance',
        'category',
        'notes',
        'statement_month',
        'is_opening',
        'import_batch',
    ];

    protected $casts = [
        'transaction_date' => 'date:Y-m-d',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'balance' => 'decimal:2',
        'is_opening' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function personalAccount(): BelongsTo
    {
        return $this->belongsTo(PersonalAccount::class, 'personal_account_id');
    }

    public function categoryAccount(): BelongsTo
    {
        return $this->belongsTo(PersonalAccount::class, 'category_account_id');
    }
}
