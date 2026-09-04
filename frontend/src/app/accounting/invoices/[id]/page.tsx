import {
ArrowLeft,
Download,
Edit,
Printer,
Send,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { invoices } from "@/data/invoice-data";

type InvoiceDetailPageProps = {
params: Promise<{
id: string;
}>;
};

export default async function InvoiceDetailPage({
params,
}: InvoiceDetailPageProps) {
const { id } = await params;

const invoice = invoices.find((item) => item.id === id);

if (!invoice) {
notFound();
}

const statusStyles = {
Paid: "bg-emerald-100 text-emerald-700",
Pending: "bg-amber-100 text-amber-700",
Overdue: "bg-red-100 text-red-700",
Draft: "bg-slate-100 text-slate-700",
Unpaid: "bg-blue-100 text-blue-700",
};

const statusClass =
statusStyles[invoice.status as keyof typeof statusStyles] ??
"bg-slate-100 text-slate-700";

// Dummy line items for the invoice preview
const lineItems = [
{
id: 1,
item: "Professional Consulting Services",
description: "Business and financial consulting services",
quantity: 1,
rate: invoice.amount,
},
];

const subtotal = lineItems.reduce(
(total, item) => total + item.quantity * item.rate,
0
);

const tax = Math.round(subtotal * 0.05);
const total = subtotal + tax;

return ( <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
{/* Page Header */} <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between"> <div className="flex items-start gap-4"> <Link href="/accounting/invoices"> <Button
           variant="outline"
           size="icon"
           className="rounded-xl"
           aria-label="Back to invoices"
         > <ArrowLeft size={18} /> </Button> </Link>


      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Invoice {invoice.id}
          </h1>

          <Badge className={statusClass}>{invoice.status}</Badge>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          View and manage invoice details.
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-3">
      <Button variant="outline" className="rounded-xl">
        <Edit size={17} />
        Edit
      </Button>

      <Button variant="outline" className="rounded-xl">
        <Printer size={17} />
        Print
      </Button>

      <Button variant="outline" className="rounded-xl">
        <Download size={17} />
        Download
      </Button>

      <Button className="rounded-xl bg-blue-600 hover:bg-blue-700">
        <Send size={17} />
        Send Invoice
      </Button>
    </div>
  </div>

  {/* Invoice Preview */}
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-12">
    {/* Company + Invoice Information */}
    <div className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-8 md:flex-row">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            5D
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              The 5th Dimension Consultancy
            </h2>

            <p className="text-sm text-slate-500">
              Professional Accounting & Consultancy
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-1 text-sm text-slate-600">
          <p>Karachi, Pakistan</p>
          <p>accounts@5thdimension.com</p>
          <p>+92 XXX XXXXXXX</p>
        </div>
      </div>

      <div className="md:text-right">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          INVOICE
        </h2>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-8 md:justify-end">
            <span className="text-slate-500">Invoice #</span>
            <span className="font-semibold text-slate-900">
              {invoice.id}
            </span>
          </div>

          <div className="flex justify-between gap-8 md:justify-end">
            <span className="text-slate-500">Issue Date</span>
            <span className="font-medium text-slate-800">
              {invoice.issueDate}
            </span>
          </div>

          <div className="flex justify-between gap-8 md:justify-end">
            <span className="text-slate-500">Due Date</span>
            <span className="font-medium text-slate-800">
              {invoice.dueDate}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Bill To */}
    <div className="py-8">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Bill To
      </p>

      <h3 className="mt-3 text-lg font-bold text-slate-900">
        {invoice.customer}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Customer account information
      </p>
    </div>

    <Separator />

    {/* Invoice Items */}
    <div className="py-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Item
              </th>

              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Description
              </th>

              <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                Qty
              </th>

              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Rate
              </th>

              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {lineItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-100"
              >
                <td className="px-4 py-5 font-semibold text-slate-800">
                  {item.item}
                </td>

                <td className="px-4 py-5 text-sm text-slate-500">
                  {item.description}
                </td>

                <td className="px-4 py-5 text-center text-sm text-slate-700">
                  {item.quantity}
                </td>

                <td className="px-4 py-5 text-right text-sm text-slate-700">
                  PKR {item.rate.toLocaleString()}
                </td>

                <td className="px-4 py-5 text-right font-semibold text-slate-900">
                  PKR {(item.quantity * item.rate).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Totals */}
    <div className="flex justify-end border-t border-slate-200 pt-8">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium text-slate-800">
            PKR {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tax (5%)</span>
          <span className="font-medium text-slate-800">
            PKR {tax.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-4">
          <span className="text-lg font-bold text-slate-900">
            Total
          </span>

          <span className="text-xl font-bold text-blue-600">
            PKR {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>

    {/* Notes */}
    <div className="mt-12 grid gap-8 border-t border-slate-200 pt-8 md:grid-cols-2">
      <div>
        <h4 className="font-bold text-slate-900">Notes</h4>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Thank you for your business. We appreciate the opportunity to
          work with you.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-slate-900">
          Terms & Conditions
        </h4>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Payment is due by the specified due date. Please contact us if
          you have any questions regarding this invoice.
        </p>
      </div>
    </div>
  </div>
</div>

);
}
