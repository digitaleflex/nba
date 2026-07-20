"use client"

const STORAGE_KEY = "nba_onboarding_state"

export function useOnboardingPersistence() {
  const save = (step: string, data: unknown) => {
    try {
      const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}")
      existing[step] = data
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch { /* silent */ }
  }

  const restore = <T = unknown>(step: string): T | null => {
    try {
      const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}")
      return (existing[step] as T) ?? null
    } catch { return null }
  }

  const clear = () => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* silent */ }
  }

  return { save, restore, clear }
}
