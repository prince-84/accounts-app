"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useCompany } from "@/context/CompanyContext";

interface CashFlowChartProps {
  data?: { month: string; revenue?: number; expenses?: number; inflow?: number; outflow?: number }[];
}

const DEFAULT_EMPTY_MONTHS = [
  { month: "Jan", inflow: 0, outflow: 0 },
  { month: "Feb", inflow: 0, outflow: 0 },
  { month: "Mar", inflow: 0, outflow: 0 },
  { month: "Apr", inflow: 0, outflow: 0 },
  { month: "May", inflow: 0, outflow: 0 },
  { month: "Jun", inflow: 0, outflow: 0 },
];

export default function CashFlowChart({ data = [] }: CashFlowChartProps) {
  const { activeCompany, formatCurrency } = useCompany();

  const formattedData =
    data && data.length > 0
      ? data.slice(0, 6).map((item) => ({
          month: item.month,
          inflow: item.inflow ?? item.revenue ?? 0,
          outflow: item.outflow ?? item.expenses ?? 0,
        }))
      : DEFAULT_EMPTY_MONTHS;

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
              Cash Flow Velocity
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Monthly inflow vs outflow tracking
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#2563EB]" />
              <span className="text-[#64748B] text-[11px] font-medium">Inflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#64748B]" />
              <span className="text-[#64748B] text-[11px] font-medium">Outflow</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >
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
                  name === "inflow" ? "Cash Inflow" : "Cash Outflow",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  color: "#0F172A",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey="inflow"
                fill="#2563EB"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="outflow"
                fill="#94A3B8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}