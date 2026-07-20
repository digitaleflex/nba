"use client"

import { useState } from "react"
import { cn, useMediaQuery } from "@nba/design-system"

export interface EvolutionSeries {
  key: string
  label: string
  color: string
  unit?: string
  // valeurs indexées par point (même ordre que `labels`)
  values: number[]
}

interface EvolutionChartProps {
  labels: string[]
  series: EvolutionSeries[]
  height?: number
}

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"]

export function EvolutionChart({ labels, series, height = 220 }: EvolutionChartProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(series.map((s, i) => [s.key, i < 2]))
  )

  const visible = series.filter((s) => active[s.key])
  const hasData = labels.length > 0 && visible.some((s) => s.values.some((v) => v !== 0 || true))

  if (labels.length === 0) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <span className="size-8 rounded-full bg-muted/60" />
        <p className="text-[11px]">Encore trop peu de données pour tracer l&apos;évolution</p>
      </div>
    )
  }

  // Normalise chaque série indépendamment pour un affichage lisible (0-100 vertical)
  const maxes = series.map((s) => Math.max(...s.values.map((v) => Math.abs(v)), 1))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {series.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setActive((a) => ({ ...a, [s.key]: !a[s.key] }))}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              active[s.key]
                ? "border-border bg-muted/60 text-foreground"
                : "border-dashed border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color ?? COLORS[i % COLORS.length] }} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative w-full" style={{ height }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          {visible.map((s, si) => {
            const max = maxes[series.findIndex((x) => x.key === s.key)]
            const pts = s.values
              .map((v, i) => {
                const x = s.values.length === 1 ? 50 : (i / (s.values.length - 1)) * 100
                const y = 100 - ((v / max) * 0.5 + 0.5) * 90
                return `${x},${y}`
              })
              .join(" ")
            return (
              <polyline
                key={s.key}
                points={pts}
                fill="none"
                stroke={s.color ?? COLORS[si % COLORS.length]}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
      </div>

      {hasData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          {labels.map((l, i) => (
            <span key={l} className="font-mono">
              {new Date(l).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
              {!isMobile && visible.map((s) => (
                <span key={s.key} className="ml-1" style={{ color: s.color }}>
                  {s.values[i] >= 0 && s.unit === "€" ? "+" : ""}
                  {Math.round(s.values[i] * 100) / 100}
                  {s.unit ?? ""}
                </span>
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
