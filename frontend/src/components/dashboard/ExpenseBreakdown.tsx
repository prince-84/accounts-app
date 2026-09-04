"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartNoAxesCombined } from "lucide-react";

import { expenseCategoryData } from "@/data/dashboard-data";

const COLORS = [
  "#2563EB",
  "#0EA5A6",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#94A3B8",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ExpenseBreakdown() {
  const totalExpenses = expenseCategoryData.reduce(
    (total, item) => total + item.value,
    0
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Expenses by Category
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Breakdown of your business expenses.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ChartNoAxesCombined size={20} />
        </div>
      </div>

      {/* Chart */}
      <div className="relative mt-6 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseCategoryData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {expenseCategoryData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) =>
                formatCurrency(Number(value))
              }
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Information */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm text-slate-500">Total Expenses</span>

          <span className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {expenseCategoryData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />

              <span className="truncate text-sm text-slate-600">
                {item.name}
              </span>
            </div>

            <span className="text-xs font-semibold text-slate-700">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}