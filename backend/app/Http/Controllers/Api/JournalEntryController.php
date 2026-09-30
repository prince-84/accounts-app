<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalEntryController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = JournalEntry::with(['lines.account', 'branch'])
            ->orderBy('entry_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->has('voucher_type')) {
            $query->where('voucher_type', $request->voucher_type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $entries = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $entries,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'branch_id' => 'nullable|exists:branches,id',
            'voucher_type' => 'required|in:JV,PV,RV,CV',
            'entry_date' => 'required|date',
            'reference' => 'nullable|string|max:100',
            'narration' => 'nullable|string',
            'currency_code' => 'nullable|string|max:5',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:chart_of_accounts,id',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
        ]);

        try {
            $entry = $this->accountingService->createJournalEntry(
                [
                    'company_id' => $validated['company_id'],
                    'branch_id' => $validated['branch_id'] ?? null,
                    'voucher_type' => $validated['voucher_type'],
                    'entry_date' => $validated['entry_date'],
                    'reference' => $validated['reference'] ?? null,
                    'narration' => $validated['narration'] ?? null,
                    'currency_code' => $validated['currency_code'] ?? null,
                ],
                $validated['lines'],
                true
            );

            return response()->json([
                'success' => true,
                'message' => 'Journal Voucher created and posted successfully',
                'data' => $entry->load('lines.account'),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show($id): JsonResponse
    {
        $entry = JournalEntry::with(['lines.account', 'branch', 'creator'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $entry,
        ]);
    }
}
