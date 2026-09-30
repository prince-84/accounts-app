"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InvoiceTable() {
  const { activeCompany, formatCurrency } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState<string>("");
  const [recording, setRecording] = useState(false);

  const loadInvoices = () => {
    setLoading(true);
    api
      .getInvoices()
      .then((res) => {
        if (res.success) {
          const list = res.data?.data || res.data || [];
          setInvoices(list);
        }
      })
      .catch((err) => console.error("Error loading invoices:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
    api
      .getChartOfAccounts()
      .then((res) => {
        if (res.success) {
          const banks = res.data.filter((a: any) => a.sub_type === "bank_cash" || a.type === "asset");
          setBankAccounts(banks);
          if (banks.length > 0) setPaymentAccount(banks[0].id.toString());
        }
      })
      .catch((err) => console.error("Error loading accounts:", err));
  }, [activeCompany.id]);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const number = invoice.invoice_number || invoice.id || "";
      const customer = invoice.customer?.name || invoice.customer || "";

      const matchesSearch =
        number.toLowerCase().includes(query) ||
        customer.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === "All" ||
        invoice.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, selectedStatus, invoices]);

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenPayment = (inv: any) => {
    setPaymentModalInvoice(inv);
    setPaymentAmount(parseFloat(inv.due_amount) || parseFloat(inv.total_amount));
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    setRecording(true);
    try {
      await api.recordInvoicePayment(paymentModalInvoice.id, {
        account_id: parseInt(paymentAccount),
        amount: paymentAmount,
        receipt_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        notes: `Payment for invoice ${paymentModalInvoice.invoice_number}`,
      });

      setPaymentModalInvoice(null);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]"
          />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search invoice # or customer..."
            className="h-10 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] pl-10 text-xs text-[#0F172A] focus-visible:bg-white focus-visible:border-[#F59E0B]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Sent", "Paid", "Partially_Paid", "Draft"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                selectedStatus === status
                  ? "bg-[#0F172A] text-[#F59E0B] border border-[#F59E0B]/30 shadow-xs"
                  : "bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full min-w-[850px] text-xs">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-4 text-left">Invoice #</th>
              <th className="px-5 py-4 text-left">Customer</th>
              <th className="px-5 py-4 text-left">Issue Date</th>
              <th className="px-5 py-4 text-left">Due Date</th>
              <th className="px-5 py-4 text-right">Total Amount</th>
              <th className="px-5 py-4 text-right">Due Amount</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((inv) => {
                const total = parseFloat(inv.total_amount) || 0;
                const due = parseFloat(inv.due_amount !== undefined ? inv.due_amount : inv.total_amount) || 0;

                return (
                  <tr key={inv.id} className="transition hover:bg-[#F8FAFC]/60">
                    <td className="px-5 py-4 font-mono font-bold text-[#0F172A]">
                      {inv.invoice_number || inv.id}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#0F172A]">
                      {inv.customer?.name || inv.customer || "Client"}
                    </td>

                    <td className="px-5 py-4 text-[#64748B]">
                      {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-5 py-4 text-[#64748B]">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-5 py-4 text-right font-mono font-bold text-[#0F172A]">
                      {formatCurrency(total)}
                    </td>

                    <td className="px-5 py-4 text-right font-mono font-semibold text-[#D93838]">
                      {due > 0 ? formatCurrency(due) : <span className="text-[#16A34A] font-bold">Settled</span>}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          inv.status === "paid"
                            ? "bg-emerald-50 text-[#16A34A]"
                            : inv.status === "partially_paid"
                            ? "bg-amber-50 text-[#D97706]"
                            : "bg-blue-50 text-[#2563EB]"
                        }`}
                      >
                        {inv.status?.replace(/_/g, " ") || "sent"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {due > 0.01 ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPayment(inv)}
                          className="h-7 rounded-xl bg-[#0F172A] px-3 text-xs font-semibold text-white hover:bg-[#0D1E3A] border border-[#152744] cursor-pointer"
                        >
                          <DollarSign size={13} className="text-[#F59E0B]" />
                          Receive Payment
                        </Button>
                      ) : (
                        <span className="text-xs text-[#16A34A] font-semibold">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#64748B]">
                  No invoices found for {activeCompany.name}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Recording Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl text-xs border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Receive Customer Payment
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Invoice <span className="font-mono font-bold text-[#0F172A]">{paymentModalInvoice.invoice_number}</span> ({paymentModalInvoice.customer?.name})
                </p>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Deposit Into (Bank / Cash Account) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <select
                  required
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Amount Received ({activeCompany.currency}) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  max={paymentModalInvoice.due_amount || paymentModalInvoice.total_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 font-mono font-bold rounded-md border-[#E2E8F0] bg-white text-[#0F172A]"
                />
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Total Outstanding Due: {formatCurrency(parseFloat(paymentModalInvoice.due_amount || paymentModalInvoice.total_amount))}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="h-9 px-4 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {recording ? "Recording..." : "Record & Post to GL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}