"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartNoAxesCombined, PieChart as PieIcon } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";

const COLORS = [
  "#2563EB",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#64748B",
];

interface ExpenseBreakdownProps {
  categories?: { name: string; value: number }[];
}

export default function ExpenseBreakdown({ categories = [] }: ExpenseBreakdownProps) {
  const { formatCurrency } = useCompany();

  const totalExpenses = categories.reduce(
    (total, item) => total + (item.value || 0),
    0
  );

  return (
    <section className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Expenses by Category
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Current period operating expenditure breakdown.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#E2E8F0]">
          <ChartNoAxesCombined size={18} />
        </div>
      </div>

      {/* Chart or Empty State */}
      {categories.length === 0 || totalExpenses === 0 ? (
        <div className="flex flex-col items-center justify-center h-[280px] text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] mb-3">
            <PieIcon size={22} />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A]">No expense data yet</h3>
          <p className="mt-1 max-w-xs text-xs text-[#64748B]">
            When you post vendor bills and expenses, your category allocation will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="relative mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-[#64748B]">
                Total Spent
              </span>
              <span className="mt-1 text-sm font-bold text-[#0F172A]">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#E2E8F0] pt-4">
            {categories.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate text-[#64748B] text-[11px]">{item.name}</span>
                <span className="ml-auto font-semibold text-[#0F172A] text-[11px]">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}