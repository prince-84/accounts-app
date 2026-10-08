<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $entries = $query->paginate($request->get('per_page', 50));

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

    public function destroy($id): JsonResponse
    {
        try {
            $this->accountingService->deleteJournalEntry((int)$id);
            return response()->json([
                'success' => true,
                'message' => 'Journal entry deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function import(Request $request): JsonResponse
    {
        $companyId = $request->header('X-Company-Id') 
            ?? $request->input('company_id') 
            ?? (app()->bound('activeCompany') ? app('activeCompany')->id : null);

        if (!$companyId) {
            return response()->json(['success' => false, 'message' => 'Active company identification is required.'], 422);
        }

        $rawRows = [];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->getRealPath();
            $handle = fopen($path, 'r');
            if ($handle !== false) {
                $header = fgetcsv($handle);
                if (!$header) {
                    return response()->json(['success' => false, 'message' => 'Uploaded CSV file is empty.'], 422);
                }

                $cleanHeaders = array_map(function($h) {
                    return strtolower(trim(str_replace([' ', '_', '-', '/', '\\'], '', (string)$h)));
                }, $header);

                while (($data = fgetcsv($handle)) !== false) {
                    if (empty(array_filter($data))) continue;
                    $row = [];
                    foreach ($cleanHeaders as $idx => $key) {
                        $row[$key] = isset($data[$idx]) ? trim($data[$idx]) : '';
                    }
                    $rawRows[] = $row;
                }
                fclose($handle);
            }
        } elseif ($request->has('entries')) {
            $rawRows = $request->input('entries');
        } elseif ($request->has('rows')) {
            $rawRows = $request->input('rows');
        } else {
            return response()->json(['success' => false, 'message' => 'Please provide a CSV file or journal entries array.'], 422);
        }

        if (empty($rawRows)) {
            return response()->json(['success' => false, 'message' => 'No journal entry rows found to import.'], 422);
        }

        // Fetch company accounts for mapping
        $accounts = ChartOfAccount::where('company_id', $companyId)->get();
        $accountByCode = [];
        $accountByName = [];
        foreach ($accounts as $acc) {
            $accountByCode[strtolower(trim($acc->code))] = $acc;
            $accountByName[strtolower(trim($acc->name))] = $acc;
        }

        // Group rows by voucher
        $groups = [];
        foreach ($rawRows as $idx => $row) {
            $date = $row['date'] ?? $row['entrydate'] ?? $row['voucherdate'] ?? date('Y-m-d');
            $ref = $row['reference'] ?? $row['ref'] ?? $row['voucherno'] ?? $row['voucher'] ?? $row['entrynumber'] ?? '';
            $narration = $row['narration'] ?? $row['description'] ?? $row['memo'] ?? 'Imported Journal Voucher';
            $accIdentifier = $row['accountcode'] ?? $row['code'] ?? $row['account'] ?? $row['accountname'] ?? '';
            $debit = (float)str_replace(',', '', (string)($row['debit'] ?? $row['dr'] ?? 0));
            $credit = (float)str_replace(',', '', (string)($row['credit'] ?? $row['cr'] ?? 0));

            $groupKey = trim($ref) !== '' ? "REF_{$ref}_{$date}" : "MEMO_{$narration}_{$date}";

            $accKey = strtolower(trim($accIdentifier));
            $matchedAccount = $accountByCode[$accKey] ?? $accountByName[$accKey] ?? null;

            if (!$matchedAccount) {
                return response()->json([
                    'success' => false,
                    'message' => "Row #" . ($idx + 1) . ": Account '{$accIdentifier}' not found in Chart of Accounts for this company. Please create or rename it first.",
                ], 422);
            }

            if (!isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'company_id' => $companyId,
                    'voucher_type' => 'JV',
                    'entry_date' => date('Y-m-d', strtotime($date)),
                    'reference' => $ref ?: 'IMPORT',
                    'narration' => $narration,
                    'lines' => [],
                ];
            }

            $groups[$groupKey]['lines'][] = [
                'account_id' => $matchedAccount->id,
                'description' => $narration,
                'debit' => $debit,
                'credit' => $credit,
            ];
        }

        // Validate balancing and create each voucher
        $created = [];
        DB::beginTransaction();
        try {
            foreach ($groups as $groupKey => $group) {
                $totalDebit = array_sum(array_column($group['lines'], 'debit'));
                $totalCredit = array_sum(array_column($group['lines'], 'credit'));

                if (abs($totalDebit - $totalCredit) > 0.02) {
                    throw new Exception("Voucher '{$group['reference']}' ({$group['entry_date']}) is unbalanced. Total Debit: {$totalDebit}, Total Credit: {$totalCredit}.");
                }

                if (count($group['lines']) < 2) {
                    throw new Exception("Voucher '{$group['reference']}' must have at least 2 lines (debit and credit).");
                }

                $entry = $this->accountingService->createJournalEntry(
                    [
                        'company_id' => $group['company_id'],
                        'voucher_type' => $group['voucher_type'],
                        'entry_date' => $group['entry_date'],
                        'reference' => $group['reference'],
                        'narration' => $group['narration'],
                    ],
                    $group['lines'],
                    true
                );

                $created[] = $entry;
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully imported ' . count($created) . ' journal vouchers (' . count($rawRows) . ' lines)',
                'count' => count($created),
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}
