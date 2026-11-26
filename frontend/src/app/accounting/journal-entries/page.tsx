"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit2,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

type DatePreset = "all" | "today" | "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";

export default function JournalEntriesPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination States (Default 20 records)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [pagination, setPagination] = useState<{
    total: number;
    from: number;
    to: number;
    lastPage: number;
  }>({
    total: 0,
    from: 0,
    to: 0,
    lastPage: 1,
  });

  // Search & Date Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadData = (pageToLoad = currentPage, perPageToLoad = perPage) => {
    setLoading(true);
    api
      .getJournalEntries({
        search: searchQuery.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: pageToLoad,
        per_page: perPageToLoad,
      })
      .then((entriesRes) => {
        if (entriesRes.success) {
          const resData = entriesRes.data;
          if (resData?.data && Array.isArray(resData.data)) {
            // Laravel paginated collection
            setEntries(resData.data);
            setPagination({
              total: resData.total ?? resData.data.length,
              from: resData.from ?? (resData.data.length > 0 ? 1 : 0),
              to: resData.to ?? resData.data.length,
              lastPage: resData.last_page ?? 1,
            });
            setCurrentPage(resData.current_page ?? pageToLoad);
          } else {
            // Unpaginated fallback
            const list = Array.isArray(resData) ? resData : [];
            setEntries(list);
            setPagination({
              total: list.length,
              from: list.length > 0 ? 1 : 0,
              to: list.length,
              lastPage: 1,
            });
          }
        }
      })
      .catch((err) => console.error("Error loading journal entries:", err))
      .finally(() => setLoading(false));
  };

  // Debounced load when search query, dates, company, or perPage change -> reset to page 1
  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
    const timer = setTimeout(() => {
      loadData(1, perPage);
    }, 250);
    return () => clearTimeout(timer);
  }, [activeCompany.id, searchQuery, startDate, endDate, perPage]);

  // Client-side quick filter for instantaneous typing response
  const filteredEntries = useMemo(() => {
    let list = entries;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const matchVoucher = e.entry_number?.toLowerCase().includes(q);
        const matchRef = e.reference?.toLowerCase().includes(q);
        const matchNarration = e.narration?.toLowerCase().includes(q);
        const matchType = e.voucher_type?.toLowerCase().includes(q);
        const matchStatus = e.status?.toLowerCase().includes(q);
        const matchDebit = e.total_debit?.toString().includes(q);
        const matchCredit = e.total_credit?.toString().includes(q);
        const matchDate = e.entry_date?.toLowerCase().includes(q);
        const matchLines = e.lines?.some((line: any) =>
          line.description?.toLowerCase().includes(q) ||
          line.account?.name?.toLowerCase().includes(q) ||
          line.account?.code?.toLowerCase().includes(q) ||
          line.debit?.toString().includes(q) ||
          line.credit?.toString().includes(q)
        );
        return (
          matchVoucher ||
          matchRef ||
          matchNarration ||
          matchType ||
          matchStatus ||
          matchDebit ||
          matchCredit ||
          matchDate ||
          matchLines
        );
      });
    }

    if (startDate) {
      list = list.filter((e) => e.entry_date >= startDate);
    }
    if (endDate) {
      list = list.filter((e) => e.entry_date <= endDate);
    }

    return list;
  }, [entries, searchQuery, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.lastPage || newPage === currentPage) return;
    setCurrentPage(newPage);
    setSelectedIds([]);
    loadData(newPage, perPage);
  };

  const getPageNumbers = () => {
    const totalPages = pagination.lastPage;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const current = currentPage;
    const pages: (number | string)[] = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (current >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", totalPages);
    }
    return pages;
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDayNum = new Date(year, month + 1, 0).getDate();
      const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "last_month") {
      const prevMonthDate = new Date(year, month - 1, 1);
      const pYear = prevMonthDate.getFullYear();
      const pMonth = prevMonthDate.getMonth();
      const firstDay = `${pYear}-${String(pMonth + 1).padStart(2, "0")}-01`;
      const lastDayNum = new Date(pYear, pMonth + 1, 0).getDate();
      const lastDay = `${pYear}-${String(pMonth + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "this_quarter") {
      const quarter = Math.floor(month / 3);
      const qStartMonth = quarter * 3 + 1;
      const qEndMonth = quarter * 3 + 3;
      const firstDay = `${year}-${String(qStartMonth).padStart(2, "0")}-01`;
      const lastDayNum = new Date(year, qEndMonth, 0).getDate();
      const lastDay = `${year}-${String(qEndMonth).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "this_year") {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEntries.length && filteredEntries.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntries.map((e) => e.id));
    }
  };

  const toggleSelectEntry = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    const isAll = count === filteredEntries.length;
    const confirmMsg = isAll
      ? `Are you sure you want to delete ALL ${count} journal vouchers on this page? This will reverse all ledger balances in General Ledger!`
      : `Are you sure you want to delete ${count} selected journal vouchers? This will reverse their General Ledger balances!`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const res = await api.bulkDeleteJournalEntries({ ids: selectedIds });
      if (res.success) {
        alert(res.message || `Successfully deleted ${count} journal entries!`);
        setSelectedIds([]);
        loadData(currentPage, perPage);
      } else {
        alert(res.message || "Failed to delete journal entries");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete journal entries");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (id: number, entryNumber: string) => {
    if (!confirm(`Are you sure you want to delete journal voucher "${entryNumber}"? This will reverse all ledger balances associated with it.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteJournalEntry(id);
      if (res.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        loadData(currentPage, perPage);
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
    formData.append("overwrite", String(overwriteExisting));

    try {
      const res = await api.importJournalEntries(formData);
      if (res.success) {
        alert(res.message || "Journal entries imported successfully!");
        setShowImportModal(false);
        setSelectedFile(null);
        loadData(1, perPage);
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
      {/* Page Header */}
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

      {/* SEARCH AND DATE FILTER TOOLBAR */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Universal Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all columns (Voucher #, ref, narration, account, amount)..."
              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-8 text-xs text-[#0F172A] placeholder-[#94A3B8] transition focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: "all", label: "All Dates" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "this_quarter", label: "This Quarter" },
              { id: "this_year", label: "This Year" },
              { id: "custom", label: "Custom Range" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id as DatePreset)}
                className={`rounded-md px-2.5 py-1.5 font-semibold transition cursor-pointer ${
                  datePreset === preset.id
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Date Inputs & Filter Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#F1F5F9] text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#2563EB]" />
              <span className="font-semibold text-[#0F172A]">Date Filter:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-[#64748B]">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <ArrowRight size={13} className="text-[#94A3B8]" />

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-[#64748B]">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            {(startDate || endDate || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition ml-2 cursor-pointer border border-[#E2E8F0]"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-right text-xs text-[#64748B]">
            Total Found: <span className="font-bold text-[#0F172A]">{pagination.total}</span>{" "}
            voucher{pagination.total !== 1 ? "s" : ""}
            {(searchQuery || startDate || endDate) && (
              <span className="ml-1 text-[11px] text-[#2563EB] font-semibold">
                (Filtered)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Selection Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-950 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="font-bold bg-rose-600 text-white rounded-full px-2.5 py-0.5 text-xs shadow-2xs">
              {selectedIds.length}
            </span>
            <span className="font-bold text-rose-900">
              {selectedIds.length === filteredEntries.length
                ? `All ${selectedIds.length} vouchers on this page selected`
                : `${selectedIds.length} voucher${selectedIds.length > 1 ? "s" : ""} selected`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-rose-700 underline hover:text-rose-950 text-xs ml-2 cursor-pointer font-medium"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="h-8.5 bg-rose-600 hover:bg-rose-700 font-bold text-white text-xs px-4 shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      )}

      {/* Entries Table Container */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={filteredEntries.length > 0 && selectedIds.length === filteredEntries.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                    title="Select All Vouchers on Current Page"
                  />
                </th>
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
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    Loading journal entries...
                  </td>
                </tr>
              ) : filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const isSelected = selectedIds.includes(entry.id);
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-[#F8FAFC] transition ${isSelected ? "bg-rose-50/40" : ""}`}
                    >
                      <td className="w-10 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEntry(entry.id)}
                          className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                        />
                      </td>
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
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/accounting/journal-entries/create?id=${entry.id}`}
                            className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] transition cursor-pointer"
                            title="Edit journal voucher"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(entry.id, entry.entry_number)}
                            disabled={deletingId === entry.id}
                            className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition cursor-pointer disabled:opacity-50"
                            title="Delete journal voucher"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    {searchQuery || startDate || endDate ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-[#0F172A]">No journal entries found matching your search or date range.</p>
                        <p className="text-xs text-[#94A3B8]">Try clearing your search term or adjusting the date range.</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClearFilters}
                          className="h-8 mt-2 text-xs font-semibold"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    ) : (
                      `No journal entries recorded for ${activeCompany.name} yet.`
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER BAR */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/70 px-5 py-3.5 text-xs text-[#64748B]">
            {/* Left: Showing Range and Per Page Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <strong className="text-[#0F172A]">{pagination.from}</strong> to{" "}
                <strong className="text-[#0F172A]">{pagination.to}</strong> of{" "}
                <strong className="text-[#0F172A]">{pagination.total}</strong> entries
              </span>

              <div className="flex items-center gap-1.5 ml-2 border-l border-[#CBD5E1] pl-3">
                <label className="text-[11px] text-[#64748B]">Rows per page:</label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPerPage(newSize);
                    setCurrentPage(1);
                  }}
                  className="h-7 rounded border border-[#E2E8F0] bg-white px-2 text-xs font-bold text-[#0F172A] focus:border-[#2563EB] focus:outline-none cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Controls */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  title="First Page"
                >
                  <ChevronsLeft size={14} />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="flex h-7 items-center gap-1 px-2.5 rounded border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs font-medium"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-[#94A3B8] font-bold">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => handlePageChange(p as number)}
                        disabled={loading}
                        className={`flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-xs font-bold transition cursor-pointer ${
                          currentPage === p
                            ? "bg-[#2563EB] text-white shadow-xs border border-[#2563EB]"
                            : "border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] shadow-2xs"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.lastPage || loading}
                  className="flex h-7 items-center gap-1 px-2.5 rounded border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs font-medium"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.lastPage)}
                  disabled={currentPage === pagination.lastPage || loading}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  title="Last Page"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
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
                <p className="text-[10px] text-[#2563EB] font-medium">
                  ✓ Flexible dates supported: DD-MM-YYYY, DD/MM/YYYY, DD-MM-YY (e.g. 09-08-26), and YYYY-MM-DD.
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

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="overwriteExisting"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] mt-0.5 cursor-pointer"
                />
                <label htmlFor="overwriteExisting" className="text-xs text-[#0F172A] cursor-pointer select-none">
                  <span className="font-semibold">Replace existing entries with matching Reference</span>
                  <span className="block text-[11px] text-[#64748B]">
                    Replaces previously imported vouchers with the same reference (e.g. JV-1001) with clean dates & balances.
                  </span>
                </label>
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
