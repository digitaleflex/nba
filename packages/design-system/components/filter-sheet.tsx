"use client"

import { useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { BottomSheet, BottomSheetContent, BottomSheetHeader } from "./bottom-sheet"

interface FilterOption {
  value: string
  label: string
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

interface FilterSheetProps {
  groups: FilterGroup[]
  activeCount: number
  onReset: () => void
  className?: string
}

export function FilterSheet({ groups, activeCount, onReset, className }: FilterSheetProps) {
  const [open, setOpen] = useState(false)
  const hasFilters = activeCount > 0

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="mobile-sm"
          onClick={() => setOpen(true)}
          className="md:hidden"
          aria-label="Filtres"
        >
          <SlidersHorizontal className="size-3.5" />
          {hasFilters && (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>

        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {groups.map((group) => (
            <select
              key={group.id}
              value={group.value}
              onChange={(e) => group.onChange(e.target.value)}
              className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground outline-none focus:border-primary/50"
              aria-label={group.label}
            >
              <option value="">{group.label}</option>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
          {hasFilters && (
            <button
              onClick={onReset}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent>
          <BottomSheetHeader title="Filtres" onClose={() => setOpen(false)} />

          <div className="space-y-4 pt-2">
            {groups.map((group) => (
              <fieldset key={group.id}>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </legend>
                <div className="space-y-1">
                  {group.options.map((opt) => {
                    const isSelected = group.value === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => group.onChange(isSelected ? "" : opt.value)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        )}>
                          {isSelected && <X className="size-2.5" />}
                        </span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={() => { onReset(); setOpen(false) }}
              className="mt-4 w-full py-2.5 text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted"
            >
              Réinitialiser tous les filtres
            </button>
          )}
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
