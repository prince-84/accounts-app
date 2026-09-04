"use client";

import { CalendarClock, ChevronRight, ReceiptText } from "lucide-react";

import { upcomingPayments } from "@/data/dashboard-data";

const statusStyles = {
  "Due Soon": {
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: "bg-amber-50 text-amber-600",
  },
  Upcoming: {
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    icon: "bg-blue-50 text-blue-600",
  },
};

export default function UpcomingPayments() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Upcoming Payments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep track of payments due soon.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <CalendarClock size={20} />
        </div>
      </div>

      {/* Payment List */}
      <div className="divide-y divide-slate-100">
        {upcomingPayments.map((payment) => {
          const styles =
            statusStyles[payment.status as keyof typeof statusStyles];

          return (
            <div
              key={payment.id}
              className="flex items-center gap-4 p-5 transition-colors hover:bg-slate-50/70"
            >
              {/* Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
              >
                <ReceiptText size={20} />
              </div>

              {/* Payment Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">
                  {payment.name}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-slate-500">
                    Due {payment.dueDate}
                  </p>

                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>

              {/* Amount + Arrow */}
              <div className="flex items-center gap-3">
                <p className="hidden whitespace-nowrap font-bold text-slate-800 sm:block">
                  {payment.amount}
                </p>

                <ChevronRight
                  size={18}
                  className="text-slate-300 transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
        >
          View all payments
        </button>
      </div>
    </section>
  );
}