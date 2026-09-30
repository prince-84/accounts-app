"use client";

import { ArrowUpRight, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompany } from "@/context/CompanyContext";
import { formatDateDDMMYYYY } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  paid: "bg-[#ECFDF5] text-[#059669] border border-[#10B981]/20",
  sent: "bg-blue-50 text-blue-700 border border-blue-200",
  draft: "bg-slate-100 text-slate-700 border border-slate-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  overdue: "bg-[#FEF2F2] text-[#DC2626] border border-[#EF4444]/20",
  partially_paid: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

interface RecentInvoicesProps {
  invoices?: any[];
}

export default function RecentInvoices({ invoices = [] }: RecentInvoicesProps) {
  const { formatCurrency } = useCompany();

  return (
    <section className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] p-5">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Recent Invoices
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Latest customer invoices and their current payment status.
          </p>
        </div>

        <Link href="/accounting/invoices">
          <Button
            variant="ghost"
            className="group gap-1.5 rounded-md text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
          >
            <span>View all</span>
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Button>
        </Link>
      </div>

      {/* Table or Empty State */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] mb-3">
            <FileText size={22} />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A]">No invoices recorded yet</h3>
          <p className="mt-1 max-w-sm text-xs text-[#64748B]">
            Create your first sales invoice to track receivables and revenue.
          </p>
          <Link href="/accounting/invoices/create" className="mt-4">
            <Button className="gap-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold h-8 px-3">
              <Plus size={14} />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="border-collapse text-xs">
            <TableHeader>
              <TableRow className="border-b border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="pl-5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Invoice</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Customer</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Date</TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Amount</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
              {invoices.map((invoice) => {
                const statusKey = String(invoice.status || "draft").toLowerCase();
                const badgeStyle = statusStyles[statusKey] || statusStyles.draft;

                return (
                  <TableRow
                    key={invoice.id}
                    className="hover:bg-[#F8FAFC] transition"
                  >
                    <TableCell className="pl-5 font-mono font-bold text-[#2563EB]">
                      <Link href={`/accounting/invoices/${invoice.id}`} className="hover:underline">
                        {invoice.invoice_number || `INV-${invoice.id}`}
                      </Link>
                    </TableCell>

                    <TableCell className="font-semibold text-[#0F172A]">
                      {invoice.customer?.name || "Customer"}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-[#64748B]">
                      {formatDateDDMMYYYY(invoice.invoice_date)}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-[#0F172A]">
                      {formatCurrency(parseFloat(invoice.total_amount) || 0)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}
                      >
                        {invoice.status || "Draft"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}