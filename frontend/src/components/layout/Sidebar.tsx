"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  CircleDollarSign,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings,
  ShoppingCart,
  WalletCards,
} from "lucide-react";

import { useCompany } from "@/context/CompanyContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationGroups = [
  {
    label: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        href: "/accounting/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "SALES & AR",
    items: [
      {
        name: "Invoices",
        href: "/accounting/invoices",
        icon: ReceiptText,
      },
      {
        name: "Customers",
        href: "/accounting/customers",
        icon: Building2,
      },
    ],
  },
  {
    label: "PURCHASES & AP",
    items: [
      {
        name: "Expenses & Bills",
        href: "/accounting/expenses",
        icon: WalletCards,
      },
      {
        name: "Vendors",
        href: "/accounting/vendors",
        icon: ShoppingCart,
      },
    ],
  },
  {
    label: "ACCOUNTING CORE",
    items: [
      {
        name: "Chart of Accounts",
        href: "/accounting/chart-of-accounts",
        icon: BookOpen,
      },
      {
        name: "Journal Entries",
        href: "/accounting/journal-entries",
        icon: FileSpreadsheet,
      },
      {
        name: "Banking & Cash",
        href: "/accounting/banking",
        icon: Landmark,
      },
    ],
  },
  {
    label: "REPORTS & INSIGHTS",
    items: [
      {
        name: "Financial Reports",
        href: "/accounting/reports",
        icon: BarChart3,
      },
    ],
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const { activeCompany } = useCompany();

  return (
    <aside
      className={`relative hidden min-h-screen shrink-0 border-r border-[#E2E8F0] bg-white transition-all duration-300 lg:flex lg:flex-col shadow-xs ${
        collapsed ? "w-16" : "w-[220px]"
      }`}
    >
      {/* Top Header: Logo + Brand + Collapsible Toggle Icon */}
      <div className={`relative flex h-16 items-center border-b border-[#E2E8F0] px-3.5 ${collapsed ? "justify-center" : "justify-between"}`}>
        {/* Brand info */}
        <Link
          href="/accounting/dashboard"
          className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "hidden" : "flex"}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white shadow-sm shadow-[#2563EB]/25 font-bold">
            <CircleDollarSign size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-[13px] font-bold tracking-tight text-[#0F172A] truncate">
                LedgerFlow
              </p>
              <span className="text-[10px]">{activeCompany?.flag}</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Enterprise Treasury
            </p>
          </div>
        </Link>

        {/* Collapsed view small logo */}
        {collapsed && (
          <Link
            href="/accounting/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/25"
            title="LedgerFlow Dashboard"
          >
            <CircleDollarSign size={18} />
          </Link>
        )}

        {/* 50% Topbar / 50% Sidebar Straddling Collapsible Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute right-0 top-1/2 z-40 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#0F172A] shadow-xs transition-all hover:bg-[#F8FAFC] hover:text-[#2563EB] hover:border-[#2563EB]/40 cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={13} />
          ) : (
            <PanelLeftClose size={13} />
          )}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-1.5 px-2 text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                {group.label}
              </p>
            ) : (
              <div className="my-1.5 border-t border-[#E2E8F0]" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/accounting/dashboard" && pathname.startsWith(`${item.href}/`));

                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={`group flex items-center justify-between rounded-md px-2.5 py-2 text-[12px] font-medium transition-all ${
                      isActive
                        ? "bg-[#2563EB] text-white font-semibold shadow-xs"
                        : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-[#64748B] group-hover:text-[#0F172A]"
                        }`}
                      />

                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!collapsed && item.name === "Invoices" && (
                      <span className={`rounded px-1.5 py-0.2 text-[9.5px] font-bold font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-[#EFF6FF] text-[#2563EB]"
                      }`}>
                        14
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section: Storage Tier & Settings */}
      <div className="border-t border-[#E2E8F0] p-3 space-y-2 bg-[#FAFAFA]">
        {!collapsed && (
          <div className="rounded-md border border-[#E2E8F0] bg-white p-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between font-semibold text-[#0F172A] text-[11px]">
              <span>Enterprise Tier</span>
              <span className="text-[#2563EB] font-mono">94%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
              <div className="h-full rounded-full bg-[#2563EB]" style={{ width: "94%" }} />
            </div>
            <p className="mt-1 text-[9.5px] text-[#64748B]">4.7 TB of 5.0 TB consumed</p>
          </div>
        )}

        <Link
          href="/accounting/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium text-[#475569] transition hover:bg-white hover:text-[#0F172A] hover:shadow-2xs ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Settings size={16} className="text-[#64748B]" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}