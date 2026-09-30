<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartOfAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = ChartOfAccount::with('parent')
            ->orderBy('code')
            ->get();

        // Group by type
        $grouped = [
            'asset' => $accounts->where('type', 'asset')->values(),
            'liability' => $accounts->where('type', 'liability')->values(),
            'equity' => $accounts->where('type', 'equity')->values(),
            'revenue' => $accounts->where('type', 'revenue')->values(),
            'expense' => $accounts->where('type', 'expense')->values(),
        ];

        return response()->json([
            'success' => true,
            'data' => $accounts,
            'grouped' => $grouped,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'sub_type' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'description' => 'nullable|string',
            'opening_balance' => 'nullable|numeric',
        ]);

        $validated['opening_balance'] = $validated['opening_balance'] ?? 0;
        $validated['current_balance'] = $validated['opening_balance'];

        $account = ChartOfAccount::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'data' => $account->load('parent'),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $account = ChartOfAccount::findOrFail($id);

        if ($account->is_system && $request->has('code') && $request->code !== $account->code) {
            return response()->json([
                'success' => false,
                'message' => 'System account code cannot be modified.',
            ], 422);
        }

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:20',
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:asset,liability,equity,revenue,expense',
            'sub_type' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $account->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'data' => $account->load('parent'),
        ]);
    }

    public function toggleActive($id): JsonResponse
    {
        $account = ChartOfAccount::findOrFail($id);
        
        if ($account->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'System accounts cannot be deactivated.',
            ], 422);
        }

        $account->is_active = !$account->is_active;
        $account->save();

        return response()->json([
            'success' => true,
            'message' => $account->is_active ? 'Account activated' : 'Account deactivated',
            'data' => $account,
        ]);
    }
}

