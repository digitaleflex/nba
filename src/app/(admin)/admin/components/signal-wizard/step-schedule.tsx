"use client"

import { Calendar, Zap } from "lucide-react"
import { Card, CardContent, cn } from "@nba/design-system"

interface StepScheduleProps {
  scheduled: boolean
  setScheduled: (v: boolean) => void
  scheduledAt: string
  setScheduledAt: (v: string) => void
}

export function StepSchedule({ scheduled, setScheduled, scheduledAt, setScheduledAt }: StepScheduleProps) {
  const nowIso = new Date().toISOString().slice(0, 16)

  return (
    <div className="space-y-4">
      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Quand diffuser ?</label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setScheduled(false)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
            !scheduled
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:bg-muted/30"
          )}
        >
          <Zap className="size-5" />
          <span className="text-xs font-semibold">Maintenant</span>
          <span className="text-[9px] opacity-70">Envoi immédiat</span>
        </button>
        <button
          type="button"
          onClick={() => setScheduled(true)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
            scheduled
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:bg-muted/30"
          )}
        >
          <Calendar className="size-5" />
          <span className="text-xs font-semibold">Planifié</span>
          <span className="text-[9px] opacity-70">Plus tard</span>
        </button>
      </div>

      {scheduled && (
        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-4 space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date et heure</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={nowIso}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            {scheduledAt && new Date(scheduledAt).getTime() <= Date.now() && (
              <p className="text-[10px] text-amber-600">Choisissez une date future pour la planification.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
