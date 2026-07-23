"use client"

import { useState, useCallback } from "react"

interface SearchEntry {
  query: string
  tab: string
  timestamp: string
  resultCount: number
}

interface WatchedUser {
  userId: string
  name: string
  email: string
  addedAt: string
  lastChecked: string
  alertCount: number
}

interface DashboardLayout {
  cards: string[]
  heroMetric: string
}

export interface AdminPreferences {
  favoriteTabs: string[]
  recentSearches: SearchEntry[]
  watchedUsers: WatchedUser[]
  dashboardLayout: DashboardLayout | null
  lastVisited: Record<string, string>
  theme: "light" | "dark" | "auto"
}

const DEFAULT_PREFS: AdminPreferences = {
  favoriteTabs: ["dashboard", "fraud", "users"],
  recentSearches: [],
  watchedUsers: [],
  dashboardLayout: null,
  lastVisited: {},
  theme: "auto",
}

function loadPrefs(): AdminPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const stored = localStorage.getItem("admin-preferences")
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: AdminPreferences) {
  try {
    localStorage.setItem("admin-preferences", JSON.stringify(prefs))
  } catch {
    // localStorage may be full
  }
}

export function useAdminPreferences() {
  const [prefs, setPrefs] = useState<AdminPreferences>(loadPrefs)

  const updatePrefs = useCallback((partial: Partial<AdminPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial }
      savePrefs(next)
      return next
    })
  }, [])

  const trackSearch = useCallback((query: string, tab: string, resultCount: number) => {
    setPrefs((prev) => {
      const searches = prev.recentSearches.filter((s) => s.query !== query)
      searches.unshift({ query, tab, timestamp: new Date().toISOString(), resultCount })
      const next = { ...prev, recentSearches: searches.slice(0, 10) }
      savePrefs(next)
      return next
    })
  }, [])

  const addWatchedUser = useCallback((user: { userId: string; name: string; email: string }) => {
    setPrefs((prev) => {
      const exists = prev.watchedUsers.some((u) => u.userId === user.userId)
      if (exists) return prev
      const watched: WatchedUser = {
        ...user,
        addedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        alertCount: 0,
      }
      const next = { ...prev, watchedUsers: [watched, ...prev.watchedUsers].slice(0, 20) }
      savePrefs(next)
      return next
    })
  }, [])

  const removeWatchedUser = useCallback((userId: string) => {
    setPrefs((prev) => {
      const next = { ...prev, watchedUsers: prev.watchedUsers.filter((u) => u.userId !== userId) }
      savePrefs(next)
      return next
    })
  }, [])

  return { prefs, updatePrefs, trackSearch, addWatchedUser, removeWatchedUser }
}
