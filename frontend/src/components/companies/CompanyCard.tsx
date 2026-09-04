"use client";

import { ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CompanyCardProps {
  name: string;
  description: string;
}

export default function CompanyCard({
  name,
  description,
}: CompanyCardProps) {
  const router = useRouter();

  const handleSelect = () => {
    // Temporary frontend-only navigation.
    // Later this can store the selected company.
    router.push("/accounting/dashboard");
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* Decorative background */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl transition duration-300 group-hover:bg-blue-200/70" />

      <div className="relative">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
          <Building2 size={26} />
        </div>

        <h2 className="text-lg font-bold leading-snug text-slate-900">
          {name}
        </h2>

        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600">
          Open workspace

          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </button>
  );
}