"use client"

interface SearchEntry {
  query: string
  tab: string
  timestamp: string
  resultCount: number
}

/**
 * Enregistre une recherche dans localStorage pour la mémoire contextuelle.
 * Utilisé par UsersTab et MembresTab.
 */
export function trackSearch(query: string, tab: string, resultCount: number): void {
  try {
    const stored = localStorage.getItem("admin-preferences")
    const prefs = stored ? JSON.parse(stored) : {}
    const searches: SearchEntry[] = (prefs.recentSearches || []).filter((s: SearchEntry) => s.query !== query)
    searches.unshift({ query, tab, timestamp: new Date().toISOString(), resultCount })
    prefs.recentSearches = searches.slice(0, 10)
    localStorage.setItem("admin-preferences", JSON.stringify(prefs))
  } catch {
    // localStorage may be full
  }
}
