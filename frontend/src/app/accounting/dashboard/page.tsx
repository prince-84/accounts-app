import {
  CircleDollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import KpiCard from "@/components/dashboard/KpiCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import RecentInvoices from "@/components/dashboard/RecentInvoices";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ExpenseBreakdown from "@/components/dashboard/ExpenseBreakdown";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";
import { dashboardStats } from "@/data/dashboard-data";

export default function DashboardPage() {
  const iconMap = {
    revenue: TrendingUp,
    expenses: TrendingDown,
    profit: CircleDollarSign,
    invoices: FileText,
  };

  const iconStyles = {
    revenue: "bg-blue-50 text-blue-600",
    expenses: "bg-red-50 text-red-600",
    profit: "bg-emerald-50 text-emerald-600",
    invoices: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Financial Overview
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your business finances.
          </p>
        </div>

        <div className="text-sm text-slate-400">
          September 2026
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = iconMap[stat.type as keyof typeof iconMap];

          return (
            <KpiCard
              key={stat.type}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={Icon}
              iconClassName={
                iconStyles[stat.type as keyof typeof iconStyles]
              }
            />
          );
        })}
      </section>

      {/* Financial Charts */}
      <section className="grid gap-6 xl:grid-cols-2">
        <RevenueChart />
        <CashFlowChart />
      </section>

      {/* Recent Activity */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentInvoices />
        </div>

        <RecentTransactions />
      </section>

      {/* Financial Overview */}
      <section className="grid gap-6 xl:grid-cols-2">
        <ExpenseBreakdown />
        <UpcomingPayments />
      </section>

    </div>
  );
}