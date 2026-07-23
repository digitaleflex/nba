"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@nba/design-system"

interface SystemPulseProps {
  status: "healthy" | "degraded" | "down"
  lastActivity: Date | null
  activityRate: number
  activeAlerts: number
}

const STATUS_CONFIG = {
  healthy: { dotColor: "bg-emerald-500", ringColor: "border-emerald-500/30", barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400", pulseSpeed: "3s", label: "Système actif", textColor: "text-emerald-600" },
  degraded: { dotColor: "bg-amber-500", ringColor: "border-amber-500/30", barColor: "bg-gradient-to-r from-amber-500 to-orange-400", pulseSpeed: "1.5s", label: "Mode dégradé", textColor: "text-amber-600" },
  down: { dotColor: "bg-red-500", ringColor: "border-red-500/30", barColor: "bg-gradient-to-r from-red-500 to-rose-400", pulseSpeed: "0.8s", label: "Système en panne", textColor: "text-red-600" },
}

const BAR_PCT: Record<string, number> = {
  healthy: 100,
  degraded: 60,
  down: 30,
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return "à l'instant"
  if (seconds < 60) return `il y a ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes}min`
  return `il y a ${Math.floor(minutes / 60)}h`
}

export function SystemPulse({ status, lastActivity, activityRate, activeAlerts }: SystemPulseProps) {
  const cfg = STATUS_CONFIG[status]
  const [entered, setEntered] = useState(false)
  const [displayRate, setDisplayRate] = useState(0)
  const prevRate = useRef(0)

  useEffect(() => {
    setEntered(true)
  }, [])

  useEffect(() => {
    const start = prevRate.current
    const diff = activityRate - start
    if (diff === 0) return
    const duration = 300
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayRate(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
    prevRate.current = activityRate
  }, [activityRate])

  const barWidth = BAR_PCT[status]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Système ${status}. ${activeAlerts} alerte${activeAlerts > 1 ? "s" : ""} active${activeAlerts > 1 ? "s" : ""}.`}
      className={cn(
        "relative flex items-center justify-between gap-4 px-4 md:px-6 py-3 rounded-2xl border transition-all duration-1000",
        entered ? "animate-slide-down opacity-100" : "opacity-0 -translate-y-4",
        status === "healthy" && "bg-emerald-500/5 border-emerald-500/20",
        status === "degraded" && "bg-amber-500/5 border-amber-500/20",
        status === "down" && "bg-red-500/5 border-red-500/30",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Pulse dot with ring */}
        <div className="relative shrink-0">
          <span
            className={cn("block size-3 rounded-full", cfg.dotColor)}
            style={{ animation: `pulse-dot ${cfg.pulseSpeed} ease-in-out infinite` }}
          />
          <span
            className={cn("absolute inset-0 size-3 rounded-full", cfg.dotColor)}
            style={{ animation: `pulse-ring ${cfg.pulseSpeed} ease-in-out infinite`, opacity: 0.4 }}
          />
        </div>

        <div className="min-w-0">
          <p className={cn("text-sm font-semibold leading-tight", cfg.textColor)}>{cfg.label}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {lastActivity ? `Dernière activité: ${formatTimeAgo(lastActivity)}` : "Aucune activité"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Activity bar */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-border/40 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", cfg.barColor)}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {displayRate} action/min
          </span>
        </div>

        {/* Alerts badge */}
        {activeAlerts > 0 && (
          <span
            key={activeAlerts}
            className="size-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce-in"
          >
            {activeAlerts}
          </span>
        )}

        {/* Live badge */}
        <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <span className="sr-only">
        Système {status === "healthy" ? "opérationnel" : status === "degraded" ? "en mode dégradé" : "en panne"}.
        {activeAlerts} alerte{activeAlerts > 1 ? "s" : ""} active{activeAlerts > 1 ? "s" : ""}.
      </span>
    </div>
  )
}
