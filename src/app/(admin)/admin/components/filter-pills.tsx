"use client"

import { cn } from "@nba/design-system"

export interface FilterOption {
  value: string
  label: string
}

export function FilterPills({
  options,
  active,
  onChange,
}: {
  options: FilterOption[]
  active: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
            active === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-muted/50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
