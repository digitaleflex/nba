"use client"

import { useMemo } from "react"
import { Chart, Card, CardContent, cn } from "@nba/design-system"
import type { FraudEvent } from "../features/FraudTab"

interface FraudTimelineChartProps {
  events: FraudEvent[]
  className?: string
}

export function FraudTimelineChart({ events, className }: FraudTimelineChartProps) {
  const hourlyData = useMemo(() => {
    const buckets = new Map<string, number>()
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now)
      h.setHours(h.getHours() - i, 0, 0, 0)
      buckets.set(h.getHours().toString().padStart(2, "0") + "h", 0)
    }
    for (const e of events) {
      const hour = new Date(e.createdAt).getHours().toString().padStart(2, "0") + "h"
      buckets.set(hour, (buckets.get(hour) ?? 0) + 1)
    }
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
  }, [events])

  const severityData = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    for (const e of events) {
      const s = e.severity.toUpperCase() as keyof typeof counts
      if (s in counts) counts[s]++
    }
    return [
      { label: "CRITIQUE", value: counts.CRITICAL, color: "rose" as const },
      { label: "HAUT", value: counts.HIGH, color: "primary" as const },
      { label: "MOYEN", value: counts.MEDIUM, color: "blue" as const },
      { label: "BAS", value: counts.LOW, color: "emerald" as const },
    ]
  }, [events])

  if (events.length === 0) return null

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      <Card><CardContent className="p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Evenements par heure (24h)
        </h3>
        <Chart type="line" data={hourlyData} emptyText="Aucun evenement" />
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Repartition par severite
        </h3>
        <Chart type="bar" data={severityData} emptyText="Aucun evenement" />
      </CardContent></Card>
    </div>
  )
}
