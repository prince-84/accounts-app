<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Receipt;
use App\Services\AccountingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        $customers = Customer::withCount('invoices')->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $customers]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'tax_number' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'opening_balance' => 'nullable|numeric',
        ]);

        $validated['opening_balance'] = $validated['opening_balance'] ?? 0;
        $validated['current_balance'] = $validated['opening_balance'];

        $customer = Customer::create($validated);
        return response()->json(['success' => true, 'data' => $customer], 201);
    }
}
