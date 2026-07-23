"use client"

import { useEffect, useState } from "react"
import { Flame, Award } from "lucide-react"
import { cn } from "@nba/design-system"

interface StreakData {
  streak: { current: number; best: number }
  badges: { id: string; label: string; icon: string; unlockedAt: string }[]
}

export function StreakBadge() {
  const [data, setData] = useState<StreakData | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch("/api/user/streak")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
  }, [])

  if (!data || data.streak.current === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/15 transition-colors cursor-pointer"
        aria-label={`Streak: ${data.streak.current} jours`}
      >
        <Flame className={cn("size-3.5", data.streak.current >= 7 && "animate-pulse")} />
        {data.streak.current}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-card shadow-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-foreground">Streak de connexion</p>
                <p className="text-[11px] text-muted-foreground">
                  {data.streak.current} jour{data.streak.current > 1 ? "s" : ""} d&apos;affilée
                  {data.streak.best > data.streak.current && ` · Meilleur : ${data.streak.best}`}
                </p>
              </div>
            </div>

            {data.badges.length > 0 && (
              <div className="border-t border-border/50 pt-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Award className="size-3" /> Badges débloqués
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {data.badges.map((b) => (
                    <div key={b.id} className="rounded-lg bg-muted/30 px-2.5 py-2 text-center">
                      <span className="text-lg">{b.icon}</span>
                      <p className="text-[10px] font-medium text-foreground leading-tight mt-0.5">{b.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
