"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoices } from "@/data/invoice-data";

type InvoiceItem = {
id: number;
item: string;
description: string;
quantity: number;
rate: number;
tax: number;
};

export default function EditInvoicePage() {
const params = useParams();
const router = useRouter();

const invoiceId = params.id as string;

const invoice = invoices.find((item) => item.id === invoiceId);

const [customer, setCustomer] = useState(invoice?.customer ?? "");
const [invoiceDate, setInvoiceDate] = useState(invoice?.issueDate ?? "");
const [dueDate, setDueDate] = useState(invoice?.dueDate ?? "");

const [items, setItems] = useState<InvoiceItem[]>([
{
id: 1,
item: "Professional Consulting Services",
description: "Business and financial consulting services",
quantity: 1,
rate: invoice?.amount ?? 0,
tax: 5,
},
]);

const [discount, setDiscount] = useState(0);

const [notes, setNotes] = useState(
"Thank you for your business. We appreciate the opportunity to work with you."
);

const [terms, setTerms] = useState(
"Payment is due by the specified due date."
);

if (!invoice) {
return ( <div className="rounded-2xl border border-red-200 bg-red-50 p-6"> <h1 className="text-xl font-bold text-red-700">
Invoice not found </h1>


    <p className="mt-2 text-sm text-red-600">
      The invoice you are trying to edit does not exist.
    </p>

    <Link href="/accounting/invoices">
      <Button className="mt-5">Back to Invoices</Button>
    </Link>
  </div>
);


}

const subtotal = items.reduce(
(total, item) => total + item.quantity * item.rate,
0
);

const taxTotal = items.reduce(
(total, item) =>
total + (item.quantity * item.rate * item.tax) / 100,
0
);

const total = subtotal + taxTotal - discount;

const addItem = () => {
setItems((currentItems) => [
...currentItems,
{
id: Date.now(),
item: "",
description: "",
quantity: 1,
rate: 0,
tax: 0,
},
]);
};

const removeItem = (id: number) => {
if (items.length === 1) return;


setItems((currentItems) =>
  currentItems.filter((item) => item.id !== id)
);


};

const updateItem = (
id: number,
field: keyof InvoiceItem,
value: string | number
) => {
setItems((currentItems) =>
currentItems.map((item) =>
item.id === id
? {
...item,
[field]: value,
}
: item
)
);
};

const handleSave = () => {
console.log("Saving invoice:", {
invoiceId,
customer,
invoiceDate,
dueDate,
items,
subtotal,
taxTotal,
discount,
total,
notes,
terms,
});


router.push(`/accounting/invoices/${invoiceId}`);


};

const handleSend = () => {
console.log("Sending invoice:", invoiceId);


router.push(`/accounting/invoices/${invoiceId}`);


};

return ( <div className="mx-auto w-full max-w-[1600px] space-y-6">
{/* Page Header */} <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between"> <div className="flex items-start gap-4">
<Link href={`/accounting/invoices/${invoiceId}`}> <Button
           variant="outline"
           size="icon"
           className="shrink-0 rounded-xl"
           aria-label="Back to invoice"
         > <ArrowLeft size={18} /> </Button> </Link>


      <div>
        <p className="text-sm font-medium text-blue-600">
          Invoice Management
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Edit Invoice
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {invoiceId}
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={handleSave}
        className="rounded-xl"
      >
        <Save size={17} />
        Save Changes
      </Button>

      <Button
        onClick={handleSend}
        className="rounded-xl bg-blue-600 hover:bg-blue-700"
      >
        <Send size={17} />
        Save & Send
      </Button>
    </div>
  </div>

  {/* Invoice Form */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
    {/* Customer and Dates */}
    <div className="grid gap-5 md:grid-cols-3">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">
          Customer
        </label>

        <Input
          value={customer}
          onChange={(event) => setCustomer(event.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">
          Invoice Date
        </label>

        <Input
          type="text"
          value={invoiceDate}
          onChange={(event) => setInvoiceDate(event.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">
          Due Date
        </label>

        <Input
          type="text"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="h-11 rounded-xl"
        />
      </div>
    </div>

    {/* Line Items */}
    <div className="mt-8">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Invoice Items
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage products and services included in this invoice.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full rounded-xl sm:w-auto"
        >
          <Plus size={17} />
          Add Item
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[850px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Item
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Description
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                Qty
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Rate
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                Tax %
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Amount
              </th>

              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const amount = item.quantity * item.rate;

              return (
                <tr key={item.id}>
                  <td className="p-3">
                    <Input
                      value={item.item}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "item",
                          event.target.value
                        )
                      }
                      className="h-10 min-w-40"
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      value={item.description}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "description",
                          event.target.value
                        )
                      }
                      className="h-10 min-w-52"
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "quantity",
                          Number(event.target.value)
                        )
                      }
                      className="h-10 w-20"
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "rate",
                          Number(event.target.value)
                        )
                      }
                      className="h-10 w-32"
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      value={item.tax}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "tax",
                          Number(event.target.value)
                        )
                      }
                      className="h-10 w-20"
                    />
                  </td>

                  <td className="p-3 text-right text-sm font-semibold text-slate-700">
                    PKR {amount.toLocaleString()}
                  </td>

                  <td className="p-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Notes and Summary */}
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Terms & Conditions
          </label>

          <textarea
            value={terms}
            onChange={(event) => setTerms(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="h-fit rounded-2xl bg-slate-50 p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Invoice Summary
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-800">
              PKR {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax</span>
            <span className="font-medium text-slate-800">
              PKR {taxTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
              Discount
            </span>

            <Input
              type="number"
              min="0"
              value={discount}
              onChange={(event) =>
                setDiscount(Number(event.target.value))
              }
              className="h-10 w-36 text-right"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-slate-900">
                Total
              </span>

              <span className="text-xl font-bold text-blue-600">
                PKR {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Actions */}
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        onClick={() =>
          router.push(`/accounting/invoices/${invoiceId}`)
        }
        className="h-11 rounded-xl"
      >
        Cancel
      </Button>

      <Button
        onClick={handleSave}
        className="h-11 rounded-xl bg-blue-600 px-6 hover:bg-blue-700"
      >
        <Save size={17} />
        Save Changes
      </Button>
    </div>
  </div>
</div>


);
}
