"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

function getInitials(name: string) {
  if (!name) return "VE";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function VendorsPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Vendor Form
  const [newVendor, setNewVendor] = useState({
    name: "",
    email: "",
    phone: "",
    tax_number: "",
    address: "",
    opening_balance: 0,
  });

  const loadVendors = () => {
    setLoading(true);
    api
      .getVendors()
      .then((res) => {
        if (res.success) {
          setVendors(res.data || []);
        }
      })
      .catch((err) => console.error("Error loading vendors:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVendors();
  }, [activeCompany.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createVendor({
        company_id: activeCompany.id,
        ...newVendor,
      });
      setShowModal(false);
      setNewVendor({
        name: "",
        email: "",
        phone: "",
        tax_number: "",
        address: "",
        opening_balance: 0,
      });
      loadVendors();
    } catch (err: any) {
      alert(err.message || "Failed to create vendor");
    } finally {
      setSaving(false);
    }
  };

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header matching specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "PURCHASES", "VENDORS & SUPPLIERS"]}
        title="Vendors & Suppliers"
        description="Approved vendor directory, procurement contacts, and accounts payable commitments."
        actions={
          <Button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#1D4ED8] text-xs cursor-pointer"
          >
            <Plus size={15} />
            Add Vendor
          </Button>
        }
      />

      {/* Filter and Search Bar with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-xs">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Search vendor by name, email, or TRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-md border-[#E2E8F0] bg-[#F8FAFC] pl-9 text-xs text-[#0F172A] focus-visible:bg-white focus-visible:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#64748B]">
            <strong className="text-[#0F172A]">{filtered.length}</strong> of {vendors.length} suppliers
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
              Loading vendor directory...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((vendor) => {
              const payable = parseFloat(vendor.current_balance || 0);
              const hasPayable = payable > 0.01;

              return (
                <div
                  key={vendor.id}
                  className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs hover:border-[#CBD5E1] hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Monogram + Status Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs font-mono tracking-wider">
                          {getInitials(vendor.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#0F172A] truncate max-w-[160px]" title={vendor.name}>
                            {vendor.name}
                          </h3>
                          {vendor.tax_number && (
                            <span className="inline-block text-[10px] font-mono text-[#64748B]">
                              TRN: {vendor.tax_number}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                          hasPayable
                            ? "bg-rose-50 text-rose-700 border-rose-200/80"
                            : "bg-[#ECFDF5] text-[#059669] border-[#10B981]/20"
                        }`}
                      >
                        {hasPayable ? "Payable Due" : "Settled"}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="mt-3.5 space-y-1.5 border-t border-[#F8FAFC] pt-3 text-xs text-[#64748B]">
                      {vendor.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="truncate hover:text-[#0F172A]">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-[#94A3B8] shrink-0" />
                          <span className="font-mono text-[11px]">{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center gap-2 truncate text-[11px] text-[#94A3B8]">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Bottom Action Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Payable
                      </span>
                      <span className="font-mono text-sm font-bold text-[#0F172A]">
                        {formatCurrency(payable)}
                      </span>
                    </div>

                    <Link
                      href="/accounting/expenses"
                      className="inline-flex items-center gap-1 rounded-md bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Plus size={12} />
                      Bill
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">
              No vendors registered for {activeCompany.name}.
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
                  <th className="px-4 py-3.5">Vendor / Supplier</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Tax ID / TRN</th>
                  <th className="px-4 py-3.5 text-right">Payable Balance</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#94A3B8]">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((vendor) => {
                    const payable = parseFloat(vendor.current_balance || 0);
                    const hasPayable = payable > 0.01;

                    return (
                      <tr key={vendor.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs font-mono">
                              {getInitials(vendor.name)}
                            </div>
                            <span className="font-bold text-[#0F172A]">{vendor.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B]">
                          <p>{vendor.email || "—"}</p>
                          {vendor.phone && <p className="font-mono text-[11px]">{vendor.phone}</p>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#64748B]">
                          {vendor.tax_number || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                          {formatCurrency(payable)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${
                              hasPayable
                                ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                : "bg-[#ECFDF5] text-[#059669] border-[#10B981]/20"
                            }`}
                          >
                            {hasPayable ? "Payable Due" : "Settled"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            href="/accounting/expenses"
                            className="inline-flex items-center gap-1 rounded-md bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Plus size={12} />
                            Bill
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#94A3B8]">
                      No vendors found for {activeCompany.name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl text-xs border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Add New Vendor</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Register supplier for {activeCompany.name}</p>
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
                  Supplier / Company Name <span className="text-[#EF4444]">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Apex Industrial Supplies LLC"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
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
                    placeholder="accounts@vendor.com"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Phone
                  </label>
                  <Input
                    placeholder="+971..."
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
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
                    value={newVendor.tax_number}
                    onChange={(e) => setNewVendor({ ...newVendor, tax_number: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Opening Payable
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVendor.opening_balance}
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
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
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
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
                  {saving ? "Saving..." : "Save Vendor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
