"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Trophy, X } from "lucide-react"
import { Button } from "@nba/design-system"
import { AnalyticsEvents } from "@nba/lib/analytics"

const MILESTONES = [
  { count: 1, label: "Premier trade", emoji: "🌱" },
  { count: 10, label: "10 trades — Débutant", emoji: "🔥" },
  { count: 50, label: "50 trades — Régulier", emoji: "💪" },
  { count: 100, label: "100 trades — Habitué", emoji: "🏆" },
  { count: 500, label: "500 trades — Pro", emoji: "👑" },
]

export function checkMilestone(forceCount?: number) {
  const lastShown = parseInt(localStorage.getItem("nba:milestone") || "0", 10)
  const current = forceCount ?? parseInt(localStorage.getItem("nba:trade-count") || "0", 10)
  const next = MILESTONES.filter((m) => m.count > lastShown && current >= m.count)
  if (next.length > 0) {
    localStorage.setItem("nba:milestone", String(next[0].count))
    AnalyticsEvents.milestoneReached(next[0].count)
    return next[0]
  }
  return null
}

export function MilestoneModal() {
  const [milestone, setMilestone] = useState<{ count: number; label: string; emoji: string } | null>(null)

  useEffect(() => {
    const current = parseInt(localStorage.getItem("nba:trade-count") || "0", 10)
    const m = checkMilestone(current)
    if (m) setMilestone(m)
  }, [])

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative rounded-2xl border border-border bg-card p-8 text-center shadow-2xl max-w-xs w-full mx-4"
          >
            <button
              onClick={() => setMilestone(null)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-5xl block mb-4"
            >
              {milestone.emoji}
            </motion.span>
            <Trophy className="size-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold">{milestone.label}</h3>
            <p className="text-sm text-muted-foreground mt-1">Continue comme ça !</p>
            <Button size="sm" onClick={() => setMilestone(null)} className="mt-4">
              Super !
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
