import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import InvoiceTable from "@/components/invoices/InvoiceTable";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Sales
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Invoices
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create, manage, and track all your customer invoices.
          </p>
        </div>

        <CreateInvoiceDialog />
      </div>

      {/* Invoice Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <InvoiceTable />
      </div>
    </div>
  );
}