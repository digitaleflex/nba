"use client"

import { useState, useCallback, useEffect } from "react"

export interface CardConfig {
  id: string
  type: "hero" | "kpi" | "alerts" | "graph" | "timeline" | "health"
  visible: boolean
  order: number
  size: "small" | "medium" | "large"
}

export interface DashboardLayout {
  cards: CardConfig[]
  heroMetric: string
  theme: "light" | "dark" | "auto"
  compactMode: boolean
}

const DEFAULT_LAYOUT: DashboardLayout = {
  cards: [
    { id: "hero", type: "hero", visible: true, order: 0, size: "large" },
    { id: "kpi", type: "kpi", visible: true, order: 1, size: "medium" },
    { id: "alerts", type: "alerts", visible: true, order: 2, size: "medium" },
    { id: "graph", type: "graph", visible: true, order: 3, size: "medium" },
    { id: "timeline", type: "timeline", visible: true, order: 4, size: "small" },
    { id: "health", type: "health", visible: true, order: 5, size: "small" },
  ],
  heroMetric: "alerts",
  theme: "auto",
  compactMode: false,
}

function loadLayout(): DashboardLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT
  try {
    const stored = localStorage.getItem("admin-dashboard-layout")
    return stored ? { ...DEFAULT_LAYOUT, ...JSON.parse(stored) } : DEFAULT_LAYOUT
  } catch {
    return DEFAULT_LAYOUT
  }
}

function saveLayout(layout: DashboardLayout) {
  try {
    localStorage.setItem("admin-dashboard-layout", JSON.stringify(layout))
  } catch {
    // ignore
  }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(loadLayout)

  const updateLayout = useCallback((partial: Partial<DashboardLayout>) => {
    setLayout((prev) => {
      const next = { ...prev, ...partial }
      saveLayout(next)
      return next
    })
  }, [])

  const toggleCard = useCallback((cardId: string) => {
    setLayout((prev) => {
      const cards = prev.cards.map((c) =>
        c.id === cardId ? { ...c, visible: !c.visible } : c
      )
      const next = { ...prev, cards }
      saveLayout(next)
      return next
    })
  }, [])

  const reorderCards = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      const cards = [...prev.cards]
      const [moved] = cards.splice(fromIndex, 1)
      cards.splice(toIndex, 0, moved)
      const reindexed = cards.map((c, i) => ({ ...c, order: i }))
      const next = { ...prev, cards: reindexed }
      saveLayout(next)
      return next
    })
  }, [])

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
    saveLayout(DEFAULT_LAYOUT)
  }, [])

  // Apply auto theme
  useEffect(() => {
    if (layout.theme !== "auto") {
      document.documentElement.classList.toggle("dark", layout.theme === "dark")
      return
    }
    const apply = () => {
      const hour = new Date().getHours()
      const isDark = hour < 7 || hour >= 19
      document.documentElement.classList.toggle("dark", isDark)
    }
    apply()
    const id = setInterval(apply, 3600000)
    return () => clearInterval(id)
  }, [layout.theme])

  return { layout, updateLayout, toggleCard, reorderCards, resetLayout }
}
