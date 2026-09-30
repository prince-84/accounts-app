"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import KpiCard from "@/components/dashboard/KpiCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import ExpenseBreakdown from "@/components/dashboard/ExpenseBreakdown";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";
import RecentInvoices from "@/components/dashboard/RecentInvoices";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import PageHeader from "@/components/layout/PageHeader";

export default function DashboardPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"fy" | "q3" | "30d">("fy");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getDashboardSummary()
      .then((res) => {
        if (isMounted && res.success) {
          setSummary(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load dashboard summary:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCompany.id]);

  const kpi = summary?.kpi || {
    revenue: 0,
    expenses: 0,
    profit: 0,
    receivables: 0,
    payables: 0,
    bank_balance: 0,
  };

  const revenueVal = Number(kpi.revenue || 0);
  const expensesVal = Number(kpi.expenses || 0);
  const profitVal = Number(kpi.profit ?? (revenueVal - expensesVal));
  const receivablesVal = Number(kpi.receivables || 0);
  const payablesVal = Number(kpi.payables || 0);

  const netMargin = revenueVal > 0 ? ((profitVal / revenueVal) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Financial Overview Header */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "EXECUTIVE HUB", "FINANCIAL OVERVIEW"]}
        title="Financial Overview"
        description={`Consolidated position and double-entry books for ${activeCompany.name}.`}
      />

      {/* Period Filter Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Filter Pill Group */}
        <div className="inline-flex items-center rounded-md bg-[#F1F5F9] p-1 border border-[#E2E8F0]">
          <button
            onClick={() => setSelectedPeriod("fy")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedPeriod === "fy"
                ? "bg-white text-[#2563EB] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Fiscal Year ({new Date().getFullYear()})
          </button>
          <button
            onClick={() => setSelectedPeriod("q3")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedPeriod === "q3"
                ? "bg-white text-[#2563EB] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Quarter Current
          </button>
          <button
            onClick={() => setSelectedPeriod("30d")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedPeriod === "30d"
                ? "bg-white text-[#2563EB] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Last 30 Days
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/accounting/reports"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] shadow-2xs hover:bg-[#F8FAFC] transition cursor-pointer"
          >
            <Download size={14} className="text-[#64748B]" />
            <span>Financial Statements</span>
          </Link>

          <Link
            href="/accounting/invoices/create"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] transition cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL REVENUE */}
        <KpiCard
          title="TOTAL REVENUE"
          value={formatCurrency(revenueVal)}
          badgeText={revenueVal > 0 ? "Real Operating Revenue" : "No revenue posted"}
          badgeType={revenueVal > 0 ? "success" : "neutral"}
          subtext={`Functional Currency: ${activeCompany.currency}`}
          icon={TrendingUp}
          iconClassName="bg-[#EFF6FF] text-[#2563EB]"
          chartType="sparkline"
          sparklinePath="M0 20 Q 30 22, 60 18 T 120 12 T 160 15 T 200 4"
        />

        {/* TOTAL OPEX */}
        <KpiCard
          title="TOTAL OPEX (EXPENSES)"
          value={formatCurrency(expensesVal)}
          badgeText={expensesVal > 0 ? "Operating Expenditure" : "No expenses posted"}
          badgeType={expensesVal > 0 ? "danger" : "neutral"}
          subtext="General Ledger verified"
          icon={WalletCards}
          iconClassName="bg-[#EFF6FF] text-[#2563EB]"
          chartType="sparkline"
          sparklinePath="M0 8 Q 40 8, 80 12 T 140 10 T 170 18 T 200 19"
        />

        {/* NET OPERATING PROFIT */}
        <KpiCard
          title="NET OPERATING PROFIT"
          value={formatCurrency(profitVal)}
          badgeText={`${netMargin}% Net Margin`}
          badgeType={profitVal >= 0 ? "info" : "danger"}
          subtext="Revenue minus Expenses"
          icon={ShieldCheck}
          iconClassName="bg-[#EFF6FF] text-[#2563EB]"
          chartType="progress"
          progressPercent={Math.min(100, Math.max(0, parseFloat(netMargin) || 0))}
        />

        {/* AR PENDING CLEARING */}
        <KpiCard
          title="AR PENDING CLEARING"
          value={formatCurrency(receivablesVal)}
          badgeText={receivablesVal > 0 ? "Awaiting Collection" : "Zero Outstanding"}
          badgeType={receivablesVal > 0 ? "warning" : "success"}
          subtext="Customer Receivables"
          icon={FileText}
          iconClassName="bg-[#FEF2F2] text-[#EF4444]"
          chartType="dual-progress"
        />
      </section>

      {/* Subledger Health Cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#2563EB]/40 transition">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB]">
              <Clock size={19} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                ACCOUNTS RECEIVABLE (AR)
              </p>
              <h3 className="text-xl font-bold font-mono text-[#0F172A] mt-0.5">
                {formatCurrency(receivablesVal)}
              </h3>
              <p className="text-xs text-[#64748B]">Outstanding client receivables</p>
            </div>
          </div>
          <Link
            href="/accounting/invoices"
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition"
          >
            <span>Manage AR</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#2563EB]/40 transition">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <CreditCard size={19} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                ACCOUNTS PAYABLE (AP)
              </p>
              <h3 className="text-xl font-bold font-mono text-[#0F172A] mt-0.5">
                {formatCurrency(payablesVal)}
              </h3>
              <p className="text-xs text-[#64748B]">Upcoming vendor commitments</p>
            </div>
          </div>
          <Link
            href="/accounting/expenses"
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition"
          >
            <span>Manage AP</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Financial Charts */}
      <section className="grid gap-6 xl:grid-cols-2">
        <RevenueChart data={summary?.monthly_trends} />
        <CashFlowChart data={summary?.monthly_trends} />
      </section>

      {/* Activity: Expenses & Upcoming Payments */}
      <section className="grid gap-6 xl:grid-cols-2">
        <ExpenseBreakdown categories={summary?.expense_breakdown} />
        <UpcomingPayments payments={summary?.upcoming_payments} />
      </section>

      {/* Live Recent Invoices & Recent Transactions */}
      <section className="grid gap-6 xl:grid-cols-2">
        <RecentInvoices invoices={summary?.recent_invoices} />
        <RecentTransactions transactions={summary?.recent_transactions} />
      </section>
    </div>
  );
}