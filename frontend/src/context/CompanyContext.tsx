"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { COMPANIES_DATA, CompanyData } from "@/data/companies-data";
import { api } from "@/lib/api";

export type Company = CompanyData;
export const INITIAL_COMPANIES = COMPANIES_DATA;

const COUNTRY_FLAGS: Record<string, string> = {
  "United Arab Emirates": "🇦🇪",
  "UAE": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  "Pakistan": "🇵🇰",
  "United States": "🇺🇸",
  "USA": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "UK": "🇬🇧",
  "European Union": "🇪🇺",
  "Qatar": "🇶🇦",
  "Kuwait": "🇰🇼",
  "Bahrain": "🇧🇭",
  "Oman": "🇴🇲",
  "Canada": "🇨🇦",
  "Australia": "🇦🇺",
  "India": "🇮🇳",
};

function mapBackendCompany(c: any): Company {
  const flag = COUNTRY_FLAGS[c.country] || "🏢";
  return {
    id: String(c.id),
    name: c.name,
    legalName: c.legal_name || c.name,
    country: c.country,
    city: c.city || "",
    address: c.address || "",
    code: c.company_code,
    currency: c.base_currency_code,
    currencySymbol: c.currency_symbol || c.base_currency_code,
    taxLabel: c.tax_label || "VAT",
    taxNumber: c.tax_registration_number || "",
    taxRate: Number(c.tax_rate ?? 0),
    email: c.email || "",
    phone: c.phone || "",
    website: c.website || "",
    flag: flag,
    description: c.address
      ? `${c.city ? c.city + ", " : ""}${c.country} • Currency: ${c.base_currency_code}`
      : `Operating entity in ${c.country} (${c.company_code})`,
  };
}

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company;
  setActiveCompanyById: (id: string) => void;
  formatCurrency: (amount: number) => string;
  refreshCompanies: () => Promise<void>;
  deleteCompany: (id: string) => Promise<{ success: boolean; message?: string }>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(COMPANIES_DATA);
  const [activeCompanyId, setActiveCompanyId] = useState<string>("1");
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getCompanies();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapBackendCompany);
        setCompanies(mapped);
      }
    } catch (err) {
      console.warn("Could not fetch remote companies, using fallback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCompany = async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.deleteCompany(id);
      if (res && res.success) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        if (activeCompanyId === id) {
          const remaining = companies.filter((c) => c.id !== id);
          if (remaining.length > 0) {
            setActiveCompanyById(remaining[0].id);
          }
        }
        await refreshCompanies();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Failed to delete company." };
    } catch (err: any) {
      // If company was already not found on backend (404), still clean up locally
      if (err.message && (err.message.includes("404") || err.message.includes("not found"))) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        return { success: true, message: "Company removed." };
      }
      return { success: false, message: err.message || "Could not delete company." };
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("accounts_active_company_id");
      if (saved) {
        setActiveCompanyId(saved);
      }
    }
    refreshCompanies();
  }, [refreshCompanies]);

  const setActiveCompanyById = (id: string) => {
    const found = companies.find((c) => c.id === id);
    if (found) {
      setActiveCompanyId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("accounts_active_company_id", id);
      }
    }
  };

  const activeCompany =
    companies.find((c) => c.id === activeCompanyId) || companies[0] || COMPANIES_DATA[0];

  const formatCurrency = (amount: number) => {
    return `${activeCompany.currencySymbol || activeCompany.currency} ${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompanyById,
        formatCurrency,
        refreshCompanies,
        deleteCompany,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
