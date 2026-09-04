"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type InvoiceItem = {
  id: number;
  item: string;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
};

const customers = [
  "The 5th Dimension Consultancy",
  "Ascension",
  "Brysona Consulting (PVT) Ltd",
  "Vertex Solutions",
  "TechVision Pakistan",
];

export default function CreateInvoiceDialog() {
  const [open, setOpen] = useState(false);

  const [customer, setCustomer] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      item: "",
      description: "",
      quantity: 1,
      rate: 0,
      tax: 0,
    },
  ]);

  const updateItem = (
    id: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

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
    setItems((currentItems) => {
      if (currentItems.length === 1) return currentItems;

      return currentItems.filter((item) => item.id !== id);
    });
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity * item.rate,
      0
    );
  }, [items]);

  const taxTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.rate;
      return total + (itemTotal * item.tax) / 100;
    }, 0);
  }, [items]);

  const total = subtotal + taxTotal - discount;

  const resetForm = () => {
    setCustomer("");
    setInvoiceDate("");
    setDueDate("");
    setDiscount(0);
    setNotes("");
    setTerms("");

    setItems([
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

  const handleSaveDraft = () => {
    console.log("Invoice saved as draft", {
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

    setOpen(false);
    resetForm();
  };

  const handleSendInvoice = () => {
    console.log("Invoice sent", {
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

    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700">
        <Plus size={18} />
        Create Invoice
      </DialogTrigger>

      <DialogContent className="h-[95vh] w-[calc(100vw-1rem)] max-w-none overflow-x-hidden overflow-y-auto rounded-xl p-4 sm:h-[92vh] sm:w-[92vw] sm:max-w-none sm:rounded-2xl sm:p-6 lg:h-[90vh] lg:w-[92vw] lg:max-w-[1600px] lg:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Create Invoice
          </DialogTitle>

          <DialogDescription>
            Create a new invoice for your customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Customer and Dates */}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Customer
              </label>

              <select
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select customer</option>

                {customers.map((customerName) => (
                  <option key={customerName} value={customerName}>
                    {customerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Invoice Date
              </label>

              <Input
                type="date"
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
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Invoice Items
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add products or services to this invoice.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="rounded-xl"
              >
                <Plus size={17} />
                Add Item
              </Button>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px]">
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
                            placeholder="Service name"
                            value={item.item}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "item",
                                event.target.value
                              )
                            }
                            className="h-10"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "description",
                                event.target.value
                              )
                            }
                            className="h-10"
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

          {/* Bottom Section */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add notes for the customer..."
                  className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Terms & Conditions
                </label>

                <textarea
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  placeholder="Enter payment terms..."
                  className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="mb-5 font-bold text-slate-900">
                Invoice Summary
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-800">
                    PKR {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium text-slate-800">
                    PKR {taxTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Discount</span>

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
                    <span className="text-base font-bold text-slate-900">
                      Total
                    </span>

                    <span className="text-lg font-bold text-blue-600">
                      PKR {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="h-11 rounded-xl"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              onClick={handleSendInvoice}
              className="h-11 rounded-xl bg-blue-600 px-6 font-semibold hover:bg-blue-700"
            >
              Send Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}