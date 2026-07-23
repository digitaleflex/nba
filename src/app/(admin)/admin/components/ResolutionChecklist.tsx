"use client"

import { useState } from "react"
import { cn } from "@nba/design-system"

interface ChecklistItem {
  id: string
  label: string
}

interface ResolutionChecklistProps {
  items: ChecklistItem[]
}

export function ResolutionChecklist({ items }: ResolutionChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = items.length > 0 && checked.size === items.length

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/30 transition-colors"
        >
          <input
            type="checkbox"
            checked={checked.has(item.id)}
            onChange={() => toggle(item.id)}
            className="size-4 rounded border-border accent-primary"
          />
          <span className={cn("text-sm", checked.has(item.id) && "line-through text-muted-foreground")}>
            {item.label}
          </span>
        </label>
      ))}
      {allChecked && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-medium animate-slide-up">
          ✓ Résolution complétée
        </div>
      )}
    </div>
  )
}
