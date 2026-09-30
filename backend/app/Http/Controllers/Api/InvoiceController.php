<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Receipt;
use App\Services\AccountingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['customer', 'items'])
            ->orderBy('invoice_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $invoices]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'branch_id' => 'nullable|exists:branches,id',
            'customer_id' => 'required|exists:customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.account_id' => 'nullable|exists:chart_of_accounts,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            $invoice = DB::transaction(function () use ($validated) {
                $company = Company::findOrFail($validated['company_id']);

                $count = Invoice::where('company_id', $company->id)->count() + 1;
                $invoiceNumber = sprintf('%s-INV-%05d', $company->company_code, $count);

                $subtotal = 0;
                $taxAmount = 0;

                foreach ($validated['items'] as $item) {
                    $itemTotal = (float) $item['quantity'] * (float) $item['unit_price'];
                    $itemTax = $itemTotal * ((float) $company->tax_rate / 100);
                    $subtotal += $itemTotal;
                    $taxAmount += $itemTax;
                }

                $totalAmount = $subtotal + $taxAmount;

                $invoice = Invoice::create([
                    'company_id' => $company->id,
                    'branch_id' => $validated['branch_id'] ?? null,
                    'customer_id' => $validated['customer_id'],
                    'invoice_number' => $invoiceNumber,
                    'invoice_date' => $validated['invoice_date'],
                    'due_date' => $validated['due_date'],
                    'currency_code' => $company->base_currency_code,
                    'exchange_rate' => 1.0,
                    'subtotal' => $subtotal,
                    'tax_rate' => $company->tax_rate,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => 0.00,
                    'due_amount' => $totalAmount,
                    'status' => 'sent',
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    $itemTotal = (float) $item['quantity'] * (float) $item['unit_price'];
                    $itemTax = $itemTotal * ((float) $company->tax_rate / 100);

                    InvoiceItem::create([
                        'company_id' => $company->id,
                        'invoice_id' => $invoice->id,
                        'account_id' => $item['account_id'] ?? null,
                        'description' => $item['description'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $company->tax_rate,
                        'tax_amount' => $itemTax,
                        'total_amount' => $itemTotal + $itemTax,
                    ]);
                }

                // Automatically post to General Ledger
                $this->accountingService->postInvoiceToGL($invoice);

                return $invoice;
            });

            return response()->json([
                'success' => true,
                'message' => 'Invoice created and posted to GL successfully',
                'data' => $invoice->load(['customer', 'items']),
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
        $invoice = Invoice::with(['customer', 'items.account', 'journalEntry.lines.account'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $invoice]);
    }

    public function recordPayment(Request $request, $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'account_id' => 'required|exists:chart_of_accounts,id', // Bank/Cash account
            'amount' => 'required|numeric|min:0.01|max:' . $invoice->due_amount,
            'receipt_date' => 'required|date',
            'payment_method' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        try {
            $receipt = DB::transaction(function () use ($invoice, $validated) {
                $company = Company::findOrFail($invoice->company_id);
                $count = Receipt::where('company_id', $company->id)->count() + 1;
                $receiptNumber = sprintf('%s-REC-%05d', $company->company_code, $count);

                $receipt = Receipt::create([
                    'company_id' => $company->id,
                    'customer_id' => $invoice->customer_id,
                    'account_id' => $validated['account_id'],
                    'receipt_number' => $receiptNumber,
                    'receipt_date' => $validated['receipt_date'],
                    'amount' => $validated['amount'],
                    'currency_code' => $company->base_currency_code,
                    'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                    'reference_number' => $validated['reference_number'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Post receipt to General Ledger
                $this->accountingService->postReceiptToGL($receipt);

                // Update invoice paid and due amounts
                $invoice->paid_amount += (float) $validated['amount'];
                $invoice->due_amount -= (float) $validated['amount'];
                $invoice->status = ($invoice->due_amount <= 0.001) ? 'paid' : 'partially_paid';
                $invoice->save();

                return $receipt;
            });

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded and posted to GL successfully',
                'data' => $receipt,
                'invoice' => $invoice,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
