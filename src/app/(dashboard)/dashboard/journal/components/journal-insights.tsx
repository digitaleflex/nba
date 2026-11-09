"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@nba/design-system"
import { Sparkles, Loader2, Target, TrendingUp, TriangleAlert } from "lucide-react"

interface Insights {
  count: number
  summary: string
  strengths: string[]
  warnings: string[]
  action: string
  processScore: number | null
}

export function JournalInsights() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/journal/insights?days=30")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Le coach analyse ton journal…
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" />
            Coach IA — ton bilan 30 jours
          </h2>
          {data.processScore !== null && (
            <span className="text-xs font-mono font-bold rounded-full bg-primary/10 text-primary px-2.5 py-1">
              Process {data.processScore}/100
            </span>
          )}
        </div>

        <p className="text-sm font-medium">{data.summary}</p>

        {data.strengths.length > 0 && (
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="size-3.5 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        )}

        {data.warnings.length > 0 && (
          <ul className="space-y-1">
            {data.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <TriangleAlert className="size-3.5 shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-background/70 border border-primary/20 p-3">
          <Target className="size-4 shrink-0 text-primary mt-0.5" />
          <p className="text-xs font-semibold">Action de la semaine : {data.action}</p>
        </div>
      </CardContent>
    </Card>
  )
}
