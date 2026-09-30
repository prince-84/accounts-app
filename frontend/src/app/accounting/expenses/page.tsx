"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Paperclip,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default function ExpensesPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [bills, setBills] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // View mode: 'list' | 'create_bill' | 'view_bill'
  const [viewMode, setViewMode] = useState<"list" | "create_bill" | "view_bill">("list");
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  // Quick Vendor Modal
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: "", email: "", phone: "", address: "", tax_number: "" });
  const [savingVendor, setSavingVendor] = useState(false);

  // Payment Modal
  const [payModalBill, setPayModalBill] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccount, setPayAccount] = useState<string>("");
  const [paying, setPaying] = useState(false);

  // New Supplier Bill Form State (matching QuickBooks Image 2)
  const [supplierId, setSupplierId] = useState<string>("");
  const [mailingAddress, setMailingAddress] = useState<string>("");
  const [terms, setTerms] = useState<string>("Net 30");
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [billNo, setBillNo] = useState<string>("");
  const [purchaseLocation, setPurchaseLocation] = useState<string>("AbuDhabi");
  const [memo, setMemo] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<
    { id: number; account_id: string; description: string; quantity: number; unit_price: number }[]
  >([
    { id: 1, account_id: "", description: "", quantity: 1, unit_price: 0 },
    { id: 2, account_id: "", description: "", quantity: 1, unit_price: 0 },
  ]);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getBills(), api.getVendors(), api.getChartOfAccounts()])
      .then(([billsRes, vendorsRes, accountsRes]) => {
        if (billsRes.success) setBills(billsRes.data?.data || billsRes.data || []);
        if (vendorsRes.success) setVendors(vendorsRes.data || []);
        if (accountsRes.success) {
          setAccounts(accountsRes.data || []);
          const bankCash = accountsRes.data.filter(
            (a: any) => a.sub_type === "bank_cash" || a.type === "asset"
          );
          if (bankCash.length > 0) setPayAccount(bankCash[0].id.toString());
        }
      })
      .catch((err) => console.error("Error loading bills data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeCompany.id]);

  // Sync mailing address when supplier is selected
  const handleSupplierChange = (vId: string) => {
    setSupplierId(vId);
    if (vId === "add_new") {
      setShowVendorModal(true);
      return;
    }
    const vendorObj = vendors.find((v) => String(v.id) === vId);
    if (vendorObj) {
      setMailingAddress(vendorObj.address || `${vendorObj.name}\n${vendorObj.email || ""}`);
    } else {
      setMailingAddress("");
    }
  };

  // Line item helpers
  const handleAddLines = () => {
    const nextId = lineItems.length + 1;
    setLineItems([
      ...lineItems,
      { id: nextId, account_id: "", description: "", quantity: 1, unit_price: 0 },
      { id: nextId + 1, account_id: "", description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const handleClearAllLines = () => {
    setLineItems([
      { id: 1, account_id: "", description: "", quantity: 1, unit_price: 0 },
      { id: 2, account_id: "", description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const duplicateLine = (index: number) => {
    const item = lineItems[index];
    const updated = [...lineItems];
    updated.splice(index + 1, 0, { ...item, id: Date.now() });
    setLineItems(updated);
  };

  const deleteLine = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculate Subtotal & Total
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unit_price)) || 0),
    0
  );
  const taxAmount = subtotal * ((activeCompany.taxRate || 5) / 100);
  const totalBillAmount = subtotal + taxAmount;

  // Create Quick Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVendor(true);
    try {
      const res = await api.createVendor({
        company_id: activeCompany.id,
        ...newVendor,
      });
      if (res.success) {
        setShowVendorModal(false);
        setNewVendor({ name: "", email: "", phone: "", address: "", tax_number: "" });
        const updatedVendors = await api.getVendors();
        if (updatedVendors.success) {
          setVendors(updatedVendors.data || []);
          setSupplierId(String(res.data.id));
          setMailingAddress(res.data.address || res.data.name);
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to create supplier");
    } finally {
      setSavingVendor(false);
    }
  };

  // Submit Supplier Bill
  const handleSaveBill = async (saveAndNew: boolean = false) => {
    if (!supplierId || supplierId === "add_new") {
      alert("Please select a supplier");
      return;
    }

    const validItems = lineItems.filter((item) => (parseFloat(String(item.unit_price)) || 0) > 0 || item.description);
    if (validItems.length === 0) {
      alert("Please enter at least one bill item with description or amount.");
      return;
    }

    setSaving(true);
    try {
      const defaultExpenseAccount = accounts.find((a) => a.type === "expense")?.id;

      await api.createBill({
        company_id: activeCompany.id,
        vendor_id: parseInt(supplierId),
        vendor_invoice_number: billNo,
        bill_date: billDate,
        due_date: dueDate,
        notes: memo,
        items: validItems.map((item) => ({
          description: item.description || "Vendor Service / Supply",
          account_id: parseInt(item.account_id) || defaultExpenseAccount,
          quantity: parseFloat(String(item.quantity)) || 1,
          unit_price: parseFloat(String(item.unit_price)) || 0,
        })),
      });

      loadData();

      if (saveAndNew) {
        setSupplierId("");
        setMailingAddress("");
        setBillNo("");
        setMemo("");
        setLineItems([
          { id: 1, account_id: "", description: "", quantity: 1, unit_price: 0 },
          { id: 2, account_id: "", description: "", quantity: 1, unit_price: 0 },
        ]);
      } else {
        setViewMode("list");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save supplier bill");
    } finally {
      setSaving(false);
    }
  };

  // Record Payment against Bill
  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalBill || payAmount <= 0) return;

    setPaying(true);
    try {
      await api.recordBillPayment(payModalBill.id, {
        account_id: parseInt(payAccount),
        amount: payAmount,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        notes: `Payment for bill ${payModalBill.bill_number}`,
      });

      setPayModalBill(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const num = b.bill_number || "";
    const vendor = b.vendor?.name || "";
    return (
      num.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* VIEW MODE 1: CREATE SUPPLIER BILL (QuickBooks UI - Image 2) */}
      {viewMode === "create_bill" ? (
        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-lg overflow-hidden text-xs text-slate-800">
          {/* QuickBooks Top Bar */}
          <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("list")}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Bill</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Balance Due
                </span>
                <span className="text-2xl font-black font-mono text-slate-900">
                  {activeCompany.currency} {totalBillAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-slate-500">
                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer" title="Settings">
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Supplier Info Form */}
          <div className="p-6 space-y-6 bg-slate-50/60">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Supplier Dropdown */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#0F172A]">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="">Choose a supplier</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                  <option value="add_new" className="font-bold text-[#2563EB]">
                    + Add Supplier
                  </option>
                </select>

                {/* Mailing Address Textarea */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#0F172A]">Mailing address</label>
                  <textarea
                    rows={3}
                    value={mailingAddress}
                    onChange={(e) => setMailingAddress(e.target.value)}
                    placeholder="Supplier mailing address..."
                    className="w-full mt-1 rounded-md border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0F172A]">Terms</label>
                <select
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on receipt">Due on receipt</option>
                </select>
              </div>

              {/* Bill Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0F172A]">Bill date</label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0F172A]">Due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              {/* Bill No. */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0F172A]">Bill no.</label>
                <Input
                  placeholder="e.g. INV-9842"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
            </div>

            {/* Purchase Location / Branch */}
            <div className="w-full max-w-xs space-y-1">
              <label className="block text-xs font-semibold text-[#0F172A]">Purchase Location</label>
              <select
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
                className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="AbuDhabi">AbuDhabi</option>
                <option value="Dubai">Dubai Main Branch</option>
                <option value="Riyadh">Riyadh Branch</option>
                <option value="Karachi">Karachi Office</option>
              </select>
            </div>

            {/* Category Items Grid Table */}
            <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center">#</th>
                    <th className="w-64 px-3 py-3">Category</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="w-24 px-3 py-3 text-center">Qty</th>
                    <th className="w-32 px-3 py-3 text-right">Unit Price</th>
                    <th className="w-36 px-3 py-3 text-right">Amount</th>
                    <th className="w-16 px-3 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {lineItems.map((item, index) => {
                    const lineAmount =
                      (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unit_price)) || 0);

                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-center font-mono text-slate-400 font-bold">
                          {index + 1}
                        </td>

                        {/* Category Dropdown */}
                        <td className="px-3 py-2">
                          <select
                            value={item.account_id}
                            onChange={(e) => updateLine(index, "account_id", e.target.value)}
                            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-[#2563EB]"
                          >
                            <option value="">Select Expense Account</option>
                            {accounts
                              .filter((a) => a.type === "expense" || a.type === "asset")
                              .map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                          </select>
                        </td>

                        {/* Description */}
                        <td className="px-3 py-2">
                          <Input
                            placeholder="Description of purchase..."
                            value={item.description}
                            onChange={(e) => updateLine(index, "description", e.target.value)}
                            className="h-8 rounded-lg border-slate-200 text-xs"
                          />
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateLine(index, "quantity", e.target.value)}
                            className="h-8 rounded-lg border-slate-200 text-center font-mono text-xs"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateLine(index, "unit_price", e.target.value)}
                            className="h-8 rounded-lg border-slate-200 text-right font-mono text-xs"
                          />
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(lineAmount)}
                        </td>

                        {/* Action Icons */}
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateLine(index)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy line"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteLine(index)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete line"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Controls */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLines}
                  className="h-8 rounded-lg border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Add lines
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearAllLines}
                  className="h-8 rounded-lg border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Clear all lines
                </Button>
              </div>
            </div>

            {/* Bottom Section: Memo & Attachments & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Memo & Attachments */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A]">Memo</label>
                  <textarea
                    rows={4}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Internal memo or notes..."
                    className="w-full mt-1 rounded-md border border-[#E2E8F0] bg-white p-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A]">Attachments</label>
                  <div className="mt-1 rounded-md border-2 border-dashed border-[#E2E8F0] bg-white p-6 text-center hover:border-[#2563EB] transition">
                    <Paperclip size={24} className="mx-auto text-[#64748B]" />
                    <label className="mt-2 block font-semibold text-[#2563EB] cursor-pointer">
                      Add attachment
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setAttachments([...attachments, ...Array.from(e.target.files)]);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-[#64748B] mt-1">Max file size: 20 MB</p>

                    {attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        {attachments.map((file, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#0F172A] font-medium"
                          >
                            {file.name}
                            <X
                              size={12}
                              className="cursor-pointer text-[#64748B] hover:text-[#0F172A]"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Totals Box Right Side */}
              <div className="flex flex-col justify-end items-end space-y-2 border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-4 md:pt-0 md:pl-6">
                <div className="w-full max-w-xs space-y-2 font-medium text-[#0F172A]">
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Subtotal</span>
                    <span className="font-mono font-bold text-[#0F172A]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0] text-[#64748B]">
                    <span>Tax ({activeCompany.taxRate || 5}%)</span>
                    <span className="font-mono">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-base text-[#0F172A]">
                    <span>Total</span>
                    <span className="font-mono text-xl text-[#2563EB]">
                      {formatCurrency(totalBillAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className="h-9 rounded-md border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="h-9 rounded-md border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <Printer size={14} className="mr-1.5 text-[#64748B]" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Make recurring
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSaveBill(false)}
                className="h-9 rounded-md bg-[#0F172A] text-xs font-semibold text-white hover:bg-[#1E293B] px-4 shadow-xs"
              >
                {saving ? "Saving..." : "Save bill"}
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSaveBill(true)}
                className="h-9 rounded-md bg-[#10B981] text-xs font-semibold text-white hover:bg-[#059669] px-5 shadow-xs"
              >
                {saving ? "Saving..." : "Save and new"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: SUPPLIER BILLS LIST */
        <>
          {/* Page Header matching attached specimen */}
          <PageHeader
            breadcrumbs={["ENTERPRISE TREASURY", "PURCHASES", "BILLS & PAYABLES"]}
            title="Bills & Payables"
            description="Track vendor liabilities, corporate procurement expenses, and manage settlement disbursement schedules."
            actions={
              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => setViewMode("create_bill")}
                  className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#1D4ED8] text-xs cursor-pointer"
                >
                  <Plus size={16} />
                  Record Vendor Bill
                </Button>
              </div>
            }
          />

          {/* Filter & Search Bar */}
          <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                placeholder="Search bill # or supplier name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-md border-[#E2E8F0] bg-[#F8FAFC] pl-9 text-xs text-[#0F172A]"
              />
            </div>
          </div>

          {/* Vendor Bills Table */}
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold uppercase tracking-wider text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3.5">Bill #</th>
                    <th className="px-4 py-3.5">Supplier / Vendor</th>
                    <th className="px-4 py-3.5">Bill Date</th>
                    <th className="px-4 py-3.5">Due Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Total Amount</th>
                    <th className="px-4 py-3.5 text-right">Balance Due</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Loading Supplier Bills...
                      </td>
                    </tr>
                  ) : filteredBills.length > 0 ? (
                    filteredBills.map((b) => {
                      const dueVal = parseFloat(b.due_amount);
                      const isPaid = b.status === "paid" || dueVal <= 0.01;

                      return (
                        <tr key={b.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB]">
                            {b.bill_number}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-[#0F172A]">
                            {b.vendor?.name || "Unknown Supplier"}
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] font-mono text-xs">
                            {formatDateDDMMYYYY(b.bill_date)}
                          </td>
                          <td className="px-4 py-3.5 text-[#64748B] font-mono text-xs">
                            {formatDateDDMMYYYY(b.due_date)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                                isPaid
                                  ? "bg-[#ECFDF5] text-[#059669] border border-[#10B981]/20"
                                  : b.status === "partially_paid"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-[#FEF2F2] text-[#DC2626] border border-[#EF4444]/20"
                              }`}
                            >
                              {b.status?.replace("_", " ") || "approved"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                            {formatCurrency(parseFloat(b.total_amount))}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                            {formatCurrency(dueVal)}
                          </td>
                          <td className="px-4 py-3.5 text-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedBill(b);
                                setViewMode("view_bill");
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#F8FAFC] rounded-md cursor-pointer"
                            >
                              View
                            </button>
                            {!isPaid && (
                              <button
                                onClick={() => {
                                  setPayModalBill(b);
                                  setPayAmount(dueVal);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer"
                              >
                                Pay Bill
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No supplier bills found. Click "Create Vendor Bill" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW BILL MODAL / PAGE */}
      {viewMode === "view_bill" && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Supplier Bill Details
                </span>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">{selectedBill.bill_number}</h2>
              </div>
              <button
                onClick={() => setViewMode("list")}
                className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-[#0F172A]">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B]">Supplier</p>
                <p className="text-sm font-bold text-[#0F172A]">{selectedBill.vendor?.name}</p>
                <p className="text-[11px] text-[#64748B]">{selectedBill.vendor?.address}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-[#64748B]">Bill Date: <span className="font-mono text-[#0F172A]">{formatDateDDMMYYYY(selectedBill.bill_date)}</span></p>
                <p className="text-[11px] font-semibold text-[#64748B]">Due Date: <span className="font-mono text-[#0F172A]">{formatDateDDMMYYYY(selectedBill.due_date)}</span></p>
                <span className="inline-block mt-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#0F172A]">
                  Status: {selectedBill.status}
                </span>
              </div>
            </div>

            {/* Items table */}
            <div className="mt-5 rounded-md border border-[#E2E8F0] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] font-semibold text-[#64748B] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                  {selectedBill.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{it.description}</td>
                      <td className="px-3 py-2 text-center font-mono">{it.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(parseFloat(it.unit_price))}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{formatCurrency(parseFloat(it.total_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col items-end gap-1 font-semibold text-[#0F172A] text-xs">
              <div className="text-[#64748B]">Subtotal: <span className="font-mono font-bold text-[#0F172A]">{formatCurrency(parseFloat(selectedBill.subtotal))}</span></div>
              <div className="text-[#64748B]">Tax: <span className="font-mono font-bold text-[#0F172A]">{formatCurrency(parseFloat(selectedBill.tax_amount))}</span></div>
              <div className="text-sm font-bold text-[#0F172A] pt-1 border-t border-[#E2E8F0]">
                Total Amount: <span className="font-mono text-[#2563EB]">{formatCurrency(parseFloat(selectedBill.total_amount))}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setViewMode("list")}
                className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SUPPLIER MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Add New Supplier</h2>
                <p className="text-[11px] text-[#64748B]">Fill in supplier details</p>
              </div>
              <button
                onClick={() => setShowVendorModal(false)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Supplier Name <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <Input
                  required
                  placeholder="Company or Vendor Name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="vendor@company.com"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Phone</label>
                <Input
                  placeholder="+971 50 123 4567"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Mailing Address</label>
                <textarea
                  rows={2}
                  placeholder="Street address, City, Country"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  className="w-full rounded-md border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVendor}
                  className="h-9 px-4 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {savingVendor ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Record Vendor Payment</h2>
                <p className="text-[11px] text-[#64748B]">Bill #: {payModalBill.bill_number} ({payModalBill.vendor?.name})</p>
              </div>
              <button
                onClick={() => setPayModalBill(null)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePayBill} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Pay From (Bank / Cash Account) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <select
                  value={payAccount}
                  onChange={(e) => setPayAccount(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {accounts
                    .filter((a) => a.sub_type === "bank_cash" || a.type === "asset")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name} ({formatCurrency(parseFloat(acc.current_balance))})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Payment Amount <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  max={payModalBill.due_amount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white font-mono font-bold text-[#0F172A]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setPayModalBill(null)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="h-9 px-4 rounded-md bg-[#10B981] hover:bg-[#059669] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {paying ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
