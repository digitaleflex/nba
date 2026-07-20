"use client"

import { CheckCircle2, Circle, Target, Award } from "lucide-react"
import { cn, Button } from "@nba/design-system"
import { motion, AnimatePresence } from "motion/react"
import { useState } from "react"
import { useUserLevel, type Mission } from "@nba/hooks/use-user-level"

function MissionItem({ mission }: { mission: Mission }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-all",
        mission.completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-card"
      )}
    >
      {mission.completed ? (
        <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <Circle className="size-5 text-muted-foreground/40 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          mission.completed ? "text-emerald-500" : "text-foreground"
        )}>
          J{mission.day} — {mission.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{mission.description}</p>
      </div>
    </motion.div>
  )
}

export function MissionsPanel() {
  const { missions, progress } = useUserLevel()
  const [open, setOpen] = useState(false)
  const completed = missions.filter((m) => m.completed).length
  const total = missions.length
  const allDone = completed === total

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2 relative"
      >
        <Target className="size-4" />
        Missions
        {completed > 0 && (
          <span className="text-[10px] text-muted-foreground">{completed}/{total}</span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute top-full right-0 mt-2 w-80 z-50"
          >
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Award className="size-4 text-primary" />
                    Missions J1-J6
                  </h3>
                  {allDone && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Complété !
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{progress}%</span>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {missions.map((mission) => (
                  <MissionItem key={mission.id} mission={mission} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
