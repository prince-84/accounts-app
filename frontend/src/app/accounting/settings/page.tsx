"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Check,
  Globe,
  MapPin,
  Shield,
  Tag,
  Coins,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Layers,
  Phone,
  Mail,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import CreateCompanyModal from "@/components/companies/CreateCompanyModal";
import CountryCitySelect from "@/components/common/CountryCitySelect";

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
  default_tax: number;
  tax_label: string;
}

const DEFAULT_CURRENCIES: CurrencyOption[] = [
  { code: "AED", name: "UAE Dirham", symbol: "AED", country: "United Arab Emirates", flag: "🇦🇪", default_tax: 5.0, tax_label: "TRN (VAT)" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", country: "Saudi Arabia", flag: "🇸🇦", default_tax: 15.0, tax_label: "VAT (ZATCA)" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs.", country: "Pakistan", flag: "🇵🇰", default_tax: 18.0, tax_label: "NTN / STRN" },
  { code: "USD", name: "US Dollar", symbol: "$", country: "United States", flag: "🇺🇸", default_tax: 0.0, tax_label: "Sales Tax" },
  { code: "GBP", name: "British Pound", symbol: "£", country: "United Kingdom", flag: "🇬🇧", default_tax: 20.0, tax_label: "VAT" },
  { code: "EUR", name: "Euro", symbol: "€", country: "European Union", flag: "🇪🇺", default_tax: 20.0, tax_label: "VAT" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR", country: "Qatar", flag: "🇶🇦", default_tax: 0.0, tax_label: "Tax ID" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD", country: "Kuwait", flag: "🇰🇼", default_tax: 0.0, tax_label: "Tax ID" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD", country: "Bahrain", flag: "🇧🇭", default_tax: 10.0, tax_label: "VAT" },
  { code: "OMR", name: "Omani Rial", symbol: "OMR", country: "Oman", flag: "🇴🇲", default_tax: 5.0, tax_label: "VAT" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", country: "Canada", flag: "🇨🇦", default_tax: 5.0, tax_label: "GST / HST" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", country: "Australia", flag: "🇦🇺", default_tax: 10.0, tax_label: "GST" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", country: "India", flag: "🇮🇳", default_tax: 18.0, tax_label: "GSTIN" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { companies, activeCompany, setActiveCompanyById, deleteCompany, refreshCompanies } = useCompany();

  const [currencies, setCurrencies] = useState<CurrencyOption[]>(DEFAULT_CURRENCIES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteCompany = async () => {
    if (companies.length <= 1) {
      setDeleteError("Cannot delete the only remaining company in the system.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await deleteCompany(activeCompany.id);
      if (res.success) {
        setShowDeleteConfirm(false);
        router.push("/companies");
      } else {
        setDeleteError(res.message || "Failed to delete company.");
      }
    } catch (err: any) {
      console.error("Delete company error:", err);
      setDeleteError(err.message || "Could not delete company.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    country: "",
    city: "",
    address: "",
    company_code: "",
    base_currency_code: "AED",
    currency_symbol: "AED",
    tax_label: "TRN (VAT)",
    tax_registration_number: "",
    tax_rate: "5.0",
    email: "",
    phone: "",
    website: "",
  });

  // Sync form when activeCompany changes
  useEffect(() => {
    if (activeCompany) {
      setFormData({
        name: activeCompany.name || "",
        legal_name: activeCompany.legalName || activeCompany.name || "",
        country: activeCompany.country || "United Arab Emirates",
        city: activeCompany.city || "",
        address: activeCompany.address || "",
        company_code: activeCompany.code || "",
        base_currency_code: activeCompany.currency || "AED",
        currency_symbol: activeCompany.currencySymbol || activeCompany.currency || "AED",
        tax_label: activeCompany.taxLabel || "VAT",
        tax_registration_number: activeCompany.taxNumber || "",
        tax_rate: String(activeCompany.taxRate ?? 0),
        email: activeCompany.email || "",
        phone: activeCompany.phone || "",
        website: activeCompany.website || "",
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [activeCompany]);

  // Load currencies from API
  useEffect(() => {
    api
      .getCurrencies()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setCurrencies(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCurrencyChange = (currCode: string) => {
    const selected = currencies.find((c) => c.code === currCode);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        base_currency_code: selected.code,
        currency_symbol: selected.symbol,
      }));
    } else {
      setFormData((prev) => ({ ...prev, base_currency_code: currCode }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim(),
        country: formData.country.trim(),
        city: formData.city.trim() || null,
        address: formData.address.trim() || null,
        company_code: formData.company_code.trim().toUpperCase(),
        base_currency_code: formData.base_currency_code,
        currency_symbol: formData.currency_symbol || formData.base_currency_code,
        tax_label: formData.tax_label.trim(),
        tax_registration_number: formData.tax_registration_number.trim() || null,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
      };

      const res = await api.updateCompany(activeCompany.id, payload);

      if (res && res.success) {
        setSuccessMessage("Company settings successfully updated and saved!");
        await refreshCompanies();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        throw new Error(res.message || "Failed to update settings.");
      }
    } catch (err: any) {
      console.error("Update company error:", err);
      setErrorMessage(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{activeCompany.flag}</span>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A]">
              {activeCompany.name} • Settings & Compliance
            </h1>
            <p className="text-xs text-[#64748B]">
              Manage tax identification, corporate location, base currencies, and contacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/companies/create")}
            className="flex items-center gap-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add New Company</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/companies")}
            className="flex items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] px-3.5 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
          >
            <Layers size={14} className="text-[#64748B]" />
            <span>All Companies ({companies.length})</span>
          </button>
        </div>
      </div>

      {/* Switch Company quick selector bar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Switch Entity Workspace
          </span>
          <span className="text-[11px] text-[#64748B]">
            Click any company to configure or manage its books
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
          {companies.map((c) => {
            const isCurrent = c.id === activeCompany.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCompanyById(c.id)}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                  isCurrent
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A]"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">{c.flag}</span>
                    <span className="font-bold text-xs truncate">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                    {c.code} • {c.currency}
                  </div>
                </div>
                {isCurrent && <Check size={16} className="text-[#2563EB] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] p-3.5 text-xs text-[#991B1B]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-md bg-[#ECFDF5] border border-[#6EE7B7] p-3.5 text-xs text-[#065F46]">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Identity & Legal Profile */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Building2 size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              1. Corporate Identity & Registration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Company Display Name <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Company Code (Voucher Prefix) <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.company_code}
                onChange={(e) =>
                  setFormData({ ...formData, company_code: e.target.value.toUpperCase() })
                }
                className="w-full uppercase font-mono font-bold rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Full Legal Registered Name
              </label>
              <input
                type="text"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* 2. Location & Statutory Address */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <MapPin size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              2. Jurisdiction & Physical Address
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CountryCitySelect
              country={formData.country}
              city={formData.city}
              onCountryChange={(newCountry, config) => {
                setFormData((prev) => ({
                  ...prev,
                  country: newCountry,
                  ...(config ? {
                    base_currency_code: config.currency,
                    currency_symbol: config.currencySymbol,
                    tax_label: config.taxLabel,
                    tax_rate: String(config.defaultTaxRate),
                  } : {}),
                }));
              }}
              onCityChange={(newCity) => {
                setFormData((prev) => ({ ...prev, city: newCity }));
              }}
            />

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Head Office Street Address / Building Details
              </label>
              <input
                type="text"
                placeholder="e.g. Floor 28, Boulevard Plaza Tower 1, Downtown Dubai, UAE"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* 3. Currency & Treasury */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Coins size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              3. Live Currency & Treasury Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Base Currency <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.base_currency_code}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full font-mono font-medium rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Currency Display Symbol
              </label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={(e) =>
                  setFormData({ ...formData, currency_symbol: e.target.value })
                }
                className="w-full font-mono rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* 4. Tax Info & Regulatory Credentials */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Shield size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              4. Tax Registration & Regulatory Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Tax Regime Label
              </label>
              <input
                type="text"
                placeholder="e.g. TRN (VAT), VAT (ZATCA), NTN"
                value={formData.tax_label}
                onChange={(e) => setFormData({ ...formData, tax_label: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Tax Registration Number (TRN)
              </label>
              <input
                type="text"
                placeholder="e.g. 100234567800003"
                value={formData.tax_registration_number}
                onChange={(e) =>
                  setFormData({ ...formData, tax_registration_number: e.target.value })
                }
                className="w-full font-mono rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* 5. Contact & Web Details */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
            <Mail size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              5. Official Contacts & Online Presence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Official Email</label>
              <input
                type="email"
                placeholder="finance@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Phone Number</label>
              <input
                type="text"
                placeholder="+971 4 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Website URL</label>
              <input
                type="text"
                placeholder="https://company.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#64748B]">
            Updating these settings takes effect immediately across all invoices, bills, and tax reports.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Company Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone: Delete Company */}
      <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2]/50 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#FEE2E2]">
          <Trash2 size={16} className="text-[#DC2626]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            Danger Zone: Delete Corporate Workspace
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#0F172A]">
              Permanently delete &apos;{activeCompany.name}&apos;
            </p>
            <p className="text-xs text-[#64748B] mt-0.5 max-w-xl leading-5">
              Once deleted, all isolated accounts, bank and petty cash records, invoices, bills,
              and general ledger transactions associated with this company will be permanently erased.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete This Company</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Delete Company &apos;{activeCompany.name}&apos;?
                </h3>
                <p className="text-xs text-[#64748B] leading-5">
                  Are you sure you want to permanently delete this corporate workspace?
                  All associated Chart of Accounts, branches, bank accounts, invoices, and ledgers
                  will be removed.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-3 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] p-2.5 text-xs text-[#991B1B]">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="rounded-md border border-[#CBD5E1] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCompany}
                className="flex items-center gap-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
