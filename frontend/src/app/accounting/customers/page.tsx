"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

function getInitials(name: string) {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function CustomersPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    tax_number: "",
    address: "",
    opening_balance: 0,
  });

  const loadCustomers = () => {
    setLoading(true);
    api
      .getCustomers()
      .then((res) => {
        if (res.success) {
          setCustomers(res.data || []);
        }
      })
      .catch((err) => console.error("Error loading customers:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [activeCompany.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCustomer({
        company_id: activeCompany.id,
        ...newCustomer,
      });
      setShowModal(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        tax_number: "",
        address: "",
        opening_balance: 0,
      });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header matching specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "SALES & RECEIVABLES", "CUSTOMERS"]}
        title="Customers"
        description="Enterprise client directory, contact accounts, and live accounts receivable balances."
        actions={
          <Button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#1D4ED8] text-xs cursor-pointer"
          >
            <Plus size={15} />
            Add Customer
          </Button>
        }
      />

      {/* Filter and Search Bar with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-xs">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Search customer by name, email, or TRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-md border-[#E2E8F0] bg-[#F8FAFC] pl-9 text-xs text-[#0F172A] focus-visible:bg-white focus-visible:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#64748B]">
            <strong className="text-[#0F172A]">{filtered.length}</strong> of {customers.length} clients
          </span>

          <div className="flex items-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Card View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE: SMART CARDS GRID */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">
              Loading customer accounts...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((customer) => {
              const due = parseFloat(customer.current_balance || 0);
              const hasDue = due > 0.01;

              return (
                <div
                  key={customer.id}
                  className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs hover:border-[#CBD5E1] hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Monogram + Status Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs font-mono tracking-wider">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#0F172A] truncate max-w-[160px]" title={customer.name}>
                            {customer.name}
                          </h3>
                          {customer.tax_number && (
                            <span className="inline-block text-[10px] font-mono text-[#64748B]">
                              TRN: {customer.tax_number}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                          hasDue
                            ? "bg-amber-50 text-amber-700 border-amber-200/80"
                            : "bg-[#ECFDF5] text-[#059669] border-[#10B981]/20"
                        }`}
                      >
                        {hasDue ? "Balance Due" : "Settled"}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="mt-3.5 space-y-1.5 border-t border-[#F8FAFC] pt-3 text-xs text-[#64748B]">
                      {customer.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate hover:text-[#0F172A]">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="font-mono text-[11px]">{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 truncate text-[11px] text-[#94A3B8]">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Bottom Action Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Receivable
                      </span>
                      <span className="font-mono text-sm font-bold text-[#0F172A]">
                        {formatCurrency(due)}
                      </span>
                    </div>

                    <Link
                      href="/accounting/invoices"
                      className="inline-flex items-center gap-1 rounded-md bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#2563EB] border border-[#E2E8F0] hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition cursor-pointer"
                    >
                      <Plus size={12} />
                      Invoice
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">
              No customers found for {activeCompany.name}.
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: DATA TABLE */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-4 py-3.5">Client / Customer</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Tax ID / TRN</th>
                  <th className="px-4 py-3.5 text-right">Receivable Due</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#94A3B8]">
                      Loading clients...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((customer) => {
                    const due = parseFloat(customer.current_balance || 0);
                    const hasDue = due > 0.01;

                    return (
                      <tr key={customer.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs font-mono">
                              {getInitials(customer.name)}
                            </div>
                            <span className="font-bold text-[#0F172A]">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B]">
                          <p>{customer.email || "—"}</p>
                          {customer.phone && <p className="font-mono text-[11px]">{customer.phone}</p>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#64748B]">
                          {customer.tax_number || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                          {formatCurrency(due)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${
                              hasDue
                                ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                : "bg-[#ECFDF5] text-[#059669] border-[#10B981]/20"
                            }`}
                          >
                            {hasDue ? "Balance Due" : "Settled"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            href="/accounting/invoices"
                            className="inline-flex items-center gap-1 rounded-md bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#2563EB] border border-[#E2E8F0] hover:bg-[#EFF6FF] transition cursor-pointer"
                          >
                            <Plus size={12} />
                            Invoice
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#94A3B8]">
                      No customers found for {activeCompany.name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl text-xs border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Add New Customer</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Register client account for {activeCompany.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Customer / Client Name <span className="text-[#EF4444]">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Apex Global Logistics LLC"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="billing@client.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Phone
                  </label>
                  <Input
                    placeholder="+971..."
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Tax Registration / TRN
                  </label>
                  <Input
                    placeholder="Tax identifier"
                    value={newCustomer.tax_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, tax_number: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Opening Balance
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCustomer.opening_balance}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        opening_balance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-md border-[#E2E8F0] bg-white font-mono text-xs text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Country"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full rounded-md border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="h-9 rounded-md text-xs border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] px-4 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-bold text-white text-xs px-5 shadow-xs"
                >
                  {saving ? "Saving..." : "Save Customer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
