import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: (string | BreadcrumbItem)[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="space-y-1">
        {/* Breadcrumb line matching attached sample */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#64748B]">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const label = typeof crumb === "string" ? crumb : crumb.label;
            const href = typeof crumb === "object" ? crumb.href : undefined;

            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#94A3B8] font-semibold">&gt;</span>}
                {href && !isLast ? (
                  <Link href={href} className="hover:text-[#2563EB] transition-colors">
                    {label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-[#2563EB] font-bold" : "text-[#64748B]"}>
                    {label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
