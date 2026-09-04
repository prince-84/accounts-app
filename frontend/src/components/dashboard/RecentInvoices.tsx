"use client";

import { ArrowUpRight, MoreHorizontal } from "lucide-react";

import { recentInvoices } from "@/data/dashboard-data";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusStyles = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Overdue: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function RecentInvoices() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Invoices
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest invoices and their payment status.
          </p>
        </div>

        <Button
          variant="ghost"
          className="group gap-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          View all
          <ArrowUpRight
            size={17}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="pl-6">Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-6">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {recentInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="border-slate-100 transition-colors hover:bg-slate-50/70"
              >
                <TableCell className="pl-6 font-semibold text-slate-800">
                  {invoice.id}
                </TableCell>

                <TableCell className="font-medium text-slate-700">
                  {invoice.customer}
                </TableCell>

                <TableCell className="text-slate-500">
                  {invoice.date}
                </TableCell>

                <TableCell className="text-right font-semibold text-slate-800">
                  {invoice.amount}
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      statusStyles[
                        invoice.status as keyof typeof statusStyles
                      ]
                    }`}
                  >
                    {invoice.status}
                  </span>
                </TableCell>

                <TableCell className="pr-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Actions for ${invoice.id}`}
                  >
                    <MoreHorizontal size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}