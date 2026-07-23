"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@nba/design-system"

interface SummaryItem {
  id: string
  title: string
  subtitle: string
  severity?: "low" | "medium" | "high" | "critical"
  onClick?: () => void
}

interface SummaryListProps {
  items: SummaryItem[]
  className?: string
}

function SeverityIcon({ severity }: { severity?: SummaryItem["severity"] }) {
  const colors: Record<string, string> = {
    low: "bg-blue-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  }
  return (
    <span className={cn("size-2 rounded-full shrink-0", severity ? colors[severity] : "bg-neutral-400")} />
  )
}

export function SummaryList({ items, className }: SummaryListProps) {
  if (items.length === 0) return null

  return (
    <div className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={item.onClick}
          className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <SeverityIcon severity={item.severity} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0 ml-2" />
        </div>
      ))}
    </div>
  )
}
