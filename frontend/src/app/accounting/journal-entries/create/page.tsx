"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

function JournalEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const { activeCompany, formatCurrency } = useCompany();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [existingEntry, setExistingEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Voucher Form State
  const [form, setForm] = useState({
    voucher_type: "JV",
    entry_date: new Date().toISOString().split("T")[0],
    reference: "",
    narration: "",
  });

  const [lines, setLines] = useState<any[]>([
    { account_id: "", description: "", debit: 0, credit: 0 },
    { account_id: "", description: "", debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getChartOfAccounts(),
      editId ? api.getJournalEntry(editId) : Promise.resolve(null),
    ])
      .then(([accountsRes, entryRes]) => {
        let accs: any[] = [];
        if (accountsRes && accountsRes.success) {
          accs = accountsRes.data || [];
        }

        if (entryRes && entryRes.success && entryRes.data) {
          const entry = entryRes.data;
          setExistingEntry(entry);

          // If entry has lines with account objects, ensure they are in the accounts list
          const rawLines = entry.lines || entry.items || [];
          rawLines.forEach((l: any) => {
            if (l.account && !accs.some((a: any) => a.id === l.account.id)) {
              accs.push(l.account);
            }
          });

          let parsedDate = new Date().toISOString().split("T")[0];
          if (entry.entry_date) {
            parsedDate = String(entry.entry_date).split("T")[0].split(" ")[0];
          }

          setForm({
            voucher_type: entry.voucher_type || "JV",
            entry_date: parsedDate,
            reference: entry.reference || "",
            narration: entry.narration || entry.description || "",
          });

          if (rawLines.length > 0) {
            setLines(
              rawLines.map((it: any) => ({
                account_id: String(it.account_id || (it.account ? it.account.id : "")),
                description: it.description || it.narration || entry.narration || "",
                debit: parseFloat(it.debit) || 0,
                credit: parseFloat(it.credit) || 0,
              }))
            );
          }
        }

        setAccounts(accs);
      })
      .catch((err) => {
        console.error("Error loading journal entry dependencies:", err);
      })
      .finally(() => setLoading(false));
  }, [activeCompany.id, editId]);

  const addLine = () => {
    setLines([...lines, { account_id: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index][field] = value;
    if (field === "debit" && parseFloat(value) > 0) {
      updated[index]["credit"] = 0;
    } else if (field === "credit" && parseFloat(value) > 0) {
      updated[index]["debit"] = 0;
    }
    setLines(updated);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("Total Debit must equal Total Credit before posting!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_id: activeCompany.id,
        voucher_type: form.voucher_type,
        entry_date: form.entry_date,
        reference: form.reference,
        narration: form.narration,
        lines: lines.map((l) => ({
          account_id: parseInt(l.account_id),
          description: l.description,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      };

      if (editId) {
        await api.updateJournalEntry(editId, payload);
        alert(`Journal Voucher "${existingEntry?.entry_number || ''}" updated successfully!`);
      } else {
        await api.createJournalEntry(payload);
        alert("Journal Voucher posted to General Ledger successfully!");
      }
      router.push("/accounting/journal-entries");
    } catch (err: any) {
      alert(err.message || (editId ? "Failed to update Journal Entry" : "Failed to post Journal Entry"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-16 text-center text-xs text-[#64748B] shadow-xs flex flex-col items-center justify-center gap-3 my-6">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-semibold text-slate-700">Loading journal voucher details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/dashboard" },
          { label: "Journal Vouchers", href: "/accounting/journal-entries" },
          { label: editId ? `Edit ${existingEntry?.entry_number || "Journal Entry"}` : "New Journal Entry" },
        ]}
        title={editId ? `Edit Journal Voucher: ${existingEntry?.entry_number || ""}` : "New Journal Voucher"}
        description="Double-entry balanced posting with real-time audit verification."
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/accounting/journal-entries">
              <Button
                variant="outline"
                className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} className="text-[#64748B]" />
                Back to Journal Entries
              </Button>
            </Link>

            <Button
              onClick={handleSubmit}
              disabled={!isBalanced || submitting}
              className="h-9 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              {submitting ? "Saving..." : editId ? "Update Journal Voucher" : "Post to General Ledger"}
            </Button>
          </div>
        }
      />

      {/* Main Voucher Card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-xs space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              {editId ? `Edit Voucher Details (${existingEntry?.entry_number || "JV"})` : "Record General Journal Voucher"}
            </h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {activeCompany.name} ({activeCompany.currency}) — Enter debits and credits
            </p>
          </div>

          <div className="flex items-center gap-2">
            {existingEntry?.status && (
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                existingEntry.status === "posted"
                  ? "bg-emerald-50 text-[#16A34A] border border-[#10B981]/20"
                  : "bg-slate-100 text-[#64748B] border border-slate-200"
              }`}>
                {existingEntry.status}
              </span>
            )}
            <span className="rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 font-mono text-xs font-bold text-[#0F172A]">
              Currency: {activeCompany.currency}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Header Metadata Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Voucher Type <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <select
                value={form.voucher_type}
                onChange={(e) => setForm({ ...form, voucher_type: e.target.value })}
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="JV">Journal Voucher (JV)</option>
                <option value="PV">Payment Voucher (PV)</option>
                <option value="RV">Receipt Voucher (RV)</option>
                <option value="CV">Contra Voucher (CV)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Voucher Date <span className="text-[#EF4444] ml-0.5">*</span>
              </label>
              <Input
                type="date"
                required
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Reference / Doc #
              </label>
              <Input
                placeholder="e.g. INV-8821, CHQ-4091"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Narration / Description <span className="text-[#EF4444] ml-0.5">*</span>
            </label>
            <Input
              required
              placeholder="Reason for financial transaction or adjustment"
              value={form.narration}
              onChange={(e) => setForm({ ...form, narration: e.target.value })}
              className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Debit & Credit Lines
              </span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:text-[#1D4ED8] text-xs cursor-pointer"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="rounded-md border border-[#E2E8F0] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold text-xs">
                  <tr>
                    <th className="px-3.5 py-2.5 w-1/3">Account</th>
                    <th className="px-3.5 py-2.5">Description</th>
                    <th className="px-3.5 py-2.5 w-32 text-right">Debit</th>
                    <th className="px-3.5 py-2.5 w-32 text-right">Credit</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC]/60 transition">
                      <td className="p-2.5">
                        <select
                          required
                          value={line.account_id}
                          onChange={(e) => updateLine(idx, "account_id", e.target.value)}
                          className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                        >
                          <option value="">Select Account...</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <Input
                          placeholder="Line description or reference"
                          value={line.description}
                          onChange={(e) => updateLine(idx, "description", e.target.value)}
                          className="h-9 text-xs rounded-md border-[#E2E8F0] bg-white text-[#0F172A]"
                        />
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit || ""}
                          onChange={(e) => updateLine(idx, "debit", e.target.value)}
                          className="h-9 text-right text-xs font-mono font-bold rounded-md border-[#E2E8F0] bg-white text-[#0F172A]"
                        />
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit || ""}
                          onChange={(e) => updateLine(idx, "credit", e.target.value)}
                          className="h-9 text-right text-xs font-mono font-bold rounded-md border-[#E2E8F0] bg-white text-[#0F172A]"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-[#94A3B8] hover:text-[#EF4444] cursor-pointer transition p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balanced Integrity Check Indicator */}
          <div className="flex flex-col sm:flex-row items-center justify-between rounded-md bg-[#F8FAFC] p-4 border border-[#E2E8F0] gap-4">
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs">
                  <CheckCircle2 size={18} />
                  <span>Balanced! Total Debit equals Total Credit.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#F59E0B] font-bold text-xs">
                  <AlertCircle size={18} />
                  <span>
                    Unbalanced! Difference: {formatCurrency(difference)}. Debit and Credit must match.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-8 font-mono text-xs">
              <div className="text-right">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">
                  TOTAL DEBIT
                </span>
                <span className="font-bold text-sm text-[#0F172A]">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">
                  TOTAL CREDIT
                </span>
                <span className="font-bold text-sm text-[#0F172A]">{formatCurrency(totalCredit)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
            <Link href="/accounting/journal-entries">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!isBalanced || submitting}
              className="h-9 px-5 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              {submitting ? "Saving..." : editId ? "Update Journal Voucher" : "Post to General Ledger"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateJournalEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading Journal Voucher form...
        </div>
      }
    >
      <JournalEntryForm />
    </Suspense>
  );
}
