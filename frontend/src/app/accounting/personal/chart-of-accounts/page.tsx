"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Power, Search, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";

const TYPE_LABELS: Record<string, { label: string; badge: string }> = {
  asset: { label: "Assets & Banks", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  ledger: { label: "Client / Friend Ledgers", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  liability: { label: "Liabilities & Cards", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  income: { label: "Personal Income", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expense: { label: "Personal Expenses", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  equity: { label: "Equity / Net Worth", badge: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function PersonalChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "expense",
    account_number: "",
    opening_balance: "0",
    description: "",
  });

  const loadAccounts = () => {
    setLoading(true);
    api
      .getPersonalAccounts()
      .then((res) => {
        if (res.success) setAccounts(res.data || []);
      })
      .catch((err) => console.error("Error loading personal COA:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (typeFilter !== "all" && acc.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          acc.name?.toLowerCase().includes(q) ||
          acc.code?.toLowerCase().includes(q) ||
          acc.account_number?.toLowerCase().includes(q) ||
          acc.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, search, typeFilter]);

  const openAdd = () => {
    setEditing(null);
    setError(null);
    setFormData({
      code: "",
      name: "",
      type: "expense",
      account_number: "",
      opening_balance: "0",
      description: "",
    });
    setShowModal(true);
  };

  const openEdit = (acc: any) => {
    setEditing(acc);
    setError(null);
    setFormData({
      code: acc.code || "",
      name: acc.name || "",
      type: acc.type || "expense",
      account_number: acc.account_number || "",
      opening_balance: String(acc.opening_balance ?? 0),
      description: acc.description || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim()) {
      setError("Account / Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance || "0"),
      };
      const res = editing
        ? await api.updatePersonalAccount(editing.id, payload)
        : await api.createPersonalAccount(payload);

      if (res.success) {
        setShowModal(false);
        loadAccounts();
      } else {
        setError(res.message || "Failed to save personal account");
      }
    } catch (err: any) {
      setError(err.message || "Error saving account");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await api.togglePersonalAccountActive(id);
      if (res.success) loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete personal account "${name}"?`)) return;
    try {
      const res = await api.deletePersonalAccount(id);
      if (res.success) {
        loadAccounts();
      } else {
        alert(res.message || "Could not delete account");
      }
    } catch (err: any) {
      alert(err.message || "Could not delete account");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["OWNER PERSONAL ACCOUNTS", "CONFIGURATION", "PERSONAL CHART OF ACCOUNTS"]}
        title="Personal Chart of Accounts"
        description="Independent personal categories, bank accounts, credit cards, and party ledgers for the Owner."
        actions={
          <Button
            onClick={openAdd}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] cursor-pointer"
          >
            <Plus size={15} />
            New Personal Account
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search personal accounts or categories..."
            className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 text-xs text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "asset", label: "Assets & Banks" },
            { id: "ledger", label: "Ledgers" },
            { id: "liability", label: "Liabilities" },
            { id: "income", label: "Income" },
            { id: "expense", label: "Expenses" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                typeFilter === t.id
                  ? "bg-[#2563EB] text-white"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Account / Category Name</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Account # / Notes</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#64748B]">
                  Loading personal chart of accounts...
                </td>
              </tr>
            ) : filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc) => {
                const meta = TYPE_LABELS[acc.type] || TYPE_LABELS.expense;
                return (
                  <tr key={acc.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="px-5 py-3 font-mono font-bold text-[#2563EB]">{acc.code || "—"}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openEdit(acc)}
                        className="font-semibold text-[#0F172A] hover:text-[#2563EB] hover:underline cursor-pointer text-left"
                      >
                        {acc.name}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.badge}`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#64748B]">
                      {acc.account_number ? <span className="font-mono text-[#0F172A] mr-2">{acc.account_number}</span> : null}
                      {acc.description || "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          acc.is_active
                            ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                            : "bg-slate-100 text-[#64748B] border border-slate-200"
                        }`}
                      >
                        {acc.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(acc)}
                          className="rounded p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(acc.id)}
                          className="rounded p-1.5 text-[#64748B] hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                          title="Toggle Active"
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id, acc.name)}
                          className="rounded p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer"
                          title="Delete"
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
                <td colSpan={6} className="py-10 text-center text-[#64748B]">
                  No personal accounts match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#0F172A]">
                {editing ? "Edit Personal Account" : "New Personal Account / Category"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. P-5015"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-2.5"
                  >
                    <option value="asset">Asset / Bank</option>
                    <option value="ledger">Client / Friend Ledger</option>
                    <option value="liability">Liability / Card</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="equity">Equity / Net Worth</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Account / Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ADCB Personal Bank, Travel, Family Expense..."
                  className="h-9 w-full rounded-md border border-[#E2E8F0] px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Optional (e.g. 10500706132001)"
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-[#E2E8F0] p-2.5"
                />
              </div>

              {error && (
                <div className="rounded bg-rose-50 p-2.5 text-rose-700 border border-rose-200">{error}</div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="h-9 bg-[#2563EB] text-white text-xs font-bold px-4">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
