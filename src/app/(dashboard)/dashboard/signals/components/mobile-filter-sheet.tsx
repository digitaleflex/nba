"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@nba/design-system"
import { SlidersHorizontal, X } from "lucide-react"

type FilterKey = "all" | "unread" | "today" | "week" | "forex" | "deriv" | "forex+deriv" | "favorite" | "archive"

interface FilterGroup {
  label: string
  filters: { key: FilterKey; label: string }[]
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    label: "Statut",
    filters: [
      { key: "all", label: "Tous" },
      { key: "unread", label: "Non lus" },
      { key: "favorite", label: "Favoris ⭐" },
      { key: "archive", label: "Archives 📂" },
    ],
  },
  {
    label: "Période",
    filters: [
      { key: "today", label: "Aujourd'hui" },
      { key: "week", label: "Cette semaine" },
    ],
  },
  {
    label: "Marché",
    filters: [
      { key: "forex", label: "Forex" },
      { key: "deriv", label: "Deriv" },
      { key: "forex+deriv", label: "Forex + Deriv" },
    ],
  },
]

interface MobileFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeFilter: FilterKey
  onFilterChange: (filter: FilterKey) => void
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  activeFilter,
  onFilterChange,
}: MobileFilterSheetProps) {
  const [tempFilter, setTempFilter] = useState<FilterKey>(activeFilter)

  const handleApply = () => {
    onFilterChange(tempFilter)
    onOpenChange(false)
  }

  const handleReset = () => {
    setTempFilter("all")
  }

  const activeCount = tempFilter === "all" ? 0 : 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none max-w-full sm:max-w-sm data-open:slide-in-from-bottom data-closed:slide-out-to-bottom"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            Filtres
            {activeCount > 0 && (
              <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-5 py-4 max-h-[50vh] overflow-y-auto">
          {FILTER_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTempFilter(f.key)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-150 ${
                      tempFilter === f.key
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-row gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={tempFilter === "all"}
            className="flex-1"
          >
            Réinitialiser
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
