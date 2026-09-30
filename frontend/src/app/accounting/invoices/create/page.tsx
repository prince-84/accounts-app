"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  FileCheck,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { activeCompany, formatCurrency } = useCompany();

  const [customers, setCustomers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_number: "",
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Form State for Invoice Builder
  const [customerId, setCustomerId] = useState<string>("");
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [terms, setTerms] = useState<string>("Net 30");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState<string>(
    `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [corporateDiscount, setCorporateDiscount] = useState<number>(0);
  const [paymentOptions, setPaymentOptions] = useState<string>(
    "Please remit settlement via ACH to J.P. Morgan Treasury Ledger #8472-9901-AC. 1.5% interest accrued on past due net terms."
  );
  const [noteToCustomer, setNoteToCustomer] = useState<string>(
    "Thank you for your enterprise partnership. Tax-compliant collection schedule."
  );
  const [saving, setSaving] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<
    { id: number; account_id: string; description: string; quantity: number; unit_price: number }[]
  >([
    {
      id: 1,
      account_id: "",
      description: "Enterprise Financial Architecture & Audit",
      quantity: 1,
      unit_price: 6500,
    },
    {
      id: 2,
      account_id: "",
      description: "Cloud Infrastructure Reconciliation",
      quantity: 20,
      unit_price: 150,
    },
  ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCustomers(), api.getChartOfAccounts()])
      .then(([customersRes, accountsRes]) => {
        if (customersRes.success) setCustomers(customersRes.data || []);
        if (accountsRes.success) setAccounts(accountsRes.data || []);
      })
      .catch((err) => console.error("Error loading invoice dependencies:", err))
      .finally(() => setLoading(false));
  }, [activeCompany.id]);

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    if (cId === "add_new") {
      setShowCustomerModal(true);
      return;
    }
    const customerObj = customers.find((c) => String(c.id) === cId);
    if (customerObj) {
      setBillingAddress(customerObj.address || `${customerObj.name}\n${customerObj.email || ""}`);
    } else {
      setBillingAddress("");
    }
  };

  const handleAddLines = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), account_id: "", description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const deleteLine = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unit_price)) || 0),
    0
  );
  const taxRate = activeCompany.taxRate || 5;
  const taxAmount =
    subtotal - corporateDiscount > 0
      ? (subtotal - corporateDiscount) * (taxRate / 100)
      : 0;
  const totalInvoiceAmount = Math.max(0, subtotal - corporateDiscount + taxAmount);

  // Submit Invoice
  const handleSaveInvoice = async (sendInvoice: boolean = false) => {
    if (!customerId || customerId === "add_new") {
      alert("Please select a customer");
      return;
    }

    const validItems = lineItems.filter(
      (item) => (parseFloat(String(item.unit_price)) || 0) > 0 || item.description
    );
    if (validItems.length === 0) {
      alert("Please enter at least one line item with description or amount.");
      return;
    }

    setSaving(true);
    try {
      const defaultRevenueAccount = accounts.find((a) => a.type === "revenue")?.id;

      await api.createInvoice({
        company_id: activeCompany.id,
        customer_id: parseInt(customerId),
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes: `${noteToCustomer}\nCorporate Discount: ${corporateDiscount}\n${paymentOptions}`,
        items: validItems.map((item) => ({
          description: item.description || "Enterprise Consulting Service",
          account_id: parseInt(item.account_id) || defaultRevenueAccount,
          quantity: parseFloat(String(item.quantity)) || 1,
          unit_price: parseFloat(String(item.unit_price)) || 0,
        })),
      });

      alert(
        sendInvoice
          ? "Invoice created and sent to customer!"
          : "Draft invoice saved successfully!"
      );
      router.push("/accounting/invoices");
    } catch (err: any) {
      alert(err.message || "Failed to save customer invoice");
    } finally {
      setSaving(false);
    }
  };

  // Create Quick Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCustomer(true);
    try {
      const res = await api.createCustomer({
        company_id: activeCompany.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        tax_number: newCustomer.tax_number,
      });
      if (res.success) {
        const created = res.data;
        setCustomers((prev) => [...prev, created]);
        setCustomerId(String(created.id));
        setBillingAddress(created.address || `${created.name}\n${created.email || ""}`);
        setShowCustomerModal(false);
        setNewCustomer({ name: "", email: "", phone: "", address: "", tax_number: "" });
      }
    } catch (err: any) {
      alert(err.message || "Failed to create quick customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Builder"
        description="Interactive Draft Specimen & Direct Ledger Posting"
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/dashboard" },
          { label: "Invoices", href: "/accounting/invoices" },
          { label: "Create Invoice" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/accounting/invoices">
              <Button
                variant="outline"
                className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} className="text-[#64748B]" />
                Back to Invoices
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => handleSaveInvoice(false)}
              className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Save Draft
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={() => handleSaveInvoice(true)}
              className="h-9 rounded-md bg-[#2563EB] px-5 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] inline-flex items-center gap-2 cursor-pointer"
            >
              <Send size={14} />
              {saving ? "Transmitting..." : "Send Invoice"}
            </Button>
          </div>
        }
      />

      {/* INVOICE BUILDER CARD */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-xs space-y-6">
        {/* Specimen Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB]">
              <FileCheck size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Invoice Builder</h2>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Interactive Draft Specimen
              </p>
            </div>
          </div>

          <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#64748B]">
            Draft State
          </span>
        </div>

        {/* Customer Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#0F172A]">
            Customer <span className="text-[#EF4444] ml-0.5">*</span>
          </label>
          <div className="relative">
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 pr-10 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none shadow-2xs appearance-none"
            >
              <option value="">Select customer (e.g. Figma Design Systems ap@figma.com)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email || "no-email"})
                </option>
              ))}
              <option value="add_new" className="font-bold text-[#2563EB]">
                + Add New Customer
              </option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
          </div>
        </div>

        {/* 4 Metadata Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Invoice ID
            </label>
            <Input
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="h-9 rounded-md border-[#E2E8F0] bg-[#F8FAFC] font-mono text-xs font-bold text-[#0F172A]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Payment Terms
            </label>
            <div className="relative">
              <select
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none appearance-none"
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Issue Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-mono text-[#0F172A]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Due Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-mono text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        {/* Billable Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Billable Line Items
            </h4>
            <button
              type="button"
              onClick={handleAddLines}
              className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              Add Item
            </button>
          </div>

          <div className="space-y-2.5">
            {lineItems.map((item, index) => {
              const lineTotal =
                (parseFloat(String(item.quantity)) || 0) *
                (parseFloat(String(item.unit_price)) || 0);

              return (
                <div
                  key={item.id}
                  className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC]/60 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Line item description (e.g. Enterprise Financial Architecture & Audit)"
                      value={item.description}
                      onChange={(e) => updateLine(index, "description", e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteLine(index)}
                      className="text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                        QTY
                      </span>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLine(index, "quantity", e.target.value)}
                        className="h-8 rounded-md border-[#E2E8F0] bg-white font-mono text-xs text-[#0F172A]"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                        RATE
                      </span>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLine(index, "unit_price", e.target.value)}
                        className="h-8 rounded-md border-[#E2E8F0] bg-white font-mono text-xs text-right text-[#0F172A]"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                        TAX
                      </span>
                      <div className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 flex items-center font-mono text-xs text-[#64748B]">
                        {taxRate}%
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#64748B] text-right mb-1">
                        TOTAL
                      </span>
                      <div className="h-8 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 flex items-center justify-end font-mono font-bold text-xs text-[#0F172A]">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Summary & Total Balance */}
        <div className="flex flex-col items-end gap-1.5 pt-4 border-t border-[#E2E8F0] text-xs">
          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex justify-between text-[#64748B]">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-[#0F172A]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Sales Tax ({taxRate}.0%)</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-[#64748B]">
              <span>Corporate Discount</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[#EF4444] font-bold">
                  -{formatCurrency(corporateDiscount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-[#E2E8F0]">
              <span className="text-base font-extrabold text-[#0F172A]">Total Balance</span>
              <span className="text-2xl font-black font-mono text-[#2563EB]">
                {formatCurrency(totalInvoiceAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Instructions */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-[#0F172A]">
            Terms & Instructions
          </label>
          <textarea
            rows={2}
            value={paymentOptions}
            onChange={(e) => setPaymentOptions(e.target.value)}
            className="w-full rounded-md border border-[#E2E8F0] bg-white p-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        {/* Specimen Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
          <Link href="/accounting/invoices">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => handleSaveInvoice(false)}
            className="h-9 px-4 rounded-md border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            Save Draft
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => window.print()}
            className="h-9 w-9 p-0 rounded-md text-[#64748B] hover:bg-[#F8FAFC]"
            title="Preview Draft"
          >
            <Eye size={16} />
          </Button>

          <Button
            type="button"
            disabled={saving}
            onClick={() => handleSaveInvoice(true)}
            className="h-9 rounded-md bg-[#2563EB] px-5 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] inline-flex items-center gap-2 cursor-pointer"
          >
            <Send size={14} />
            {saving ? "Transmitting..." : "Send Invoice"}
          </Button>
        </div>
      </div>

      {/* QUICK CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Add New Customer</h2>
                <p className="text-[11px] text-[#64748B]">Quick customer registration for invoice</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Customer Name <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <Input
                  required
                  placeholder="Enterprise Client or Customer Name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="billing@enterprise.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Phone</label>
                <Input
                  placeholder="+971 50 987 6543"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="HQ Street address, City, Country"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full rounded-md border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="h-9 px-4 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
