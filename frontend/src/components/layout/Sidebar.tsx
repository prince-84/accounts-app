"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingCart,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationGroups = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/accounting/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Sales",
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
    label: "Purchases",
    items: [
      {
        name: "Expenses",
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
    label: "Finance",
    items: [
      {
        name: "Banking",
        href: "/accounting/banking",
        icon: Landmark,
      },
      {
        name: "Accounting",
        href: "/accounting/chart-of-accounts",
        icon: BookOpen,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        name: "Reports",
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

  return (
    <aside
      className={`relative hidden min-h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-300 lg:flex lg:flex-col ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-100 px-5">
        <Link href="/accounting/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <CircleDollarSign size={23} />
          </div>

          {!collapsed && (
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                Accounts
              </p>
              <p className="text-xs text-slate-400">
                Financial Workspace
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                const link = (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        isActive ? "text-blue-600" : "text-slate-400"
                      }
                    />

                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );

                return (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          size={20}
                          className={isActive ? "text-blue-600" : "text-slate-400"}
                        />

                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </div>
                  );
              })}
            </div>

            {groupIndex < navigationGroups.length - 1 && collapsed && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-100 p-3">
        <Link
          href="/accounting/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Settings size={20} className="text-slate-400" />

          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-4 bottom-8 hidden h-8 w-8 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 lg:flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </Button>
      </div>
    </aside>
  );
}