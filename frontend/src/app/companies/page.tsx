"use client";

import { useState } from "react";
import { Landmark, Plus, ShieldCheck, RefreshCw, Building2 } from "lucide-react";
import Link from "next/link";
import CompanyCard from "@/components/companies/CompanyCard";
import { useCompany } from "@/context/CompanyContext";

export default function CompaniesPage() {
  const { companies, refreshCompanies, loading } = useCompany();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-4 py-10 sm:px-6 lg:px-8">
      {/* Subtle background blurs */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#EFF6FF] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-[#EFF6FF]/80 blur-3xl opacity-70" />

      <div className="relative mx-auto max-w-6xl">
        {/* Top Super Admin Action Bar */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F172A] text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A]">Super Admin Control</span>
                <span className="rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
                  Multi-Entity Hub
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                {companies.length} active registered companies with autonomous double-entry general ledgers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshCompanies()}
              disabled={loading}
              title="Refresh entities"
              className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-[#2563EB]" : "text-[#64748B]"} />
              <span>Sync</span>
            </button>

            <Link
              href="/companies/create"
              className="flex items-center gap-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Add New Company</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <header className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20 border border-white/20">
            <Landmark size={26} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB]">
            Corporate Enterprise Advisory
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            Select Company Workspace
          </h1>

          <p className="mt-2 max-w-xl text-xs leading-5 text-[#64748B]">
            Switch between independent company books, manage statutory tax settings,
            live multi-currencies, and regional compliance.
          </p>
        </header>

        {/* Company Cards Grid */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              id={company.id}
              name={company.name}
              legalName={company.legalName}
              description={company.description}
              currency={company.currency}
              currencySymbol={company.currencySymbol}
              country={company.country}
              city={company.city}
              address={company.address}
              code={company.code}
              taxLabel={company.taxLabel}
              taxNumber={company.taxNumber}
              taxRate={company.taxRate}
              flag={company.flag}
            />
          ))}

          {/* "+ Add New Company" Quick Card */}
          <Link
            href="/companies/create"
            className="group flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC]/50 p-6 text-center transition-all hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 cursor-pointer"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-[#CBD5E1] text-[#2563EB] shadow-xs group-hover:scale-105 group-hover:bg-[#2563EB] group-hover:text-white transition-all">
              <Plus size={22} />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
              Add New Company Workspace
            </h3>
            <p className="mt-1.5 max-w-[220px] text-xs text-[#64748B]">
              Configure new entity with country, city, tax credentials, and live currencies.
            </p>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-[#64748B]">
          Corporate multi-tenant architecture with isolated double-entry accounting per entity.
        </footer>
      </div>
    </main>
  );
}