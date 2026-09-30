"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Globe,
  MapPin,
  Coins,
  ShieldCheck,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCompany } from "@/context/CompanyContext";
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

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCompanyId: string) => void;
}

export default function CreateCompanyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCompanyModalProps) {
  const { refreshCompanies, setActiveCompanyById } = useCompany();
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(DEFAULT_CURRENCIES);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    company_code: "",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "",
    base_currency_code: "AED",
    currency_symbol: "AED",
    tax_label: "TRN (VAT)",
    tax_registration_number: "",
    tax_rate: "5.0",
    fiscal_year_start_month: 1,
    email: "",
    phone: "",
    website: "",
  });

  // Load live currencies from API on mount
  useEffect(() => {
    if (isOpen) {
      api
        .getCurrencies()
        .then((res) => {
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            setCurrencies(res.data);
          }
        })
        .catch(() => {
          // fallback to DEFAULT_CURRENCIES silently
        });
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle currency selection presets
  const handleCurrencyChange = (currCode: string) => {
    const selected = currencies.find((c) => c.code === currCode);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        base_currency_code: selected.code,
        currency_symbol: selected.symbol,
        country: prev.country || selected.country,
        tax_label: selected.tax_label || "VAT",
        tax_rate: String(selected.default_tax),
      }));
    } else {
      setFormData((prev) => ({ ...prev, base_currency_code: currCode }));
    }
  };

  // Auto-generate code from name if empty
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const updates: any = { name: val };
      if (!prev.legal_name || prev.legal_name === prev.name) {
        updates.legal_name = val;
      }
      if (!prev.company_code) {
        const words = val.trim().split(/\s+/);
        if (words.length >= 2) {
          updates.company_code = words
            .slice(0, 3)
            .map((w) => w[0]?.toUpperCase())
            .join("");
        } else if (val.length >= 3) {
          updates.company_code = val.slice(0, 3).toUpperCase();
        }
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }
    if (!formData.company_code.trim()) {
      setErrorMessage("Company code (e.g. DXB, USA, APX) is required.");
      return;
    }
    if (!formData.country.trim()) {
      setErrorMessage("Country is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim() || formData.name.trim(),
        company_code: formData.company_code.trim().toUpperCase(),
        country: formData.country.trim(),
        city: formData.city.trim() || null,
        address: formData.address.trim() || null,
        base_currency_code: formData.base_currency_code,
        currency_symbol: formData.currency_symbol || formData.base_currency_code,
        tax_label: formData.tax_label.trim() || "VAT",
        tax_registration_number: formData.tax_registration_number.trim() || null,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        fiscal_year_start_month: Number(formData.fiscal_year_start_month) || 1,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
      };

      const res = await api.createCompany(payload);

      if (res && res.success && res.data) {
        setSuccessMessage("Company created successfully with full Chart of Accounts!");
        await refreshCompanies();
        const newId = String(res.data.id);
        setActiveCompanyById(newId);

        setTimeout(() => {
          onClose();
          if (onSuccess) {
            onSuccess(newId);
          }
        }, 1200);
      } else {
        throw new Error(res.message || "Failed to create company.");
      }
    } catch (err: any) {
      console.error("Create company error:", err);
      setErrorMessage(
        err.message || "An unexpected error occurred while saving the company."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-[#E2E8F0] my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Add New Company Workspace
              </h2>
              <p className="text-xs text-[#64748B]">
                Configure statutory details, live currencies, tax registry & legal address
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] p-3 text-xs text-[#991B1B]">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2.5 rounded-md bg-[#ECFDF5] border border-[#6EE7B7] p-3 text-xs text-[#065F46]">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: General Company Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-1 border-b border-[#F1F5F9]">
              <Building2 size={14} className="text-[#2563EB]" />
              <span>1. Corporate Identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Company Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Advisory"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Company Code (ID) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. APX / USA"
                  value={formData.company_code}
                  onChange={(e) =>
                    setFormData({ ...formData, company_code: e.target.value.toUpperCase() })
                  }
                  className="w-full uppercase font-mono font-bold rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Legal Registered Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Global Advisory FZ-LLC"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Address */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-1 border-b border-[#F1F5F9]">
              <MapPin size={14} className="text-[#2563EB]" />
              <span>2. Location & Jurisdiction</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Head Office Street Address / Building
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suite 1205, Business Bay Tower, Financial District"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Currency & Treasury */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-1 border-b border-[#F1F5F9]">
              <Coins size={14} className="text-[#2563EB]" />
              <span>3. Live Currency & Treasury Settings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Base Functional Currency <span className="text-[#EF4444]">*</span>
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
                  placeholder="e.g. AED, $, £, Rs."
                  className="w-full font-mono rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tax & Regulatory Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-1 border-b border-[#F1F5F9]">
              <ShieldCheck size={14} className="text-[#2563EB]" />
              <span>4. Tax Authority & Compliance Info</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="5.00"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Contacts (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-1 border-b border-[#F1F5F9]">
              <Mail size={14} className="text-[#2563EB]" />
              <span>5. Contacts & Online (Optional)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Auto-initialization Note */}
          <div className="rounded-md bg-[#F0FDF4] border border-[#BBF7D0] p-3 text-xs text-[#166534] flex items-start gap-2">
            <Sparkles size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Auto-Provisioning:</span> Upon creation,
              an independent 19-account Chart of Accounts (Operating Bank, Petty Cash, A/R,
              A/P, Tax Receivables/Payables, Sales, Operating Expenses) and Head Office Branch
              will be automatically initialized.
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-md border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Provisioning Accounts...</span>
                </>
              ) : (
                <>
                  <Building2 size={14} />
                  <span>Create Company & Initialize Books</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
