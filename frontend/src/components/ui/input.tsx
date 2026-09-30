import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#0F172A] transition-colors outline-none placeholder:text-[#94A3B8] focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
