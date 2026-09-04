import { Landmark } from "lucide-react";

import CompanyCard from "@/components/companies/CompanyCard";

const companies = [
  {
    name: "The 5th Dimension Corporate Consultancy",
    description:
      "Access financial records, invoices, expenses, and business reports.",
  },
  {
    name: "Ascension",
    description:
      "Manage your accounting workspace and keep your finances organized.",
  },
  {
    name: "Brysona Consulting (PVT) Ltd",
    description:
      "Monitor transactions, financial performance, and business activity.",
  },
];

export default function CompaniesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F9FB] px-4 py-10 sm:px-6 lg:px-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-14 flex flex-col items-center text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <Landmark size={27} />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Accounts
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Select your company
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
            Choose a company to access its accounting workspace and manage
            financial operations.
          </p>
        </header>

        {/* Company Cards */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.name}
              name={company.name}
              description={company.description}
            />
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-14 text-center text-sm text-slate-400">
          Select a workspace to continue.
        </footer>
      </div>
    </main>
  );
}