"use client";

import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  HelpCircle,
  Layers,
  LogOut,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
  const router = useRouter();
  const { companies, activeCompany, setActiveCompanyById } = useCompany();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white px-5 sm:px-7 shadow-xs">
      {/* Left: Company Switcher Pill + Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-left transition hover:border-[#2563EB] hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]/30 cursor-pointer shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#2563EB] text-white font-bold text-xs shadow-xs">
              <Building2 size={13} />
            </div>

            <div className="max-w-[140px] sm:max-w-[200px] md:max-w-[240px] truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#0F172A] truncate">
                  {activeCompany?.name || "Acme Global Holdings"}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" title="Active Organization" />
              </div>
            </div>

            <ChevronDown size={14} className="text-[#64748B] ml-0.5 shrink-0" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-80 rounded-lg p-1.5 shadow-xl border-[#E2E8F0] bg-white">
            <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Switch Company Workspace
            </DropdownMenuLabel>

            {companies.map((company) => {
              const isSelected = company.id === activeCompany.id;
              return (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setActiveCompanyById(company.id)}
                  className={`flex items-start justify-between rounded-md px-3 py-2 cursor-pointer transition ${
                    isSelected ? "bg-[#EFF6FF] text-[#0F172A] border border-[#BFDBFE]" : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{company.flag}</span>
                      <p className="text-xs font-bold text-[#0F172A]">{company.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#64748B] pl-6">
                      <span>{company.country}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#10B981] font-mono">{company.currency}</span>
                      <span>•</span>
                      <span>{company.taxLabel} {company.taxRate}%</span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={15} className="text-[#2563EB] shrink-0 mt-1" />
                  )}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator className="my-1.5 border-[#E2E8F0]" />

            <DropdownMenuItem
              onClick={() => router.push("/companies")}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-[#F8FAFC]"
            >
              <Layers size={14} className="text-[#2563EB]" />
              View all workspaces screen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Global Search Bar with ⌘K Badge */}
        <div className="relative hidden w-64 lg:w-72 md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search invoices, accounts..."
            className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-10 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:outline-none transition shadow-2xs"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[9.5px] font-mono text-[#94A3B8] shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: + New Button, Notifications, Help, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* + New Button */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#2563EB] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1D4ED8] transition cursor-pointer">
            <Plus size={15} />
            <span>New</span>
            <ChevronDown size={13} className="text-white/80" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-lg border-[#E2E8F0] bg-white p-1.5">
            <DropdownMenuItem
              onClick={() => router.push("/accounting/invoices")}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <Plus size={14} className="text-[#2563EB]" />
              <span>Create Customer Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/accounting/expenses")}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <Plus size={14} className="text-[#2563EB]" />
              <span>Create Vendor Bill</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/accounting/journal-entries")}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <Plus size={14} className="text-[#2563EB]" />
              <span>Record Journal Entry</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-md text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white ring-2 ring-white">
            3
          </span>
        </Button>

        {/* Help Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          aria-label="Help"
        >
          <HelpCircle size={18} />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md p-1 transition hover:bg-[#F8FAFC] cursor-pointer">
            <Avatar className="h-8 w-8 rounded-full border border-[#E2E8F0]">
              <AvatarFallback className="bg-[#0F172A] font-semibold text-white text-[11px]">
                AW
              </AvatarFallback>
            </Avatar>

            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold text-[#0F172A] leading-tight">
                Alexander Wright
              </p>
              <p className="text-[10px] text-[#64748B] font-medium leading-tight">
                Chief Financial Officer
              </p>
            </div>

            <ChevronDown
              size={13}
              className="hidden text-[#64748B] lg:block"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-lg border-[#E2E8F0] bg-white p-1">
            <DropdownMenuItem
              onClick={() => router.push("/accounting/settings")}
              className="flex items-center gap-2 rounded-md cursor-pointer text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <User size={14} className="text-[#2563EB]" />
              Profile & Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/companies")}
              className="flex items-center gap-2 rounded-md cursor-pointer text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <Building2 size={14} className="text-[#2563EB]" />
              Select Company
            </DropdownMenuItem>

            <DropdownMenuSeparator className="border-[#E2E8F0] my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#EF4444] focus:text-[#EF4444] rounded-md cursor-pointer flex items-center gap-2 text-xs"
            >
              <LogOut size={14} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
