"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/context/CompanyContext";
import { formatDateDDMMYYYY } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions?: any[];
}

export default function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  const { formatCurrency } = useCompany();

  return (
    <section className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Recent Transactions
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Latest balanced journal vouchers and general ledger activity.
          </p>
        </div>

        <Link href="/accounting/journal-entries">
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

      {/* Transactions List or Empty State */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] mb-3">
            <BookOpen size={22} />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A]">No transactions recorded yet</h3>
          <p className="mt-1 max-w-sm text-xs text-[#64748B]">
            Transactions from invoices, bills, and journal entries will appear here in real time.
          </p>
          <Link href="/accounting/journal-entries/create" className="mt-4">
            <Button className="gap-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold h-8 px-3">
              <Plus size={14} />
              <span>New Journal Entry</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0]">
          {transactions.map((transaction, index) => {
            const lines = transaction.lines || [];
            const totalDebit = lines.reduce(
              (sum: number, l: any) => sum + (parseFloat(l.debit) || 0),
              0
            );

            return (
              <div
                key={transaction.id || index}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[#F8FAFC]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB]">
                    <CreditCard size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-xs text-[#0F172A]">
                      {transaction.entry_number || `JV-${transaction.id}`}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#64748B]">
                      {transaction.reference || transaction.description || "General Journal Voucher"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-xs text-[#0F172A]">
                    {formatCurrency(totalDebit)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#94A3B8]">
                    {formatDateDDMMYYYY(transaction.entry_date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}