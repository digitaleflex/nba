"use client"

import { useState, useCallback } from "react"
import { AnalyticsEvents } from "@nba/lib/analytics"
import { useCoachEvents } from "@nba/hooks/use-coach-events"
import { X, Lightbulb, AlertTriangle, Sparkles, BrainCircuit } from "lucide-react"
import type { CoachMessage } from "@nba/lib/coach/providers/types"

const severityConfig = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-500",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-500",
  },
  insight: {
    icon: BrainCircuit,
    bg: "bg-violet-500/10 border-violet-500/30",
    text: "text-violet-500",
  },
  achievement: {
    icon: Sparkles,
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-500",
  },
}

export function CoachIA() {
  const { messages, dismiss } = useCoachEvents({
    max: 5,
    onMessage: (msg) => AnalyticsEvents.coachMessageShown(msg.rule ?? "unknown"),
  })
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = messages.filter((m) => !dismissed.has(m.id))
  if (visible.length === 0) return null

  const latest = visible[0]
  const cfg = severityConfig[latest.severity]

  return (
    <div className="fixed bottom-20 right-4 left-4 z-40 max-w-sm w-auto ml-auto md:bottom-4 md:left-auto md:w-full animate-in slide-in-from-bottom-4 duration-300">
      <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur-xl ${cfg.bg} bg-card/95`}>
        <div className="flex items-start gap-3">
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
            <cfg.icon className={`size-4 ${cfg.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${cfg.text}`}>{latest.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{latest.body}</p>
          </div>
          <button
            onClick={() => dismiss(latest.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
