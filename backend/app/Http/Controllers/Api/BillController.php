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

class BillController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    public function index(Request $request): JsonResponse
    {
        $bills = Bill::with(['vendor', 'items'])
            ->orderBy('bill_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $bills]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'branch_id' => 'nullable|exists:branches,id',
            'vendor_id' => 'required|exists:vendors,id',
            'vendor_invoice_number' => 'nullable|string|max:100',
            'bill_date' => 'required|date',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.account_id' => 'required|exists:chart_of_accounts,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            $bill = DB::transaction(function () use ($validated) {
                $company = Company::findOrFail($validated['company_id']);

                $count = Bill::where('company_id', $company->id)->count() + 1;
                $billNumber = sprintf('%s-BILL-%05d', $company->company_code, $count);

                $subtotal = 0;
                $taxAmount = 0;

                foreach ($validated['items'] as $item) {
                    $itemTotal = (float) $item['quantity'] * (float) $item['unit_price'];
                    $itemTax = $itemTotal * ((float) $company->tax_rate / 100);
                    $subtotal += $itemTotal;
                    $taxAmount += $itemTax;
                }

                $totalAmount = $subtotal + $taxAmount;

                $bill = Bill::create([
                    'company_id' => $company->id,
                    'branch_id' => $validated['branch_id'] ?? null,
                    'vendor_id' => $validated['vendor_id'],
                    'bill_number' => $billNumber,
                    'vendor_invoice_number' => $validated['vendor_invoice_number'] ?? null,
                    'bill_date' => $validated['bill_date'],
                    'due_date' => $validated['due_date'],
                    'currency_code' => $company->base_currency_code,
                    'exchange_rate' => 1.0,
                    'subtotal' => $subtotal,
                    'tax_rate' => $company->tax_rate,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => 0.00,
                    'due_amount' => $totalAmount,
                    'status' => 'approved',
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    $itemTotal = (float) $item['quantity'] * (float) $item['unit_price'];
                    $itemTax = $itemTotal * ((float) $company->tax_rate / 100);

                    BillItem::create([
                        'company_id' => $company->id,
                        'bill_id' => $bill->id,
                        'account_id' => $item['account_id'],
                        'description' => $item['description'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $company->tax_rate,
                        'tax_amount' => $itemTax,
                        'total_amount' => $itemTotal + $itemTax,
                    ]);
                }

                // Automatically post to General Ledger
                $this->accountingService->postBillToGL($bill);

                return $bill;
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor Bill created and posted to GL successfully',
                'data' => $bill->load(['vendor', 'items']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show($id): JsonResponse
    {
        $bill = Bill::with(['vendor', 'items.account', 'journalEntry.lines.account'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $bill]);
    }

    public function recordPayment(Request $request, $id): JsonResponse
    {
        $bill = Bill::findOrFail($id);

        $validated = $request->validate([
            'account_id' => 'required|exists:chart_of_accounts,id', // Bank/Cash account
            'amount' => 'required|numeric|min:0.01|max:' . $bill->due_amount,
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        try {
            $payment = DB::transaction(function () use ($bill, $validated) {
                $company = Company::findOrFail($bill->company_id);
                $count = Payment::where('company_id', $company->id)->count() + 1;
                $paymentNumber = sprintf('%s-PAY-%05d', $company->company_code, $count);

                $payment = Payment::create([
                    'company_id' => $company->id,
                    'vendor_id' => $bill->vendor_id,
                    'account_id' => $validated['account_id'],
                    'payment_number' => $paymentNumber,
                    'payment_date' => $validated['payment_date'],
                    'amount' => $validated['amount'],
                    'currency_code' => $company->base_currency_code,
                    'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                    'reference_number' => $validated['reference_number'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Post payment to GL
                $this->accountingService->postPaymentToGL($payment);

                // Update bill paid and due amounts
                $bill->paid_amount += (float) $validated['amount'];
                $bill->due_amount -= (float) $validated['amount'];
                $bill->status = ($bill->due_amount <= 0.001) ? 'paid' : 'partially_paid';
                $bill->save();

                return $payment;
            });

            return response()->json([
                'success' => true,
                'message' => 'Payment disbursed and posted to GL successfully',
                'data' => $payment,
                'bill' => $bill,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
