"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button } from "@nba/design-system"
import { Sparkles, Loader2, Target, TrendingUp, TriangleAlert, RefreshCw } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/dashboard/journal/insights?days=30", { signal: controller.signal })
      .then(async (res) => {
        // Ne jamais passer une réponse d'erreur au rendu : `{ error }` n'a pas
        // de `strengths` → crash React (cf. TECH-03).
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return (await res.json()) as Insights
      })
      .then((d) => {
        if (!controller.signal.aborted) setData(d)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setData(null)
        setError("Le coach IA est momentanément indisponible.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [attempt])

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

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/[0.03]">
        <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-destructive" />
          <span className="text-muted-foreground">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true)
              setError(null)
              setAttempt((a) => a + 1)
            }}
            className="ml-auto"
          >
            <RefreshCw className="size-3.5" />
            Réessayer
          </Button>
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
