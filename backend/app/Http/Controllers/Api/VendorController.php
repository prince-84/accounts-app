<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Vendor;
use App\Services\AccountingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorController extends Controller
{
    public function index(): JsonResponse
    {
        $vendors = Vendor::withCount('bills')->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $vendors]);
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

        $vendor = Vendor::create($validated);
        return response()->json(['success' => true, 'data' => $vendor], 201);
    }
}
