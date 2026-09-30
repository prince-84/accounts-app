"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useCompany } from "@/context/CompanyContext";

interface RevenueChartProps {
  data?: { month: string; revenue: number; expenses: number }[];
}

const DEFAULT_EMPTY_MONTHS = [
  { month: "Jan", revenue: 0, expenses: 0 },
  { month: "Feb", revenue: 0, expenses: 0 },
  { month: "Mar", revenue: 0, expenses: 0 },
  { month: "Apr", revenue: 0, expenses: 0 },
  { month: "May", revenue: 0, expenses: 0 },
  { month: "Jun", revenue: 0, expenses: 0 },
  { month: "Jul", revenue: 0, expenses: 0 },
  { month: "Aug", revenue: 0, expenses: 0 },
  { month: "Sep", revenue: 0, expenses: 0 },
  { month: "Oct", revenue: 0, expenses: 0 },
  { month: "Nov", revenue: 0, expenses: 0 },
  { month: "Dec", revenue: 0, expenses: 0 },
];

export default function RevenueChart({ data = DEFAULT_EMPTY_MONTHS }: RevenueChartProps) {
  const { activeCompany, formatCurrency } = useCompany();
  const chartData = data && data.length > 0 ? data : DEFAULT_EMPTY_MONTHS;

  const formatShortCurrency = (val: number) => {
    const sym = activeCompany?.currencySymbol || activeCompany?.currency || "";
    if (Math.abs(val) >= 1000000) {
      return `${sym} ${(val / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1000) {
      return `${sym} ${(val / 1000).toFixed(0)}k`;
    }
    return `${sym} ${val}`;
  };

  return (
    <Card className="rounded-lg border-[#E2E8F0] bg-white shadow-xs">
      <CardContent className="p-6">
        {/* Chart Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              Revenue vs Expenses
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Operating performance across fiscal year {new Date().getFullYear()}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              <span className="text-[#64748B] text-[11px] font-medium">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-[#64748B] text-[11px] font-medium">Expenses</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>

                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                fontSize={11}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                fontSize={11}
                tickFormatter={formatShortCurrency}
              />

              <Tooltip
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value || 0)),
                  name === "revenue" ? "Revenue" : "Expenses",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  color: "#0F172A",
                  fontSize: "12px",
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />

              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}