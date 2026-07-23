"use client"

import { type LucideIcon, CheckCircle, ShieldAlert } from "lucide-react"
import { cn } from "@nba/design-system"
import { AnimatedNumber } from "./AnimatedNumber"
import { TrendIndicator } from "./TrendIndicator"

interface HeroNumberProps {
  value: number
  label: string
  status: "calm" | "warning" | "critical"
  trend?: { value: number; direction: "up" | "down" | "stable" }
  subtitle?: string
  icon?: LucideIcon
  details?: Array<{ label: string; value: number; color?: string }>
}

const STATUS_STYLES: Record<string, { text: string; bg: string; glow: string; pulseDuration: string }> = {
  calm: {
    text: "text-emerald-600",
    bg: "bg-emerald-500/5",
    glow: "shadow-emerald-500/10",
    pulseDuration: "3s",
  },
  warning: {
    text: "text-amber-600",
    bg: "bg-amber-500/5",
    glow: "shadow-amber-500/10",
    pulseDuration: "1.5s",
  },
  critical: {
    text: "text-red-600",
    bg: "bg-red-500/5",
    glow: "shadow-red-500/20",
    pulseDuration: "0.8s",
  },
}

const PULSE_BG: Record<string, string> = {
  calm: "bg-emerald-500/10",
  warning: "bg-amber-500/10",
  critical: "bg-red-500/10",
}

export function HeroNumber({
  value,
  label,
  status,
  trend,
  subtitle,
  icon: Icon,
  details,
}: HeroNumberProps) {
  const styles = STATUS_STYLES[status]

  if (value === 0) {
    return (
      <div
        className="text-center py-6 hero-number"
        role="status"
        aria-live="polite"
        aria-label="Aucune alerte active, tout est calme"
      >
        <CheckCircle className="size-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
        <p className="text-base font-semibold text-foreground">Tout est calme</p>
        <p className="text-sm text-muted-foreground mt-0.5">Aucune alerte active</p>
      </div>
    )
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border transition-all duration-500", styles.bg, "border-transparent")}
      role="status"
      aria-live="polite"
      aria-label={`${value} ${label}, statut ${status}`}
    >
      <div className={cn("absolute inset-0 rounded-2xl opacity-30 transition-all duration-1000", PULSE_BG[status])} style={{ animation: `hero-pulse-bg ${styles.pulseDuration} ease-in-out infinite` }} />

      <div className="relative p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn("p-2 rounded-xl", styles.bg)}>
                <Icon className={cn("size-5", styles.text)} />
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
          {trend && <TrendIndicator value={trend.value} direction={trend.direction} />}
        </div>

        <div className="hero-number">
          <span className={cn("text-5xl md:text-6xl font-bold tracking-tight", styles.text)}>
            <AnimatedNumber value={value} />
          </span>
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}

        {details && details.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/30">
            {details.map((detail, i) => (
              <div key={i} className="text-center">
                <p className={cn("text-lg font-bold", detail.color || "text-foreground")}>{detail.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{detail.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="sr-only">
        {value} {label}. Système en état {status === "calm" ? "normal" : status === "warning" ? "dégradé" : "critique"}.
      </span>
    </div>
  )
}
