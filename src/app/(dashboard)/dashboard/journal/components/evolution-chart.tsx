"use client"

import { useState } from "react"
import { cn, useMediaQuery } from "@nba/design-system"
import { formatDayLabel } from "@nba/lib/format-date"
import { computeScale, groupSeriesByUnit } from "./evolution-scale"

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

const UNIT_TITLES: Record<string, string> = {
  "€": "Montants (€)",
  "%": "Taux (%)",
  "/5": "Confiance (sur 5)",
}

function formatValue(value: number, unit?: string): string {
  const rounded = Math.round(value * 100) / 100
  const sign = unit === "€" && rounded > 0 ? "+" : ""
  return `${sign}${rounded}${unit ?? ""}`
}

export function EvolutionChart({ labels, series, height = 220 }: EvolutionChartProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(series.map((s, i) => [s.key, i < 2]))
  )

  const visible = series.filter((s) => active[s.key])
  // `|| true` rendait la condition toujours vraie (cf. TECH-04).
  const hasData = labels.length > 0 && visible.some((s) => s.values.some((v) => v !== 0))

  if (labels.length === 0) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <span className="size-8 rounded-full bg-muted/60" />
        <p className="text-[11px]">Encore trop peu de données pour tracer l&apos;évolution</p>
      </div>
    )
  }

  // Une unité = une échelle = un panneau. Deux unités différentes (% et €)
  // ne partagent donc plus la même hauteur visuelle (cf. TECH-04).
  const groups = groupSeriesByUnit(visible)

  // Le pied de graphique est plafonné aux 12 derniers points : au-delà, la
  // liste de valeurs devient illisible (l'API renvoie jusqu'à 90 jours).
  const legendStart = Math.max(0, labels.length - 12)

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
            {s.unit && <span className="text-muted-foreground/70">({s.unit})</span>}
          </button>
        ))}
      </div>

      {!hasData && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-6 text-[11px] text-muted-foreground">
          Aucune donnée sur la période sélectionnée.
        </div>
      )}

      {hasData &&
        Array.from(groups.entries()).map(([unit, groupSeries]) => {
          const scale = computeScale(groupSeries.flatMap((s) => s.values))
          const span = scale.max - scale.min || 1
          const yOf = (v: number) => 95 - ((v - scale.min) / span) * 90
          const zeroY = scale.min < 0 && scale.max > 0 ? yOf(0) : null

          return (
            <div key={unit || "default"} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-medium uppercase tracking-wide">
                  {UNIT_TITLES[unit] ?? (unit || "Valeurs")}
                </span>
                <span className="font-mono">
                  min {formatValue(scale.min, unit)} · max {formatValue(scale.max, unit)}
                </span>
              </div>
              <div className="relative w-full" style={{ height }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  {zeroY !== null && (
                    <line
                      x1="0"
                      y1={zeroY}
                      x2="100"
                      y2={zeroY}
                      stroke="currentColor"
                      strokeWidth={0.3}
                      strokeDasharray="2 2"
                      className="text-muted-foreground/40"
                    />
                  )}
                  {groupSeries.map((s, si) => {
                    const pts = s.values
                      .map((v, i) => {
                        const x = s.values.length === 1 ? 50 : (i / (s.values.length - 1)) * 100
                        return `${x},${yOf(v)}`
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
            </div>
          )
        })}

      {hasData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          {labels.slice(legendStart).map((l, offset) => {
            const i = legendStart + offset
            return (
              <span key={l} className="font-mono">
                {formatDayLabel(l)}
                {!isMobile &&
                  visible.map((s) => (
                    <span key={s.key} className="ml-1" style={{ color: s.color }}>
                      {formatValue(s.values[i] ?? 0, s.unit)}
                    </span>
                  ))}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
