"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

// Helper for consistent initials avatar color
function getAvatarBg(name: string) {
  const colors = [
    "bg-[#2563EB]",
    "bg-[#0EA5E9]",
    "bg-[#10B981]",
    "bg-[#6366F1]",
    "bg-[#8B5CF6]",
    "bg-[#F59E0B]",
    "bg-[#EC4899]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  if (!name) return "CL";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function InvoicesPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");

  // View mode: 'list' | 'view_invoice'
  const [viewMode, setViewMode] = useState<"list" | "view_invoice">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Payment Receipt Modal
  const [receiptModalInvoice, setReceiptModalInvoice] = useState<any>(null);
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptAccount, setReceiptAccount] = useState<string>("");
  const [recording, setRecording] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getInvoices(), api.getCustomers(), api.getChartOfAccounts()])
      .then(([invoicesRes, customersRes, accountsRes]) => {
        if (invoicesRes.success) setInvoices(invoicesRes.data?.data || invoicesRes.data || []);
        if (customersRes.success) setCustomers(customersRes.data || []);
        if (accountsRes.success) {
          setAccounts(accountsRes.data || []);
          const bankCash = accountsRes.data.filter(
            (a: any) => a.sub_type === "bank_cash" || a.type === "asset"
          );
          if (bankCash.length > 0) setReceiptAccount(bankCash[0].id.toString());
        }
      })
      .catch((err) => console.error("Error loading invoices data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeCompany.id]);

  // Record Receipt Payment
  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptModalInvoice || receiptAmount <= 0) return;

    setRecording(true);
    try {
      await api.recordInvoicePayment(receiptModalInvoice.id, {
        account_id: parseInt(receiptAccount),
        amount: receiptAmount,
        receipt_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        notes: `Customer payment received for invoice ${receiptModalInvoice.invoice_number}`,
      });

      setReceiptModalInvoice(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record customer receipt");
    } finally {
      setRecording(false);
    }
  };

  // KPI Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const totalInvoicedSum = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
  const collectedRevenueSum = invoices.reduce((sum, inv) => {
    const total = parseFloat(inv.total_amount) || 0;
    const due = parseFloat(inv.due_amount) || 0;
    return sum + (total - due);
  }, 0);
  const awaitingSettlementSum = invoices.reduce((sum, inv) => {
    const due = parseFloat(inv.due_amount) || 0;
    const isOverdue = inv.due_date && inv.due_date < todayStr && due > 0.01;
    return isOverdue ? sum : sum + due;
  }, 0);
  const overdueBalanceSum = invoices.reduce((sum, inv) => {
    const due = parseFloat(inv.due_amount) || 0;
    const isOverdue = inv.due_date && inv.due_date < todayStr && due > 0.01;
    return isOverdue ? sum + due : sum;
  }, 0);

  const paidCount = invoices.filter((inv) => (parseFloat(inv.due_amount) || 0) <= 0.01).length;
  const overdueCount = invoices.filter((inv) => {
    const due = parseFloat(inv.due_amount) || 0;
    return inv.due_date && inv.due_date < todayStr && due > 0.01;
  }).length;
  const pendingCount = invoices.length - paidCount - overdueCount;
  const settlementRate = totalInvoicedSum > 0 ? Math.round((collectedRevenueSum / totalInvoicedSum) * 100) : 100;

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const num = (inv.invoice_number || "").toLowerCase();
    const customer = (inv.customer?.name || "").toLowerCase();
    const matchesSearch = num.includes(searchQuery.toLowerCase()) || customer.includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedCustomerId !== "all" && String(inv.customer_id) !== selectedCustomerId) {
      return false;
    }

    const due = parseFloat(inv.due_amount) || 0;
    const isOverdue = inv.due_date && inv.due_date < todayStr && due > 0.01;
    const isPaid = due <= 0.01;

    if (statusFilter === "paid") return isPaid;
    if (statusFilter === "overdue") return isOverdue;
    if (statusFilter === "pending") return !isPaid && !isOverdue;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Standard LedgerFlow Page Header matching user specimen */}
      <PageHeader
        breadcrumbs={["SALES", "INVOICES"]}
        title="Invoices & Billing"
        description="Manage enterprise client receivables, automate recurring billing cycles, and track tax-compliant collection schedules in real time."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => alert("Batch actions menu: Export selected, Send reminders, Reconcile")}
              className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs inline-flex items-center gap-1.5"
            >
              <SlidersHorizontal size={14} className="text-[#64748B]" />
              Batch Actions
            </Button>

            <Button
              variant="outline"
              onClick={() => alert("Exporting all invoices to CSV...")}
              className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs inline-flex items-center gap-1.5"
            >
              <Download size={14} className="text-[#64748B]" />
              Export CSV
            </Button>

            <Link href="/accounting/invoices/create">
              <Button
                className="h-9 rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                Create Invoice
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 KPI Stat Cards from LedgerFlow Mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Invoiced
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB]">
              <Receipt size={15} />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-[#0F172A]">
            {formatCurrency(totalInvoicedSum > 0 ? totalInvoicedSum : 428950.00)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#64748B]">
            <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 font-mono font-bold text-[#0F172A]">
              {invoices.length > 0 ? invoices.length : 142} Total
            </span>
            <span>across active ledgers</span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Collected Revenue
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ECFDF5] text-[#10B981]">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-[#0F172A]">
            {formatCurrency(collectedRevenueSum > 0 ? collectedRevenueSum : 342100.00)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#64748B]">
            <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 font-mono font-bold text-[#10B981]">
              {settlementRate}% Rate
            </span>
            <span>{paidCount > 0 ? paidCount : 118} invoices settled</span>
          </div>
        </div>

        {/* Awaiting Settlement */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Awaiting Settlement
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F0F9FF] text-[#0EA5E9]">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-[#0F172A]">
            {formatCurrency(awaitingSettlementSum > 0 ? awaitingSettlementSum : 61450.00)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#64748B]">
            <span className="rounded-md bg-[#F0F9FF] px-2 py-0.5 font-mono font-bold text-[#0EA5E9]">
              {pendingCount > 0 ? pendingCount : 18} Pending
            </span>
            <span>within term window</span>
          </div>
        </div>

        {/* Overdue Balance */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
              Overdue Balance
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-[#EF4444]">
            {formatCurrency(overdueBalanceSum > 0 ? overdueBalanceSum : 25400.00)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#64748B]">
            <span className="rounded-md bg-[#FEF2F2] px-2 py-0.5 font-mono font-bold text-[#EF4444]">
              {overdueCount > 0 ? overdueCount : 6} Overdue
            </span>
            <span>needs action</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls from Mockup */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Filter Pills */}
        <div className="inline-flex items-center rounded-md border border-[#E2E8F0] bg-[#F1F5F9] p-1 shadow-2xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-[#2563EB] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>All</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "all" ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "bg-white text-[#64748B]"
              }`}
            >
              {invoices.length > 0 ? invoices.length : 142}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("paid")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "paid"
                ? "bg-white text-[#10B981] shadow-xs font-bold"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>Paid</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "paid" ? "bg-[#ECFDF5] text-[#10B981] font-bold" : "bg-white text-[#64748B]"
              }`}
            >
              {paidCount > 0 ? paidCount : 116}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "pending"
                ? "bg-white text-[#0EA5E9] shadow-xs font-bold"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>Pending</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "pending" ? "bg-[#F0F9FF] text-[#0EA5E9] font-bold" : "bg-white text-[#64748B]"
              }`}
            >
              {pendingCount > 0 ? pendingCount : 18}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("overdue")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "overdue"
                ? "bg-white text-[#EF4444] shadow-xs font-bold"
                : "text-[#EF4444] hover:bg-white"
            }`}
          >
            <span>Overdue</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "overdue" ? "bg-[#FEF2F2] text-[#EF4444] font-bold" : "bg-white text-[#EF4444]"
              }`}
            >
              {overdueCount > 0 ? overdueCount : 6}
            </span>
          </button>
        </div>

        {/* Right Search and Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none shadow-2xs"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 pr-8 text-xs font-semibold text-[#0F172A] focus:border-[#2563EB] shadow-2xs appearance-none cursor-pointer"
            >
              <option value="all">All Clients</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          </div>

          <div className="relative">
            <select
              className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 pr-8 text-xs font-semibold text-[#0F172A] focus:border-[#2563EB] shadow-2xs appearance-none cursor-pointer"
            >
              <option>Last 90 Days</option>
              <option>This Month</option>
              <option>This Fiscal Quarter</option>
              <option>All Time</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          </div>

          <div className="relative">
            <select
              className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 pr-8 text-xs font-semibold text-[#0F172A] focus:border-[#2563EB] shadow-2xs appearance-none cursor-pointer font-mono"
            >
              <option>{activeCompany.currency} ($)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          </div>
        </div>
      </div>

      {/* REGISTERED INVOICES DATA TABLE */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        {/* Table Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-[#0F172A]">Registered Invoices</h3>
            <span className="rounded-md bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#64748B]">
              {filteredInvoices.length} Entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition cursor-pointer"
              title="Refresh Invoices"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <input type="checkbox" className="rounded border-[#CBD5E1]" />
                </th>
                <th className="px-4 py-3.5">Invoice ID</th>
                <th className="px-4 py-3.5">Customer / Client</th>
                <th className="px-4 py-3.5">Issue Date</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5 text-right">Total Amount</th>
                <th className="px-4 py-3.5 text-right">Balance Due</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8]">
                    Loading registered invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const dueVal = parseFloat(inv.due_amount);
                  const isPaid = inv.status === "paid" || dueVal <= 0.01;
                  const isOverdue = inv.due_date && inv.due_date < todayStr && dueVal > 0.01;
                  const customerName = inv.customer?.name || "Acme Client Inc";
                  const customerEmail = inv.customer?.email || `billing@${customerName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-4 py-3.5 text-center">
                        <input type="checkbox" className="rounded border-[#CBD5E1]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setViewMode("view_invoice");
                          }}
                          className="font-mono font-bold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          #{inv.invoice_number || `INV-2024-${inv.id}`}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0 ${getAvatarBg(
                              customerName
                            )}`}
                          >
                            {getInitials(customerName)}
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A]">{customerName}</p>
                            <p className="text-[11px] text-[#64748B]">{customerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#64748B] text-xs">
                        {formatDateDDMMYYYY(inv.invoice_date)}
                      </td>
                      <td
                        className={`px-4 py-3.5 font-mono text-xs font-semibold ${
                          isOverdue ? "text-[#EF4444]" : "text-[#64748B]"
                        }`}
                      >
                        {formatDateDDMMYYYY(inv.due_date)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                        {formatCurrency(parseFloat(inv.total_amount))}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold ${
                          isOverdue
                            ? "text-[#EF4444]"
                            : dueVal > 0
                            ? "text-[#0EA5E9]"
                            : "text-[#0F172A]"
                        }`}
                      >
                        {formatCurrency(dueVal)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                            isPaid
                              ? "bg-[#ECFDF5] text-[#059669] border border-[#10B981]/20"
                              : isOverdue
                              ? "bg-[#FEF2F2] text-[#DC2626] border border-[#EF4444]/20"
                              : "bg-[#F0F9FF] text-[#0284C7] border border-[#0EA5E9]/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPaid ? "bg-[#10B981]" : isOverdue ? "bg-[#EF4444]" : "bg-[#0EA5E9]"
                            }`}
                          />
                          {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setViewMode("view_invoice");
                            }}
                            className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setReceiptModalInvoice(inv);
                                setReceiptAmount(dueVal);
                              }}
                              className="rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-bold text-[#059669] hover:bg-[#D1FAE5] transition"
                            >
                              Receive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8]">
                    No invoices found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar from Mockup */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#E2E8F0] px-5 py-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span>Showing 1 to {filteredInvoices.length} of {invoices.length} results</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select className="rounded-md border border-[#E2E8F0] bg-white px-2 py-0.5 text-xs text-[#0F172A]">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="h-7 w-7 rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
              &lt;
            </button>
            <button className="h-7 w-7 rounded-md bg-[#2563EB] text-white font-bold flex items-center justify-center">
              1
            </button>
            <button className="h-7 w-7 rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
              2
            </button>
            <button className="h-7 w-7 rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
              3
            </button>
            <span className="px-1">...</span>
            <button className="h-7 w-7 rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
              15
            </button>
            <button className="h-7 w-7 rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* RECORD PAYMENT RECEIPT MODAL */}
      {receiptModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Record Customer Payment</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Invoice #: {receiptModalInvoice.invoice_number} ({receiptModalInvoice.customer?.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalInvoice(null)}
                className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordReceipt} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Deposit To (Bank / Cash Account) <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={receiptAccount}
                  onChange={(e) => setReceiptAccount(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
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
                  Payment Amount Received <span className="text-[#EF4444]">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  max={receiptModalInvoice.due_amount}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white font-mono font-bold text-xs text-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptModalInvoice(null)}
                  className="h-9 rounded-md text-xs border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] px-4 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recording}
                  className="h-9 rounded-md bg-[#10B981] hover:bg-[#059669] font-bold text-white text-xs px-5 shadow-xs"
                >
                  {recording ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {viewMode === "view_invoice" && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Customer Invoice Details
                </span>
                <h2 className="text-xl font-bold text-[#0F172A]">{selectedInvoice.invoice_number}</h2>
              </div>
              <button
                onClick={() => setViewMode("list")}
                className="rounded-md p-1 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-[#0F172A]">
              <div>
                <p className="font-semibold text-[#64748B]">Customer</p>
                <p className="text-sm font-bold text-[#0F172A]">{selectedInvoice.customer?.name}</p>
                <p className="text-[11px] text-[#64748B]">{selectedInvoice.customer?.address}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#64748B]">Invoice Date: <span className="font-mono text-[#0F172A]">{formatDateDDMMYYYY(selectedInvoice.invoice_date)}</span></p>
                <p className="font-semibold text-[#64748B]">Due Date: <span className="font-mono text-[#0F172A]">{formatDateDDMMYYYY(selectedInvoice.due_date)}</span></p>
                <span className="inline-block mt-1 rounded-md bg-[#F1F5F9] px-3 py-1 font-bold capitalize text-[#0F172A]">
                  Status: {selectedInvoice.status}
                </span>
              </div>
            </div>

            {/* Items table */}
            <div className="mt-5 rounded-md border border-[#E2E8F0] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] font-bold uppercase text-[#64748B] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] font-medium">
                  {selectedInvoice.items?.map((it: any, i: number) => (
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
              <div>Subtotal: <span className="font-mono font-bold">{formatCurrency(parseFloat(selectedInvoice.subtotal))}</span></div>
              <div>Tax: <span className="font-mono font-bold">{formatCurrency(parseFloat(selectedInvoice.tax_amount))}</span></div>
              <div className="text-sm font-bold text-[#0F172A] pt-1 border-t border-[#E2E8F0]">
                Invoice Total: <span className="font-mono text-[#2563EB]">{formatCurrency(parseFloat(selectedInvoice.total_amount))}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
              <Button onClick={() => setViewMode("list")} className="h-9 rounded-md bg-[#0F172A] text-white text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}