"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default function JournalEntriesPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api
      .getJournalEntries()
      .then((entriesRes) => {
        if (entriesRes.success) {
          setEntries(entriesRes.data?.data || entriesRes.data || []);
        }
      })
      .catch((err) => console.error("Error loading journal entries:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeCompany.id]);

  return (
    <div className="space-y-6">
      {/* Page Header matching specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "GENERAL LEDGER", "JOURNAL VOUCHERS"]}
        title="Journal Vouchers"
        description="Double-entry balanced debits and credits ledger postings with automated audit trail verification."
        actions={
          <Link href="/accounting/journal-entries/create">
            <Button className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#1D4ED8] text-xs cursor-pointer">
              <Plus size={15} />
              New Journal Entry
            </Button>
          </Link>
        }
      />

      {/* Entries Table */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="px-5 py-3.5">Voucher #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Reference / Narration</th>
                <th className="px-5 py-3.5 text-right">Debit</th>
                <th className="px-5 py-3.5 text-right">Credit</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    Loading journal entries...
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-[#2563EB]">
                      <Link
                        href={`/accounting/journal-entries/create?id=${entry.id}`}
                        className="hover:underline cursor-pointer"
                      >
                        {entry.entry_number}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[#64748B] font-mono text-xs">
                      {formatDateDDMMYYYY(entry.entry_date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 text-[10px] font-bold text-[#0F172A]">
                        {entry.voucher_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#0F172A]">{entry.narration || "General transaction"}</p>
                      {entry.reference && (
                        <p className="text-[11px] text-[#64748B]">Ref: {entry.reference}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                      {formatCurrency(parseFloat(entry.total_debit))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                      {formatCurrency(parseFloat(entry.total_credit))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          entry.status === "posted"
                            ? "bg-emerald-50 text-[#16A34A] border border-[#10B981]/20"
                            : "bg-slate-100 text-[#64748B] border border-slate-200"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#64748B]">
                    No journal entries recorded for {activeCompany.name} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
