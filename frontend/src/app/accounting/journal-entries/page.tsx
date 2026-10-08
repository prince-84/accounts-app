"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default function JournalEntriesPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (id: number, entryNumber: string) => {
    if (!confirm(`Are you sure you want to delete journal voucher "${entryNumber}"? This will reverse all ledger balances associated with it.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteJournalEntry(id);
      if (res.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(res.message || "Failed to delete journal entry");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete journal entry");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      "Date,Reference,Narration,Account Code,Debit,Credit\n" +
      "2026-10-08,JV-1001,Office Rent Payment,5010,5000.00,0.00\n" +
      "2026-10-08,JV-1001,Office Rent Payment,1010,0.00,5000.00\n" +
      "2026-10-08,JV-1002,Client Advance Received,1010,12000.00,0.00\n" +
      "2026-10-08,JV-1002,Client Advance Received,2010,0.00,12000.00\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journal_entries_sample_${activeCompany.code || "template"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setImportError("Please select a CSV file to import.");
      return;
    }

    setImporting(true);
    setImportError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("company_id", activeCompany.id.toString());

    try {
      const res = await api.importJournalEntries(formData);
      if (res.success) {
        alert(res.message || "Journal entries imported successfully!");
        setShowImportModal(false);
        setSelectedFile(null);
        loadData();
      } else {
        setImportError(res.message || "Failed to import journal entries");
      }
    } catch (err: any) {
      setImportError(err.message || "An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "GENERAL LEDGER", "JOURNAL VOUCHERS"]}
        title="Journal Vouchers"
        description="Double-entry balanced debits and credits ledger postings with automated audit trail verification."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setImportError(null);
                setSelectedFile(null);
                setShowImportModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs cursor-pointer"
            >
              <Upload size={14} className="text-[#2563EB]" />
              Import Entries
            </Button>

            <Link href="/accounting/journal-entries/create">
              <Button className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#1D4ED8] text-xs cursor-pointer">
                <Plus size={15} />
                New Journal Entry
              </Button>
            </Link>
          </div>
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
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
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
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(entry.id, entry.entry_number)}
                        disabled={deletingId === entry.id}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition cursor-pointer disabled:opacity-50"
                        title="Delete journal entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#64748B]">
                    No journal entries recorded for {activeCompany.name} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMPORT JOURNAL ENTRIES MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">Import Journal Entries</h2>
                  <p className="text-xs text-[#64748B]">
                    Upload CSV file to bulk import general vouchers for {activeCompany.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-md p-1 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="mt-5 space-y-4">
              <div className="rounded-lg bg-[#F8FAFC] p-3.5 border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#2563EB]" />
                    CSV Format Instructions
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    <Download size={13} />
                    Download Sample Template
                  </button>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Required columns: <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">Date</code>, <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">Reference</code>, <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">Narration</code>, <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">Account Code</code>, <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">Debit</code>, <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">Credit</code>. Rows with matching reference belong to the same balanced voucher.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Select CSV File <span className="text-[#EF4444]">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#CBD5E1] border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={22} className="text-[#64748B] mb-2" />
                      <p className="text-xs text-[#0F172A] font-semibold">
                        {selectedFile ? selectedFile.name : "Click to select or drag & drop CSV file"}
                      </p>
                      <p className="text-[10px] text-[#64748B] mt-1">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "CSV up to 5MB"}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                          setImportError(null);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {importError && (
                <div className="rounded-lg bg-[#FEF2F2] p-3 border border-[#FCA5A5] text-xs font-medium text-[#DC2626]">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="h-9 rounded-md text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={importing || !selectedFile}
                  className="h-9 rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Upload & Import"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
