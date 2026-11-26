<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalAccount;
use App\Models\PersonalBankStatement;
use App\Services\AccountingService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class PersonalBankStatementController extends Controller
{
    /**
     * List Personal Bank Statement transactions (default 20 per page, search, date range, category).
     */
    public function index(Request $request): JsonResponse
    {
        PersonalAccountController::ensureDefaultAccounts();

        $query = PersonalBankStatement::with(['personalAccount', 'categoryAccount'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('personal_account_id')) {
            $query->where('personal_account_id', $request->personal_account_id);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $startDate = $request->query('start_date') ?: $request->query('from_date');
        $endDate = $request->query('end_date') ?: $request->query('to_date');

        if ($startDate) {
            $query->where('transaction_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('transaction_date', '<=', $endDate);
        }

        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('bank_name', 'like', "%{$search}%")
                    ->orWhere('account_number', 'like', "%{$search}%")
                    ->orWhere('statement_month', 'like', "%{$search}%")
                    ->orWhere('transaction_date', 'like', "%{$search}%")
                    ->orWhere('debit', 'like', "%{$search}%")
                    ->orWhere('credit', 'like', "%{$search}%")
                    ->orWhere('balance', 'like', "%{$search}%");
            });
        }

        // Calculate summary over the filtered set
        $summaryQuery = clone $query;
        $totalDebit = (float) $summaryQuery->sum('debit');
        $totalCredit = (float) $summaryQuery->sum('credit');

        $perPage = $request->get('per_page', 20);
        $statements = ($perPage === 'all' || $perPage == -1) ? $query->get() : $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $statements,
            'summary' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'net_flow' => $totalCredit - $totalDebit,
            ],
        ]);
    }

    /**
     * Download the official bank-statement-format.xlsx template.
     */
    public function downloadTemplate(): BinaryFileResponse|JsonResponse
    {
        $path = storage_path('app/templates/bank-statement-format.xlsx');
        if (!file_exists($path)) {
            $rootFallback = base_path('../bank-statement-format.xlsx');
            if (file_exists($rootFallback)) {
                $path = $rootFallback;
            } else {
                return response()->json(['success' => false, 'message' => 'Template file not found'], 404);
            }
        }

        return response()->download($path, 'bank-statement-format.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Manual ADD entry form endpoint.
     */
    public function store(Request $request): JsonResponse
    {
        PersonalAccountController::ensureDefaultAccounts();

        $validated = $request->validate([
            'personal_account_id' => 'nullable|exists:personal_accounts,id',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'transaction_date' => 'required|date',
            'description' => 'required|string',
            'debit' => 'nullable|numeric|min:0',
            'credit' => 'nullable|numeric|min:0',
            'balance' => 'nullable|numeric',
            'category' => 'nullable|string|max:120',
            'notes' => 'nullable|string',
            'statement_month' => 'nullable|string|max:30',
            'is_opening' => 'nullable|boolean',
        ]);

        $debit = (float) ($validated['debit'] ?? 0);
        $credit = (float) ($validated['credit'] ?? 0);
        $isOpening = (bool) ($validated['is_opening'] ?? false);

        if (!$isOpening && $debit <= 0 && $credit <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter either a Debit (Money Out) or Credit (Money In) amount.',
            ], 422);
        }

        $categoryName = isset($validated['category']) ? trim($validated['category']) : null;
        $categoryAccountId = null;
        if ($categoryName) {
            $catAcc = PersonalAccount::firstOrCreate(
                ['name' => $categoryName],
                ['type' => 'expense', 'is_active' => true]
            );
            $categoryAccountId = $catAcc->id;
        }

        $bankAccount = null;
        if (!empty($validated['personal_account_id'])) {
            $bankAccount = PersonalAccount::find($validated['personal_account_id']);
        } else {
            $bankAccount = PersonalAccount::where('type', 'asset')->first();
        }

        $statementMonth = $validated['statement_month']
            ?? Carbon::parse($validated['transaction_date'])->format('M Y');

        $entry = PersonalBankStatement::create([
            'user_id' => $request->user()?->id,
            'personal_account_id' => $bankAccount?->id,
            'category_account_id' => $categoryAccountId,
            'bank_name' => $validated['bank_name'] ?? ($bankAccount?->name ?? 'ADCB'),
            'account_number' => $validated['account_number'] ?? ($bankAccount?->account_number ?? '10500706132001'),
            'transaction_date' => $validated['transaction_date'],
            'description' => trim($validated['description']),
            'debit' => $debit,
            'credit' => $credit,
            'balance' => (float) ($validated['balance'] ?? 0),
            'category' => $categoryName,
            'notes' => $validated['notes'] ?? null,
            'statement_month' => $statementMonth,
            'is_opening' => $isOpening,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bank statement entry added successfully',
            'data' => $entry->load(['personalAccount', 'categoryAccount']),
        ], 201);
    }

    /**
     * Show single bank statement entry.
     */
    public function show($id): JsonResponse
    {
        $entry = PersonalBankStatement::with(['personalAccount', 'categoryAccount'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $entry,
        ]);
    }

    /**
     * Manual EDIT entry form endpoint.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $entry = PersonalBankStatement::findOrFail($id);

        $validated = $request->validate([
            'personal_account_id' => 'nullable|exists:personal_accounts,id',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'transaction_date' => 'required|date',
            'description' => 'required|string',
            'debit' => 'nullable|numeric|min:0',
            'credit' => 'nullable|numeric|min:0',
            'balance' => 'nullable|numeric',
            'category' => 'nullable|string|max:120',
            'notes' => 'nullable|string',
            'statement_month' => 'nullable|string|max:30',
            'is_opening' => 'nullable|boolean',
        ]);

        $debit = (float) ($validated['debit'] ?? 0);
        $credit = (float) ($validated['credit'] ?? 0);
        $isOpening = (bool) ($validated['is_opening'] ?? $entry->is_opening);

        if (!$isOpening && $debit <= 0 && $credit <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter either a Debit (Money Out) or Credit (Money In) amount.',
            ], 422);
        }

        $categoryName = isset($validated['category']) ? trim($validated['category']) : null;
        $categoryAccountId = null;
        if ($categoryName) {
            $catAcc = PersonalAccount::firstOrCreate(
                ['name' => $categoryName],
                ['type' => 'expense', 'is_active' => true]
            );
            $categoryAccountId = $catAcc->id;
        }

        $bankAccount = !empty($validated['personal_account_id'])
            ? PersonalAccount::find($validated['personal_account_id'])
            : $entry->personalAccount;

        $statementMonth = $validated['statement_month']
            ?? Carbon::parse($validated['transaction_date'])->format('M Y');

        $entry->update([
            'personal_account_id' => $bankAccount?->id ?? $entry->personal_account_id,
            'category_account_id' => $categoryAccountId,
            'bank_name' => $validated['bank_name'] ?? $entry->bank_name,
            'account_number' => $validated['account_number'] ?? $entry->account_number,
            'transaction_date' => $validated['transaction_date'],
            'description' => trim($validated['description']),
            'debit' => $debit,
            'credit' => $credit,
            'balance' => (float) ($validated['balance'] ?? $entry->balance),
            'category' => $categoryName,
            'notes' => $validated['notes'] ?? null,
            'statement_month' => $statementMonth,
            'is_opening' => $isOpening,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bank statement entry updated successfully',
            'data' => $entry->load(['personalAccount', 'categoryAccount']),
        ]);
    }

    /**
     * Delete single entry.
     */
    public function destroy($id): JsonResponse
    {
        $entry = PersonalBankStatement::findOrFail($id);
        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bank statement entry deleted successfully',
        ]);
    }

    /**
     * Bulk delete multiple entries.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || count($ids) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No entries selected for deletion.',
            ], 422);
        }

        $deleted = PersonalBankStatement::whereIn('id', $ids)->delete();

        return response()->json([
            'success' => true,
            'message' => "{$deleted} bank statement entries deleted successfully.",
            'count' => $deleted,
        ]);
    }

    /**
     * Import bank-statement-format.xlsx or CSV into personal_bank_statements.
     */
    public function import(Request $request): JsonResponse
    {
        PersonalAccountController::ensureDefaultAccounts();

        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt',
            'personal_account_id' => 'nullable|exists:personal_accounts,id',
            'clear_existing' => 'nullable|in:true,false,1,0',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $clearExisting = filter_var($request->input('clear_existing', false), FILTER_VALIDATE_BOOLEAN);

        try {
            $rows = $ext === 'xlsx'
                ? $this->parseXlsxRows($file->getRealPath())
                : $this->parseCsvRows($file->getRealPath());

            if (count($rows) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No rows found in the uploaded file.',
                ], 422);
            }

            // Detect bank metadata from top rows (e.g. "ADCB Account statement", "ADCB account 10500706132001...")
            $detectedBankName = 'ADCB';
            $detectedAccountNumber = '10500706132001';
            $headerIdx = -1;

            foreach ($rows as $idx => $row) {
                $rowJoined = implode(' ', array_map(fn ($v) => (string) $v, $row));
                if (preg_match('/([A-Z]{2,10})\s+account\s+([0-9]{6,20})/i', $rowJoined, $m)) {
                    $detectedBankName = strtoupper($m[1]);
                    $detectedAccountNumber = $m[2];
                } elseif (preg_match('/([A-Z]{2,10})\s+Account\s+statement/i', $rowJoined, $m)) {
                    $detectedBankName = strtoupper($m[1]);
                }

                // Look for the header row containing Date and Description
                $normalized = array_map(fn ($c) => strtolower(trim((string) $c)), $row);
                if (in_array('date', $normalized) && in_array('description', $normalized)) {
                    $headerIdx = $idx;
                    break;
                }
            }

            if ($headerIdx === -1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not find header row with "Date" and "Description" columns. Please use the bank-statement-format.xlsx template.',
                ], 422);
            }

            // Map header columns dynamically
            $header = array_map(fn ($c) => strtolower(trim((string) $c)), $rows[$headerIdx]);
            $colDate = $this->findCol($header, ['date', 'transaction date']);
            $colDesc = $this->findCol($header, ['description', 'narration', 'details']);
            $colDebit = $this->findCol($header, ['debit (money out)', 'debit', 'money out', 'withdrawal']);
            $colCredit = $this->findCol($header, ['credit (money in)', 'credit', 'money in', 'deposit']);
            $colBalance = $this->findCol($header, ['balance', 'running balance']);
            $colCategory = $this->findCol($header, ['category (pick)', 'category']);
            $colNotes = $this->findCol($header, ['notes', 'note', 'remarks']);
            $colMonth = $this->findCol($header, ['month', 'statement month']);

            $bankAccount = !empty($request->personal_account_id)
                ? PersonalAccount::find($request->personal_account_id)
                : PersonalAccount::where('account_number', $detectedAccountNumber)->first()
                    ?? PersonalAccount::where('type', 'asset')->first();

            $batchId = 'IMP-' . date('YmdHis');
            $importedCount = 0;

            DB::beginTransaction();

            if ($clearExisting && $bankAccount) {
                PersonalBankStatement::where('personal_account_id', $bankAccount->id)->delete();
            }

            for ($i = $headerIdx + 1; $i < count($rows); $i++) {
                $r = $rows[$i];
                $rawDate = trim((string) ($r[$colDate] ?? ''));
                $desc = trim((string) ($r[$colDesc] ?? ''));

                if ($rawDate === '' && $desc === '') {
                    continue;
                }

                $isOpening = strtolower($rawDate) === 'opening' || str_contains(strtolower($desc), 'opening balance');

                $debit = $colDebit !== null ? $this->parseAmount($r[$colDebit] ?? 0) : 0.0;
                $credit = $colCredit !== null ? $this->parseAmount($r[$colCredit] ?? 0) : 0.0;
                $balance = $colBalance !== null ? $this->parseAmount($r[$colBalance] ?? 0) : 0.0;
                $categoryName = $colCategory !== null ? trim((string) ($r[$colCategory] ?? '')) : '';
                $notes = $colNotes !== null ? trim((string) ($r[$colNotes] ?? '')) : '';
                $rawMonth = $colMonth !== null ? trim((string) ($r[$colMonth] ?? '')) : '';

                // Parse transaction date
                if ($isOpening) {
                    // Use the first following transaction date or today
                    $parsedDate = date('Y-m-d');
                    for ($j = $i + 1; $j < count($rows); $j++) {
                        $nextRaw = trim((string) ($rows[$j][$colDate] ?? ''));
                        if ($nextRaw !== '' && strtolower($nextRaw) !== 'opening') {
                            try {
                                $parsedDate = AccountingService::parseFlexibleDate($nextRaw);
                                break;
                            } catch (Exception $e) {
                            }
                        }
                    }
                } else {
                    try {
                        $parsedDate = AccountingService::parseFlexibleDate($rawDate);
                    } catch (Exception $e) {
                        // Skip non-date footer/summary rows
                        continue;
                    }
                }

                // Format month cleanly
                $statementMonth = Carbon::parse($parsedDate)->format('M Y');
                if ($rawMonth !== '') {
                    try {
                        $mDate = AccountingService::parseFlexibleDate($rawMonth);
                        $statementMonth = Carbon::parse($mDate)->format('M Y');
                    } catch (Exception $e) {
                        $statementMonth = substr($rawMonth, 0, 30);
                    }
                }

                // Resolve or create PersonalAccount category
                $categoryAccountId = null;
                if ($categoryName !== '') {
                    $catAcc = PersonalAccount::firstOrCreate(
                        ['name' => $categoryName],
                        ['type' => 'expense', 'is_active' => true]
                    );
                    $categoryAccountId = $catAcc->id;
                }

                PersonalBankStatement::create([
                    'user_id' => $request->user()?->id,
                    'personal_account_id' => $bankAccount?->id,
                    'category_account_id' => $categoryAccountId,
                    'bank_name' => $detectedBankName,
                    'account_number' => $detectedAccountNumber,
                    'transaction_date' => $parsedDate,
                    'description' => $desc ?: ($isOpening ? 'Opening balance' : 'Bank transaction'),
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => $balance,
                    'category' => $categoryName !== '' ? $categoryName : null,
                    'notes' => $notes !== '' ? $notes : null,
                    'statement_month' => $statementMonth,
                    'is_opening' => $isOpening,
                    'import_batch' => $batchId,
                ]);

                $importedCount++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$importedCount} bank statement entries!",
                'count' => $importedCount,
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Parse XLSX natively using ZipArchive + SimpleXML.
     */
    private function parseXlsxRows(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new Exception('Unable to open Excel (.xlsx) file.');
        }

        // 1. Read shared strings
        $sharedStrings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml !== false) {
            $xml = simplexml_load_string($ssXml);
            if ($xml !== false) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Read first worksheet
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw new Exception('Could not find Sheet1 in Excel file.');
        }

        $xml = simplexml_load_string($sheetXml);
        if ($xml === false) {
            throw new Exception('Invalid XML inside Excel worksheet.');
        }

        $rows = [];
        foreach ($xml->sheetData->row as $row) {
            $rowData = [];
            foreach ($row->c as $cell) {
                $ref = (string) $cell['r'];
                $colIdx = $this->colLettersToIndex(preg_replace('/[0-9]+/', '', $ref));
                while (count($rowData) < $colIdx) {
                    $rowData[] = '';
                }

                $type = (string) $cell['t'];
                $val = '';
                if ($type === 's') {
                    $idx = (int) $cell->v;
                    $val = $sharedStrings[$idx] ?? '';
                } elseif ($type === 'inlineStr') {
                    $val = (string) ($cell->is->t ?? '');
                } else {
                    $val = isset($cell->v) ? (string) $cell->v : '';
                }
                $rowData[$colIdx] = $val;
            }
            $rows[] = $rowData;
        }

        return $rows;
    }

    private function parseCsvRows(string $filePath): array
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            while (($data = fgetcsv($handle)) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
        }
        return $rows;
    }

    private function colLettersToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $index = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
        }
        return max(0, $index - 1);
    }

    private function findCol(array $header, array $candidates): ?int
    {
        foreach ($candidates as $c) {
            $idx = array_search($c, $header, true);
            if ($idx !== false) {
                return (int) $idx;
            }
        }
        foreach ($header as $idx => $h) {
            foreach ($candidates as $c) {
                if (str_contains($h, $c)) {
                    return (int) $idx;
                }
            }
        }
        return null;
    }

    private function parseAmount($val): float
    {
        if ($val === null || $val === '') {
            return 0.0;
        }
        $cleaned = str_replace([',', 'AED', 'SAR', 'PKR', ' '], '', (string) $val);
        return is_numeric($cleaned) ? (float) $cleaned : 0.0;
    }
}
