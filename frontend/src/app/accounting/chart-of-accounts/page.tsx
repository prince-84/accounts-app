"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  CornerDownRight,
  Download,
  Edit2,
  Filter,
  History,
  Layers,
  MoreVertical,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default function ChartOfAccountsPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & Menus State
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [historyModalAccount, setHistoryModalAccount] = useState<any | null>(null);
  const [accountHistory, setAccountHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "expense",
    sub_type: "operating_expense",
    parent_id: "",
    description: "",
    opening_balance: 0,
  });

  const loadAccounts = () => {
    setLoading(true);
    api
      .getChartOfAccounts()
      .then((res) => {
        if (res.success) {
          setAccounts(res.data || []);
        }
      })
      .catch((err) => console.error("Error loading COA:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, [activeCompany.id]);

  const openNewAccountModal = (parentId: string = "") => {
    setEditingAccount(null);
    setFormData({
      code: "",
      name: "",
      type: "expense",
      sub_type: "operating_expense",
      parent_id: parentId,
      description: "",
      opening_balance: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (acc: any) => {
    setEditingAccount(acc);
    setFormData({
      code: acc.code || "",
      name: acc.name || "",
      type: acc.type || "expense",
      sub_type: acc.sub_type || "operating_expense",
      parent_id: acc.parent_id ? String(acc.parent_id) : "",
      description: acc.description || "",
      opening_balance: parseFloat(acc.opening_balance) || 0,
    });
    setShowModal(true);
    setActiveMenuId(null);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAccount) {
        await api.updateAccount(editingAccount.id, {
          code: formData.code,
          name: formData.name,
          type: formData.type,
          sub_type: formData.sub_type,
          parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
          description: formData.description,
        });
      } else {
        await api.createAccount({
          company_id: activeCompany.id,
          code: formData.code,
          name: formData.name,
          type: formData.type,
          sub_type: formData.sub_type,
          parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
          description: formData.description,
          opening_balance: formData.opening_balance,
        });
      }
      setShowModal(false);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (acc: any) => {
    try {
      await api.toggleAccountActive(acc.id);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || "Failed to change account status");
    } finally {
      setActiveMenuId(null);
    }
  };

  const openAccountHistory = (acc: any) => {
    setHistoryModalAccount(acc);
    setLoadingHistory(true);
    setActiveMenuId(null);
    api
      .getLedger(acc.id)
      .then((res) => {
        if (res.success) {
          setAccountHistory(res.data?.entries || res.data || []);
        }
      })
      .catch((err) => console.error("Error loading account history:", err))
      .finally(() => setLoadingHistory(false));
  };

  // Organize accounts into Parent/Child Hierarchy for display
  const parentAccounts = accounts.filter((a) => !a.parent_id);
  
  // Build a structured list where children follow their parent
  const structuredAccounts: { account: any; isChild: boolean; level: number }[] = [];
  
  const addAccountAndChildren = (acc: any, level: number = 0) => {
    structuredAccounts.push({ account: acc, isChild: level > 0, level });
    const children = accounts.filter((c) => c.parent_id === acc.id);
    children.forEach((child) => addAccountAndChildren(child, level + 1));
  };

  parentAccounts.forEach((p) => addAccountAndChildren(p, 0));

  // Filter accounts by search and selected category filter
  const filteredStructuredAccounts = structuredAccounts.filter(({ account }) => {
    const matchesType = selectedType === "all" || account.type === selectedType || account.sub_type === selectedType;
    const matchesSearch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const accountTypeDisplayMap: Record<string, string> = {
    asset: "Assets",
    liability: "Liabilities",
    equity: "Equity",
    revenue: "Revenue",
    expense: "Expenses",
    cash_bank: "Cash and cash equivalents",
    accounts_receivable: "Accounts receivable (A/R)",
    current_asset: "Current assets",
    accounts_payable: "Accounts payable (A/P)",
    current_liability: "Current liabilities",
    operating_revenue: "Operating revenue",
    operating_expense: "Operating expenses",
  };

  const toggleSelectAll = () => {
    if (selectedAccounts.length === filteredStructuredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredStructuredAccounts.map((item) => item.account.id));
    }
  };

  const toggleSelectAccount = (id: number) => {
    if (selectedAccounts.includes(id)) {
      setSelectedAccounts(selectedAccounts.filter((i) => i !== id));
    } else {
      setSelectedAccounts([...selectedAccounts, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching attached specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "GENERAL LEDGER", "CHART OF ACCOUNTS"]}
        title="Chart of Accounts"
        description="Standardized multi-tier general ledger hierarchy and live trial balance tracking across active entities."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const csvContent =
                  "data:text/csv;charset=utf-8," +
                  ["Code,Name,Type,Current Balance"]
                    .concat(
                      filteredStructuredAccounts.map(
                        (i) =>
                          `"${i.account.code}","${i.account.name}","${i.account.type}",${i.account.current_balance}`
                      )
                    )
                    .join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `chart_of_accounts_${activeCompany.code}.csv`);
                document.body.appendChild(link);
                link.click();
              }}
              className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs inline-flex items-center gap-1.5"
            >
              <Download size={14} className="text-[#64748B]" />
              Export CSV
            </Button>

            <Button
              onClick={() => openNewAccountModal()}
              className="h-9 rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              Add Ledger Account
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 lg:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                placeholder="Filter by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-md border-[#E2E8F0] bg-[#F8FAFC] pl-9 text-xs text-[#0F172A] focus-visible:bg-white focus-visible:border-[#2563EB]"
              />
            </div>

            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-medium text-[#0F172A] focus:border-[#2563EB] focus:bg-white cursor-pointer"
            >
              <option value="all">All Account Types</option>
              <option value="asset">Assets</option>
              <option value="cash_bank">Cash and bank</option>
              <option value="accounts_receivable">Accounts receivable (A/R)</option>
              <option value="current_asset">Current assets</option>
              <option value="liability">Liabilities</option>
              <option value="accounts_payable">Accounts payable (A/P)</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expenses</option>
            </select>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2 text-[#64748B]">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
              title="Print"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={loadAccounts}
              className="p-2 rounded-md hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
              title="Refresh"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.length > 0 && selectedAccounts.length === filteredStructuredAccounts.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                </th>
                <th className="px-4 py-3">Code & Name</th>
                <th className="px-4 py-3">Account type</th>
                <th className="px-4 py-3 text-right">QuickBooks balance</th>
                <th className="px-4 py-3 text-right">Bank balance</th>
                <th className="px-4 py-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading Chart of Accounts...
                  </td>
                </tr>
              ) : filteredStructuredAccounts.length > 0 ? (
                filteredStructuredAccounts.map(({ account: acc, isChild, level }) => {
                  const isSelected = selectedAccounts.includes(acc.id);
                  const isMenuOpen = activeMenuId === acc.id;

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/80 transition ${
                        !acc.is_active ? "opacity-60 bg-slate-50/50" : ""
                      } ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAccount(acc.id)}
                          className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                        />
                      </td>

                      {/* Name with Hierarchy indentation */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${level * 24}px` }}
                        >
                          {isChild && (
                            <CornerDownRight size={13} className="text-slate-400 shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-slate-500">
                                {acc.code}
                              </span>
                              <span
                                className={`font-semibold ${
                                  !isChild ? "text-slate-900 font-bold" : "text-slate-700"
                                }`}
                              >
                                {acc.name}
                              </span>
                              {acc.is_system && (
                                <span
                                  title="System Control Account"
                                  className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-700"
                                >
                                  <ShieldCheck size={10} />
                                  Control
                                </span>
                              )}
                              {!acc.is_active && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {acc.description && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                {acc.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Account type */}
                      <td className="px-4 py-3 text-slate-600">
                        {accountTypeDisplayMap[acc.sub_type] ||
                          accountTypeDisplayMap[acc.type] ||
                          acc.type}
                      </td>

                      {/* QuickBooks balance */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(parseFloat(acc.current_balance))}
                      </td>

                      {/* Bank balance */}
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {acc.sub_type === "bank_cash"
                          ? formatCurrency(parseFloat(acc.current_balance))
                          : "—"}
                      </td>

                      {/* Action dropdown button */}
                      <td className="px-4 py-3 text-center relative">
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-xs">
                          <button
                            onClick={() => openAccountHistory(acc)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-slate-50 rounded-l-lg cursor-pointer"
                          >
                            Account history
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : acc.id);
                            }}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-50 border-l border-slate-200 rounded-r-lg cursor-pointer"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>

                        {/* Dropdown Menu Popup */}
                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 z-30 w-48 rounded-xl bg-white p-1 shadow-xl border border-slate-200 text-left text-xs">
                            <button
                              onClick={() => openEditModal(acc)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Edit2 size={13} className="text-slate-500" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                openNewAccountModal(String(acc.id));
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Plus size={13} className="text-slate-500" />
                              Create subaccount
                            </button>
                            <button
                              onClick={() => openAccountHistory(acc)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <History size={13} className="text-slate-500" />
                              Run report
                            </button>
                            {!acc.is_system && (
                              <button
                                onClick={() => handleToggleActive(acc)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 cursor-pointer ${
                                  acc.is_active
                                    ? "text-rose-600 hover:bg-rose-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {acc.is_active ? (
                                  <>
                                    <X size={13} />
                                    Make inactive
                                  </>
                                ) : (
                                  <>
                                    <Check size={13} />
                                    Make active
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No accounts match the specified criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New / Edit Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  {editingAccount ? "Edit Account" : "New Account"}
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  {activeCompany.name} ({activeCompany.currency})
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Account Code <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. 5080"
                    value={formData.code}
                    disabled={editingAccount?.is_system}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A] disabled:bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Account Name <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Advertising & Marketing"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Account Type <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Sub-Type / Classification</label>
                  <select
                    value={formData.sub_type}
                    onChange={(e) => setFormData({ ...formData, sub_type: e.target.value })}
                    className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="bank_cash">Cash and bank</option>
                    <option value="accounts_receivable">Accounts receivable (A/R)</option>
                    <option value="current_asset">Current assets</option>
                    <option value="fixed_asset">Fixed assets</option>
                    <option value="accounts_payable">Accounts payable (A/P)</option>
                    <option value="current_liability">Current liabilities</option>
                    <option value="operating_revenue">Operating revenue</option>
                    <option value="operating_expense">Operating expense</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Parent Account (Is Sub-account of)</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="">None (Top-Level Account)</option>
                  {accounts
                    .filter((a) => !editingAccount || a.id !== editingAccount.id)
                    .map((parentAcc) => (
                      <option key={parentAcc.id} value={parentAcc.id}>
                        {parentAcc.code} - {parentAcc.name} ({parentAcc.type})
                      </option>
                    ))}
                </select>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Opening Balance</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) =>
                      setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 rounded-md border-[#E2E8F0] bg-white font-mono text-xs text-[#0F172A]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Description / Note</label>
                <Input
                  placeholder="Optional details about this account"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-4 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {saving ? "Saving..." : editingAccount ? "Update Account" : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account History / Ledger Modal */}
      {historyModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-2xl border border-[#E2E8F0] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <History size={16} className="text-[#2563EB]" />
                  Account History: {historyModalAccount.code} - {historyModalAccount.name}
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Current Balance: <span className="font-mono font-bold text-[#0F172A]">{formatCurrency(parseFloat(historyModalAccount.current_balance))}</span>
                </p>
              </div>
              <button
                onClick={() => setHistoryModalAccount(null)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto">
              {loadingHistory ? (
                <div className="py-12 text-center text-[#64748B]">Loading account ledger entries...</div>
              ) : accountHistory.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Voucher / Ref #</th>
                      <th className="px-3 py-2.5">Description / Narration</th>
                      <th className="px-3 py-2.5 text-right">Debit</th>
                      <th className="px-3 py-2.5 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                    {accountHistory.map((line: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2.5 font-mono text-xs text-[#64748B]">{formatDateDDMMYYYY(line.created_at)}</td>
                        <td className="px-3 py-2.5 font-semibold text-[#2563EB]">{line.journal_entry?.entry_number || line.reference || "JV"}</td>
                        <td className="px-3 py-2.5">{line.description || "General Ledger entry"}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{parseFloat(line.debit) > 0 ? formatCurrency(parseFloat(line.debit)) : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{parseFloat(line.credit) > 0 ? formatCurrency(parseFloat(line.credit)) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-[#64748B]">No transactions recorded for this account yet.</div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-end">
              <Button onClick={() => setHistoryModalAccount(null)} className="h-9 rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
