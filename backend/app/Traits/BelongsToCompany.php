<?php

namespace App\Traits;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::addGlobalScope('company', function (Builder $builder) {
            $companyId = request()->header('X-Company-Id') 
                ?? request()->query('company_id')
                ?? session('active_company_id');

            if ($companyId) {
                $builder->where($builder->getModel()->getTable() . '.company_id', $companyId);
            }
        });

        static::creating(function ($model) {
            if (!$model->company_id) {
                $companyId = request()->header('X-Company-Id') 
                    ?? request()->query('company_id')
                    ?? session('active_company_id');

                if ($companyId) {
                    $model->company_id = $companyId;
                }
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
