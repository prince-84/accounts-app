"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  Trash2,
  Eye,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import StatusBadge from "@/components/shared/StatusBadge";
import Link from "next/link";
import { invoices } from "@/data/invoice-data";

type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

const ITEMS_PER_PAGE = 8;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);

export default function InvoiceTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    InvoiceStatus | "All"
  >("All");

  const [currentPage, setCurrentPage] = useState(1);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(query) ||
        invoice.customer.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === "All" ||
        invoice.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, selectedStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)
  );

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: InvoiceStatus | "All") => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search invoice or customer..."
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["All", "Paid", "Pending", "Overdue", "Draft"] as const).map(
            (status) => (
              <Button
                key={status}
                type="button"
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => handleStatusChange(status)}
                className={
                  selectedStatus === status
                    ? "rounded-xl bg-blue-600 hover:bg-blue-700"
                    : "rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              >
                {status}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[850px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invoice
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Issue Date
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Due Date
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>

              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="transition hover:bg-slate-50/70"
              >
                <td className="px-5 py-4">
                  <span className="font-semibold text-blue-600">
                    {invoice.id}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className="font-medium text-slate-800">
                    {invoice.customer}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {invoice.issueDate}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {invoice.dueDate}
                </td>

                <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                  {formatCurrency(invoice.amount)}
                </td>

                <td className="px-5 py-4 text-center">
                  <StatusBadge
                    status={invoice.status as InvoiceStatus}
                  />
                </td>

                <td className="px-5 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Actions for ${invoice.id}`}
                    >
                      <MoreHorizontal size={18} />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-xl"
                    >
                      <DropdownMenuItem render={<Link href={`/accounting/invoices/${invoice.id}`} />}>
                        <Eye size={16} />
                        View Invoice
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        render={
                          <Link href={`/accounting/invoices/${invoice.id}/edit`} />
                        }
                      >
                        <Pencil size={16} />
                        Edit Invoice
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Send size={16} />
                        Send Invoice
                      </DropdownMenuItem>

                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 size={16} />
                        Delete Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty Search State */}
      {filteredInvoices.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
          <p className="font-medium text-slate-700">
            No invoices found
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Try changing your search or filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            {Math.min(
              (currentPage - 1) * ITEMS_PER_PAGE + 1,
              filteredInvoices.length
            )}
            {" - "}
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              filteredInvoices.length
            )}{" "}
            of {filteredInvoices.length} invoices
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              className="rounded-lg"
            >
              Previous
            </Button>

            <span className="px-2 text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              className="rounded-lg"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}