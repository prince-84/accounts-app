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
      <DialogTrigger className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 font-semibold text-white transition hover:bg-[#0D1E3A] border border-[#152744]">
        <Plus size={18} className="text-[#F59E0B]" />
        Create Invoice
      </DialogTrigger>

      <DialogContent className="h-[95vh] w-[calc(100vw-1rem)] max-w-none overflow-x-hidden overflow-y-auto rounded-xl p-4 sm:h-[92vh] sm:w-[92vw] sm:max-w-none sm:rounded-2xl sm:p-6 lg:h-[90vh] lg:w-[92vw] lg:max-w-[1600px] lg:p-8 border border-[#E2E8F0] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0F172A]">
            Create Invoice
          </DialogTitle>

          <DialogDescription className="text-xs text-[#64748B]">
            Create a new invoice for your customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Customer and Dates */}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Customer
              </label>

              <select
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
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
              <label className="text-sm font-semibold text-[#0F172A]">
                Invoice Date
              </label>

              <Input
                type="date"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
                className="h-11 rounded-xl border-[#E2E8F0]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0F172A]">
                Due Date
              </label>

              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-11 rounded-xl border-[#E2E8F0]"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0F172A]">
                  Invoice Items
                </h3>

                <p className="mt-1 text-sm text-[#64748B]">
                  Add products or services to this invoice.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="rounded-xl border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <Plus size={17} className="text-[#F59E0B]" />
                Add Item
              </Button>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#64748B]">
                      Item
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#64748B]">
                      Description
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[#64748B]">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[#64748B]">
                      Rate
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[#64748B]">
                      Tax %
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[#64748B]">
                      Amount
                    </th>

                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0]/60">
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
                            className="h-10 border-[#E2E8F0]"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "description",
                                event.target.value
                              )
                            }
                            className="h-10 border-[#E2E8F0]"
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
                            className="h-10 text-center border-[#E2E8F0]"
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
                            className="h-10 text-right border-[#E2E8F0]"
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
                            className="h-10 text-center border-[#E2E8F0]"
                          />
                        </td>

                        <td className="p-3 text-right font-medium text-[#0F172A]">
                          PKR {amount.toLocaleString()}
                        </td>

                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-[#D93838] hover:bg-red-50 hover:text-red-700"
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
                <label className="text-sm font-semibold text-[#0F172A]">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add notes for the customer..."
                  className="min-h-24 w-full rounded-xl border border-[#E2E8F0] p-3 text-sm outline-none transition focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A]">
                  Terms & Conditions
                </label>

                <textarea
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  placeholder="Enter payment terms..."
                  className="min-h-24 w-full rounded-xl border border-[#E2E8F0] p-3 text-sm outline-none transition focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6">
              <h3 className="mb-5 font-bold text-[#0F172A]">
                Invoice Summary
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Subtotal</span>
                  <span className="font-medium text-[#0F172A]">
                    PKR {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Tax</span>
                  <span className="font-medium text-[#0F172A]">
                    PKR {taxTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#64748B]">Discount</span>

                  <Input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(event) =>
                      setDiscount(Number(event.target.value))
                    }
                    className="h-10 w-36 text-right border-[#E2E8F0]"
                  />
                </div>

                <div className="border-t border-[#E2E8F0] pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-[#0F172A]">
                      Total
                    </span>

                    <span className="text-lg font-bold text-[#F59E0B]">
                      PKR {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="h-11 rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              onClick={handleSendInvoice}
              className="h-11 rounded-xl bg-[#0F172A] px-6 font-semibold text-white hover:bg-[#0D1E3A] border border-[#152744]"
            >
              Send Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}