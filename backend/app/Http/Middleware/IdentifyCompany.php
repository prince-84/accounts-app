<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyCompany
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $companyId = $request->header('X-Company-Id') 
            ?? $request->query('company_id')
            ?? session('active_company_id');

        if ($companyId) {
            $company = Company::find($companyId);
            if ($company) {
                // Share active company across the app request
                app()->instance('activeCompany', $company);
            }
        }

        return $next($request);
    }
}
