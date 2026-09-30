"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Globe,
  MapPin,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";

interface CompanyCardProps {
  id: string;
  name: string;
  legalName?: string;
  description?: string;
  currency?: string;
  currencySymbol?: string;
  country?: string;
  city?: string;
  address?: string;
  code?: string;
  taxLabel?: string;
  taxNumber?: string;
  taxRate?: number;
  flag?: string;
}

export default function CompanyCard({
  id,
  name,
  legalName,
  description,
  currency,
  currencySymbol,
  country,
  city,
  address,
  code,
  taxLabel = "VAT",
  taxNumber,
  taxRate = 0,
  flag = "🏢",
}: CompanyCardProps) {
  const router = useRouter();
  const { setActiveCompanyById, activeCompany, companies, deleteCompany } = useCompany();
  const isCurrent = activeCompany?.id === id;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSelect = (route: string = "/accounting/dashboard") => {
    setActiveCompanyById(id);
    router.push(route);
  };

  const handleDelete = async () => {
    if (companies.length <= 1) {
      setDeleteError("Cannot delete the only remaining company in the system.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await deleteCompany(id);
      if (res.success) {
        setShowDeleteConfirm(false);
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

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
          isCurrent ? "border-[#2563EB] ring-1 ring-[#2563EB]" : "border-[#E2E8F0] hover:border-[#CBD5E1]"
        }`}
      >
        <div>
          {/* Top Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-xs font-bold text-sm tracking-wider">
                {code || "CORP"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg leading-none">{flag}</span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {country || "International"}
                  </span>
                </div>
                {city && (
                  <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                    <MapPin size={11} /> {city}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {currency && (
                <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-bold text-[#0F172A]">
                  {currency} {currencySymbol && currencySymbol !== currency ? `(${currencySymbol})` : ""}
                </span>
              )}
              {isCurrent && (
                <span className="rounded-md bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Company Title */}
          <h3 className="text-base font-bold text-[#0F172A] leading-snug group-hover:text-[#2563EB] transition-colors">
            {name}
          </h3>
          {legalName && legalName !== name && (
            <p className="mt-0.5 text-xs text-[#64748B] italic line-clamp-1">{legalName}</p>
          )}

          {/* Address / Location snippet */}
          {address ? (
            <p className="mt-2.5 text-xs text-[#64748B] line-clamp-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-[#94A3B8] shrink-0" />
              <span className="truncate">{address}</span>
            </p>
          ) : (
            <p className="mt-2.5 text-xs text-[#64748B] line-clamp-2">
              {description || `Independent corporate entity in ${country || "global jurisdiction"}.`}
            </p>
          )}

          {/* Tax & Compliance badge */}
          <div className="mt-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs space-y-1">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck size={13} className="text-[#2563EB]" />
                {taxLabel} ID:
              </span>
              <span className="font-mono font-semibold text-[#0F172A]">
                {taxNumber || "Not Registered"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px]">Standard Tax Rate:</span>
              <span className="font-semibold text-[#0F172A]">{taxRate}%</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect("/accounting/dashboard")}
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Open Books</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleSelect("/accounting/settings")}
            title="Configure Tax, Currency & Company Settings"
            className="flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] p-2 text-xs transition-colors cursor-pointer"
          >
            <Settings2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this company workspace"
            className="flex items-center justify-center rounded-md border border-[#FEE2E2] bg-white hover:bg-[#FEF2F2] text-[#EF4444] p-2 text-xs transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
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
                  Delete Company &apos;{name}&apos;?
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
                onClick={handleDelete}
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
    </>
  );
}