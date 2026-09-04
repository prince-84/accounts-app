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
import { cashFlowData } from "@/data/dashboard-data";

const formatCurrency = (value: number) => {
  return `PKR ${(value / 1000000).toFixed(1)}M`;
};

export default function CashFlowChart() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-6">
        {/* Chart Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Cash Flow
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monthly cash inflow and outflow
          </p>
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashFlowData}
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
                stroke="#E2E8F0"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#94A3B8",
                  fontSize: 12,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#94A3B8",
                  fontSize: 12,
                }}
                tickFormatter={formatCurrency}
              />

              <Tooltip
                formatter={(value) =>
                  `PKR ${Number(value).toLocaleString()}`
                }
                cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                }}
              />

              <Bar
                dataKey="inflow"
                name="Cash Inflow"
                fill="#2563EB"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="outflow"
                name="Cash Outflow"
                fill="#EF4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}