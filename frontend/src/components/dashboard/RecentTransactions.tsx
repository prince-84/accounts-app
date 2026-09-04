"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";

import { recentTransactions } from "@/data/dashboard-data";

const transactionIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
};

export default function RecentTransactions() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest financial activity.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CreditCard size={20} />
        </div>
      </div>

      {/* Transactions */}
      <div className="divide-y divide-slate-100">
        {recentTransactions.map((transaction, index) => {
          const Icon = transactionIcons[transaction.type as keyof typeof transactionIcons];

          const isIncome = transaction.type === "income";

          return (
            <div
              key={`${transaction.title}-${index}`}
              className="flex items-center gap-4 p-5 transition-colors hover:bg-slate-50/70"
            >
              {/* Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isIncome
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <Icon size={20} />
              </div>

              {/* Information */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">
                  {transaction.title}
                </p>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {transaction.description}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p
                  className={`font-bold ${
                    isIncome ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {transaction.amount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {transaction.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}