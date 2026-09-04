import { cn } from "@/lib/utils";

type Status =
  | "Paid"
  | "Pending"
  | "Overdue"
  | "Draft"
  | "Unpaid"
  | "Active"
  | "Inactive";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Overdue: "border-red-200 bg-red-50 text-red-700",
  Draft: "border-slate-200 bg-slate-50 text-slate-600",
  Unpaid: "border-orange-200 bg-orange-50 text-orange-700",
  Active: "border-blue-200 bg-blue-50 text-blue-700",
  Inactive: "border-slate-200 bg-slate-50 text-slate-500",
};

export default function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}