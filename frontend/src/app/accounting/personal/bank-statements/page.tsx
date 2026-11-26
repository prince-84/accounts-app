"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit2,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

type DatePreset = "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";

export default function PersonalBankStatementsPage() {
  const [statements, setStatements] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_debit: 0, total_credit: 0, net_flow: 0 });

  // Pagination (default 20 records)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, lastPage: 1 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Add / Edit Entry Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    personal_account_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    debit: "",
    credit: "",
    balance: "",
    category: "",
    notes: "",
    statement_month: "",
  });

  const formatAED = (val: number) =>
    `AED ${Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const loadAccounts = () => {
    api
      .getPersonalAccounts()
      .then((res) => {
        if (res.success) {
          setAccounts(res.data || []);
        }
      })
      .catch((err) => console.error("Error loading personal accounts:", err));
  };

  const loadStatements = (pageToLoad = currentPage, perPageToLoad = perPage) => {
    setLoading(true);
    api
      .getPersonalBankStatements({
        search: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: pageToLoad,
        per_page: perPageToLoad,
      })
      .then((res) => {
        if (res.success) {
          const resData = res.data;
          if (resData?.data && Array.isArray(resData.data)) {
            setStatements(resData.data);
            setPagination({
              total: resData.total ?? resData.data.length,
              from: resData.from ?? (resData.data.length > 0 ? 1 : 0),
              to: resData.to ?? resData.data.length,
              lastPage: resData.last_page ?? 1,
            });
            setCurrentPage(resData.current_page ?? pageToLoad);
          } else {
            const list = Array.isArray(resData) ? resData : [];
            setStatements(list);
            setPagination({
              total: list.length,
              from: list.length > 0 ? 1 : 0,
              to: list.length,
              lastPage: 1,
            });
          }
          if (res.summary) {
            setSummary(res.summary);
          }
        }
      })
      .catch((err) => console.error("Error loading bank statements:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
    const timer = setTimeout(() => {
      loadStatements(1, perPage);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, startDate, endDate, perPage]);

  const bankAccounts = accounts.filter((a) => a.type === "asset");
  const categories = accounts.filter((a) => a.type !== "asset" || a.name === "Transfer / Cash" || a.name === "Investment");

  const openAddModal = () => {
    setEditingEntry(null);
    setFormError(null);
    const defaultBank = bankAccounts[0]?.id ? String(bankAccounts[0].id) : "";
    setFormData({
      personal_account_id: defaultBank,
      transaction_date: new Date().toISOString().split("T")[0],
      description: "",
      debit: "",
      credit: "",
      balance: "",
      category: "",
      notes: "",
      statement_month: "",
    });
    setShowFormModal(true);
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setFormError(null);
    const dateVal = entry.transaction_date
      ? String(entry.transaction_date).split("T")[0]
      : new Date().toISOString().split("T")[0];
    setFormData({
      personal_account_id: entry.personal_account_id ? String(entry.personal_account_id) : "",
      transaction_date: dateVal,
      description: entry.description || "",
      debit: Number(entry.debit) > 0 ? String(entry.debit) : "",
      credit: Number(entry.credit) > 0 ? String(entry.credit) : "",
      balance: entry.balance !== null && entry.balance !== undefined ? String(entry.balance) : "",
      category: entry.category || "",
      notes: entry.notes || "",
      statement_month: entry.statement_month || "",
    });
    setShowFormModal(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.transaction_date || !formData.description.trim()) {
      setFormError("Date and Description are required.");
      return;
    }

    const debitNum = parseFloat(formData.debit || "0");
    const creditNum = parseFloat(formData.credit || "0");
    if (debitNum <= 0 && creditNum <= 0) {
      setFormError("Please enter either a Debit (Money Out) or Credit (Money In) amount.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        personal_account_id: formData.personal_account_id ? Number(formData.personal_account_id) : null,
        transaction_date: formData.transaction_date,
        description: formData.description.trim(),
        debit: debitNum,
        credit: creditNum,
        balance: formData.balance !== "" ? parseFloat(formData.balance) : 0,
        category: formData.category.trim() || null,
        notes: formData.notes.trim() || null,
        statement_month: formData.statement_month.trim() || undefined,
      };

      const res = editingEntry
        ? await api.updatePersonalBankStatement(editingEntry.id, payload)
        : await api.createPersonalBankStatement(payload);

      if (res.success) {
        setShowFormModal(false);
        loadAccounts();
        loadStatements(editingEntry ? currentPage : 1, perPage);
      } else {
        setFormError(res.message || "Failed to save entry");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please select the Excel (.xlsx) or CSV file to import.");
      return;
    }

    setImporting(true);
    setImportError(null);

    const fd = new FormData();
    fd.append("file", importFile);
    fd.append("clear_existing", String(clearExisting));

    try {
      const res = await api.importPersonalBankStatements(fd);
      if (res.success) {
        alert(res.message || "Bank statement imported successfully!");
        setShowImportModal(false);
        setImportFile(null);
        loadAccounts();
        loadStatements(1, perPage);
      } else {
        setImportError(res.message || "Failed to import bank statement.");
      }
    } catch (err: any) {
      setImportError(err.message || "Unexpected error during import.");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bank statement entry?")) return;
    try {
      const res = await api.deletePersonalBankStatement(id);
      if (res.success) {
        loadStatements(currentPage, perPage);
      } else {
        alert(res.message || "Failed to delete entry");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete entry");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected bank statement entries?`)) return;

    setBulkDeleting(true);
    try {
      const res = await api.bulkDeletePersonalBankStatements(selectedIds);
      if (res.success) {
        setSelectedIds([]);
        loadStatements(currentPage, perPage);
      } else {
        alert(res.message || "Bulk delete failed");
      }
    } catch (err: any) {
      alert(err.message || "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "this_month") {
      const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDayNum = new Date(year, month + 1, 0).getDate();
      setStartDate(firstDay);
      setEndDate(`${year}-${String(month + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`);
    } else if (preset === "last_month") {
      const prev = new Date(year, month - 1, 1);
      const pYear = prev.getFullYear();
      const pMonth = prev.getMonth();
      const lastDayNum = new Date(pYear, pMonth + 1, 0).getDate();
      setStartDate(`${pYear}-${String(pMonth + 1).padStart(2, "0")}-01`);
      setEndDate(`${pYear}-${String(pMonth + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`);
    } else if (preset === "this_quarter") {
      const q = Math.floor(month / 3);
      const qStart = q * 3 + 1;
      const qEnd = q * 3 + 3;
      const lastDayNum = new Date(year, qEnd, 0).getDate();
      setStartDate(`${year}-${String(qStart).padStart(2, "0")}-01`);
      setEndDate(`${year}-${String(qEnd).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`);
    } else if (preset === "this_year") {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === statements.length && statements.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(statements.map((s) => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.lastPage || newPage === currentPage) return;
    setCurrentPage(newPage);
    setSelectedIds([]);
    loadStatements(newPage, perPage);
  };

  const getPageNumbers = () => {
    const totalPages = pagination.lastPage;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["OWNER PERSONAL ACCOUNTS", "BANKING", "BANK STATEMENTS"]}
        title="Personal Bank Statements"
        description="Import ADCB / personal bank statements using the Excel template or manage manual entries."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/templates/bank-statement-format.xlsx"
              download="bank-statement-format.xlsx"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition"
            >
              <Download size={14} className="text-[#16A34A]" />
              Download Excel Template
            </a>

            <Button
              variant="outline"
              onClick={() => {
                setImportError(null);
                setImportFile(null);
                setShowImportModal(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs cursor-pointer"
            >
              <Upload size={14} className="text-[#2563EB]" />
              Import Statement
            </Button>

            <Button
              onClick={openAddModal}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] cursor-pointer"
            >
              <Plus size={15} />
              Add Manual Entry
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Money In (Credit)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#16A34A]">{formatAED(summary.total_credit)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A]">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Money Out (Debit)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#DC2626]">{formatAED(summary.total_debit)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#DC2626]">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Net Cashflow</p>
            <p className={`mt-1 font-mono text-lg font-bold ${summary.net_flow >= 0 ? "text-[#0F172A]" : "text-[#DC2626]"}`}>
              {formatAED(summary.net_flow)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* Search, Category & Date Filter Toolbar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, category, notes, amount, date..."
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-8 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none min-w-[180px]"
            >
              <option value="">All Categories</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: "all", label: "All Dates" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "this_quarter", label: "This Quarter" },
              { id: "this_year", label: "This Year" },
              { id: "custom", label: "Custom" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id as DatePreset)}
                className={`rounded-md px-2.5 py-1.5 font-semibold transition cursor-pointer ${
                  datePreset === p.id
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#F1F5F9] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar size={14} className="text-[#2563EB]" />
            <span className="font-semibold text-[#0F172A]">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            />
            <ArrowRight size={13} className="text-[#94A3B8]" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            />

            {(searchQuery || selectedCategory || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] border border-[#E2E8F0] ml-2 cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>

          <div className="text-xs text-[#64748B]">
            Total Found: <strong className="text-[#0F172A]">{pagination.total}</strong> entries
          </div>
        </div>
      </div>

      {/* Bulk Delete Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-950">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-rose-600 text-white rounded-full px-2.5 py-0.5">{selectedIds.length}</span>
            <span className="font-bold">selected entries</span>
            <button type="button" onClick={() => setSelectedIds([])} className="underline ml-2 cursor-pointer">
              Clear
            </button>
          </div>
          <Button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 cursor-pointer"
          >
            <Trash2 size={13} className="mr-1.5" />
            {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </Button>
        </div>
      )}

      {/* Statement Table */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="w-10 px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={statements.length > 0 && selectedIds.length === statements.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#CBD5E1] text-[#2563EB] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5 text-right">Debit (Out)</th>
                <th className="px-4 py-3.5 text-right">Credit (In)</th>
                <th className="px-4 py-3.5 text-right">Balance</th>
                <th className="px-4 py-3.5">Month</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    Loading personal bank statements...
                  </td>
                </tr>
              ) : statements.length > 0 ? (
                statements.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  return (
                    <tr key={row.id} className={`hover:bg-[#F8FAFC] transition ${isSelected ? "bg-rose-50/40" : ""}`}>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-[#CBD5E1] text-[#2563EB] cursor-pointer"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[#64748B]">
                        {row.is_opening ? (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            OPENING
                          </span>
                        ) : (
                          formatDateDDMMYYYY(row.transaction_date)
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="font-semibold text-[#0F172A]">{row.description}</p>
                        <p className="text-[10px] text-[#94A3B8]">
                          {row.bank_name} {row.account_number ? `• ${row.account_number}` : ""}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.category ? (
                          <span className="inline-flex rounded-md bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">
                            {row.category}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] text-[11px] text-[#64748B]">
                        {row.notes || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-[#DC2626]">
                        {Number(row.debit) > 0 ? formatAED(Number(row.debit)) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-[#16A34A]">
                        {Number(row.credit) > 0 ? formatAED(Number(row.credit)) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {formatAED(Number(row.balance || 0))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#64748B]">
                        {row.statement_month || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(row)}
                            className="rounded-md p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="rounded-md p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    <div className="space-y-2">
                      <p className="font-semibold text-[#0F172A]">No personal bank statement entries found.</p>
                      <p className="text-xs text-[#94A3B8]">
                        Download the Excel template, fill your ADCB/personal statement, and click &quot;Import Statement&quot; or add a manual entry.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Default 20) */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/70 px-5 py-3.5 text-xs text-[#64748B]">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <strong className="text-[#0F172A]">{pagination.from}</strong> to{" "}
                <strong className="text-[#0F172A]">{pagination.to}</strong> of{" "}
                <strong className="text-[#0F172A]">{pagination.total}</strong> entries
              </span>
              <div className="flex items-center gap-1.5 ml-2 border-l border-[#CBD5E1] pl-3">
                <label className="text-[11px]">Rows per page:</label>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="h-7 rounded border border-[#E2E8F0] bg-white px-2 text-xs font-bold text-[#0F172A]"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {pagination.lastPage > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="flex h-7 items-center gap-1 px-2.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((p, idx) =>
                    p === "..." ? (
                      <span key={`e-${idx}`} className="px-1">...</span>
                    ) : (
                      <button
                        key={`p-${p}`}
                        type="button"
                        onClick={() => handlePageChange(p as number)}
                        className={`flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-xs font-bold cursor-pointer ${
                          currentPage === p
                            ? "bg-[#2563EB] text-white"
                            : "border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.lastPage || loading}
                  className="flex h-7 items-center gap-1 px-2.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] disabled:opacity-35 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.lastPage)}
                  disabled={currentPage === pagination.lastPage || loading}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT MANUAL ENTRY MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  {editingEntry ? "Edit Bank Statement Entry" : "Add Manual Bank Statement Entry"}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Record or update a personal bank transaction with category & notes.
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-md p-1 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Bank Account</label>
                  <select
                    value={formData.personal_account_id}
                    onChange={(e) => setFormData({ ...formData, personal_account_id: e.target.value })}
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="">ADCB Personal Bank (10500706132001)</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.account_number ? `(${b.account_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Transaction Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  Description <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Incoming transfer, Card payment, Grocery..."
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#DC2626] mb-1">Debit (Money Out)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.debit}
                    onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                    placeholder="0.00"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 font-mono text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#16A34A] mb-1">Credit (Money In)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    placeholder="0.00"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 font-mono text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Running Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0.00"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 font-mono text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Category (Pick or Type)</label>
                  <input
                    list="personal-category-list"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Select or type category..."
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                  <datalist id="personal-category-list">
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Statement Month</label>
                  <input
                    type="text"
                    value={formData.statement_month}
                    onChange={(e) => setFormData({ ...formData, statement_month: e.target.value })}
                    placeholder="Auto from date (e.g. Oct 2026)"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional details or reconciliation notes..."
                  className="w-full rounded-md border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-[#FEF2F2] p-3 border border-[#FCA5A5] text-xs font-medium text-[#DC2626]">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormModal(false)}
                  className="h-9 rounded-md text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-md bg-[#2563EB] px-5 text-xs font-bold text-white hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingEntry ? "Update Entry" : "Save Entry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL / CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">Import Personal Bank Statement</h2>
                  <p className="text-xs text-[#64748B]">
                    Upload the official <code className="font-mono">bank-statement-format.xlsx</code> or CSV file
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
                  <span className="text-xs font-bold text-[#0F172A]">Official Excel Format</span>
                  <a
                    href="/templates/bank-statement-format.xlsx"
                    download="bank-statement-format.xlsx"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] hover:underline"
                  >
                    <Download size={13} />
                    Download bank-statement-format.xlsx
                  </a>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Supports exact columns: <code className="bg-white px-1 rounded border">Date</code>,{" "}
                  <code className="bg-white px-1 rounded border">Description</code>,{" "}
                  <code className="bg-white px-1 rounded border">Debit (money out)</code>,{" "}
                  <code className="bg-white px-1 rounded border">Credit (money in)</code>,{" "}
                  <code className="bg-white px-1 rounded border">Balance</code>,{" "}
                  <code className="bg-white px-1 rounded border">Category (pick)</code>,{" "}
                  <code className="bg-white px-1 rounded border">Notes</code>,{" "}
                  <code className="bg-white px-1 rounded border">Month</code>.
                </p>
              </div>

              <div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#CBD5E1] border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={22} className="text-[#64748B] mb-2" />
                    <p className="text-xs text-[#0F172A] font-semibold">
                      {importFile ? importFile.name : "Click to select .xlsx or .csv file"}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1">
                      {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "Excel (.xlsx) or CSV"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImportFile(e.target.files[0]);
                        setImportError(null);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="clearExisting"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] mt-0.5 cursor-pointer"
                />
                <label htmlFor="clearExisting" className="text-xs text-[#0F172A] cursor-pointer">
                  <span className="font-semibold">Replace existing entries for this bank account</span>
                  <span className="block text-[11px] text-[#64748B]">
                    Clears previous rows for the detected bank account before importing fresh rows.
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
                  disabled={importing || !importFile}
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
