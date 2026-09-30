import React from "react";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  badgeText?: string;
  badgeType?: "success" | "info" | "danger" | "warning" | "neutral";
  subtext?: string;
  icon: LucideIcon;
  iconClassName?: string;
  chartType?: "sparkline" | "progress" | "dual-progress";
  sparklinePath?: string;
  progressPercent?: number;
}

export default function KpiCard({
  title,
  value,
  badgeText,
  badgeType = "success",
  subtext,
  icon: Icon,
  iconClassName = "bg-[#EFF6FF] text-[#2563EB]",
  chartType = "sparkline",
  sparklinePath = "M0 18 Q 25 15, 50 18 T 100 12 T 150 14 T 200 6",
  progressPercent = 62,
}: KpiCardProps) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "danger":
        return "bg-[#FEF2F2] text-[#EF4444]";
      case "info":
        return "bg-[#EFF6FF] text-[#2563EB]";
      case "warning":
        return "bg-[#FFFBEB] text-[#F59E0B]";
      case "neutral":
        return "bg-[#F1F5F9] text-[#64748B]";
      default:
        return "bg-[#ECFDF5] text-[#10B981]";
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:border-[#2563EB]/30">
      <div>
        {/* Header: Title uppercase + Icon on right */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {title}
          </span>
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClassName}`}
          >
            <Icon size={15} />
          </div>
        </div>

        {/* Main Monospace Amount */}
        <div className="mt-3 font-mono text-2xl sm:text-[28px] font-bold tracking-tight text-[#0F172A]">
          {value}
        </div>

        {/* Badge & Subtext */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {badgeText && (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${getBadgeStyle()}`}>
              {badgeText}
            </span>
          )}
          {subtext && <span className="text-[#64748B] text-[11px] font-medium">{subtext}</span>}
        </div>
      </div>

      {/* Bottom Visualization (Sparkline or Progress) matching sample */}
      <div className="mt-4 pt-1">
        {chartType === "sparkline" && (
          <div className="h-6 w-full overflow-hidden">
            <svg
              className="h-full w-full overflow-visible"
              viewBox="0 0 200 24"
              preserveAspectRatio="none"
            >
              <path
                d={sparklinePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {chartType === "progress" && (
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-[#EFF6FF]">
            <div
              className="h-full rounded-sm bg-[#2563EB]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {chartType === "dual-progress" && (
          <div className="flex h-1.5 w-full overflow-hidden rounded-sm bg-[#F1F5F9]">
            <div className="h-full bg-[#0EA5E9]" style={{ width: "82%" }} />
            <div className="h-full bg-[#EF4444]" style={{ width: "18%" }} />
          </div>
        )}
      </div>
    </div>
  );
}