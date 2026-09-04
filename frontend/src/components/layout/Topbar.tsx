"use client";

import {
Bell,
ChevronDown,
LogOut,
Plus,
Search,
User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function Topbar() {
const router = useRouter();

const handleLogout = () => {
router.push("/login");
};

return ( <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
{/* Search */} <div className="relative hidden w-full max-w-md md:block"> <Search
       size={19}
       className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
     />


    <Input
      placeholder="Search invoices, customers..."
      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:bg-white"
    />
  </div>

  {/* Mobile title */}
  <div className="md:hidden">
    <h1 className="font-bold text-slate-900">Accounts</h1>
  </div>

  {/* Actions */}
  <div className="ml-auto flex items-center gap-2 sm:gap-3">
    {/* New Action Dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 sm:px-4">
        <Plus size={18} />
        <span className="hidden sm:inline">New</span>
        <ChevronDown size={16} className="hidden sm:inline" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 rounded-xl">
        <DropdownMenuItem>
          <Plus size={16} />
          New Invoice
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Plus size={16} />
          New Expense
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Plus size={16} />
          New Customer
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Plus size={16} />
          New Journal Entry
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Notifications */}
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-xl text-slate-600 hover:bg-slate-100"
      aria-label="Notifications"
    >
      <Bell size={20} />

      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
    </Button>

    {/* User Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
            TC
          </AvatarFallback>
        </Avatar>

        <div className="hidden text-left lg:block">
          <p className="text-sm font-semibold text-slate-800">
            Admin User
          </p>

          <p className="text-xs text-slate-400">
            Administrator
          </p>
        </div>

        <ChevronDown
          size={16}
          className="hidden text-slate-400 lg:block"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuItem>
          <User size={16} />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut size={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>


);
}
