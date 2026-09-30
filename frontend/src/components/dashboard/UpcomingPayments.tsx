"use client";

import { CalendarClock, ChevronRight, ReceiptText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import { formatDateDDMMYYYY } from "@/lib/utils";

interface UpcomingPaymentsProps {
  payments?: any[];
}

export default function UpcomingPayments({ payments = [] }: UpcomingPaymentsProps) {
  const { formatCurrency } = useCompany();

  return (
    <section className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Upcoming Payments
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Outstanding vendor bills and liabilities due soon.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#E2E8F0]">
          <CalendarClock size={18} />
        </div>
      </div>

      {/* Payment List or Empty State */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#10B981] mb-3">
            <CheckCircle2 size={22} />
          </div>
          <h3 className="text-xs font-bold text-[#0F172A]">All payments settled</h3>
          <p className="mt-1 max-w-xs text-xs text-[#64748B]">
            There are no pending vendor bills or overdue liabilities.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0]">
          {payments.map((payment) => {
            const dueAmt = parseFloat(payment.due_amount || payment.total_amount) || 0;
            const vendorName = payment.vendor?.name || payment.vendor_name || "Vendor";

            return (
              <div
                key={payment.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-[#F8FAFC]"
              >
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-[#F59E0B]">
                  <ReceiptText size={18} />
                </div>

                {/* Payment Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-xs text-[#0F172A]">
                    {vendorName}
                  </p>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-mono text-[#64748B]">
                      Due {formatDateDDMMYYYY(payment.due_date)}
                    </p>

                    <span className="inline-flex rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[10px] font-semibold text-[#D97706]">
                      {payment.status || "Unpaid"}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-2 text-right">
                  <p className="font-mono font-bold text-xs text-[#0F172A]">
                    {formatCurrency(dueAmt)}
                  </p>
                  <ChevronRight size={14} className="text-[#94A3B8]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[#E2E8F0] p-3 text-center">
        <Link
          href="/accounting/expenses"
          className="inline-block text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
        >
          View all bills & expenses →
        </Link>
      </div>
    </section>
  );
}