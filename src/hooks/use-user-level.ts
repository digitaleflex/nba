"use client"

import { useState, useEffect, useCallback } from "react"
import { AnalyticsEvents } from "@nba/lib/analytics"

export interface Mission {
  id: string
  day: number
  title: string
  description: string
  completed: boolean
}

const MISSIONS: Omit<Mission, "completed">[] = [
  { id: "j1", day: 1, title: "Premier trade", description: "Enregistre ton tout premier trade dans le journal." },
  { id: "j2", day: 2, title: "Émotion", description: "Ajoute ton état émotionnel lors d'un trade (mood)." },
  { id: "j3", day: 3, title: "3 trades en un jour", description: "Fais au moins 3 trades dans la même journée." },
  { id: "j4", day: 4, title: "Stop Loss", description: "Utilise un stop loss sur un trade." },
  { id: "j5", day: 5, title: "Winrate 50%+", description: "Atteins un winrate supérieur à 50% sur 5 trades." },
  { id: "j6", day: 6, title: "Tag", description: "Ajoute un tag personnalisé à un trade." },
]

function loadMissions(): Mission[] {
  try {
    const saved = localStorage.getItem("nba:missions")
    if (saved) return JSON.parse(saved)
  } catch {}
  return MISSIONS.map((m) => ({ ...m, completed: false }))
}

function saveMissions(missions: Mission[]) {
  localStorage.setItem("nba:missions", JSON.stringify(missions))
}

export function useUserLevel() {
  const [missions, setMissions] = useState<Mission[]>(loadMissions)

  useEffect(() => {
    saveMissions(missions)
  }, [missions])

  useEffect(() => {
    const sync = () => setMissions(loadMissions())
    window.addEventListener("nba:missions-updated", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("nba:missions-updated", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const completeMission = useCallback((id: string) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, completed: true } : m)))
  }, [])

  const progress = Math.round((missions.filter((m) => m.completed).length / missions.length) * 100)

  return { missions, progress, completeMission }
}

async function fetchTrades() {
  try {
    const res = await fetch("/api/dashboard/journal/trades?limit=50")
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.trades) ? data.trades : []
  } catch {
    return []
  }
}

export async function checkMissions(params: { mood: string | null; stopLoss: string | null; tags: string[] }) {
  const missions = loadMissions()
  let changed = false

  function complete(id: string) {
    const m = missions.find((x) => x.id === id)
    if (m && !m.completed) {
      m.completed = true
      changed = true
    }
  }

  complete("j1")

  if (params.mood) complete("j2")
  if (params.stopLoss) complete("j4")
  if (params.tags.length > 0) complete("j6")

  const trades = await fetchTrades()

  // J3 — au moins 3 trades dans la même journée
  if (!missions.find((m) => m.id === "j3")?.completed) {
    const byDay = new Map<string, number>()
    for (const t of trades) {
      const day = new Date(t.tradedAt).toISOString().slice(0, 10)
      byDay.set(day, (byDay.get(day) ?? 0) + 1)
    }
    if (Math.max(0, ...byDay.values()) >= 3) complete("j3")
  }

  // J5 — winrate supérieur à 50% sur au moins 5 trades
  if (!missions.find((m) => m.id === "j5")?.completed) {
    const valid = trades.filter((t: any) => t.result === "WIN" || t.result === "LOSS")
    if (valid.length >= 5) {
      const wins = valid.filter((t: any) => t.result === "WIN").length
      if (wins / valid.length > 0.5) complete("j5")
    }
  }

  if (changed) {
    saveMissions(missions)
    window.dispatchEvent(new Event("nba:missions-updated"))
    // Track first-time completion of each newly completed mission
    for (const m of missions) {
      if (m.completed && !localStorage.getItem(`nba:mission-tracked:${m.id}`)) {
        localStorage.setItem(`nba:mission-tracked:${m.id}`, "1")
        AnalyticsEvents.missionCompleted(m.id)
      }
    }
  }
}
