"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const DRAFT_PREFIX = "nba_draft_"

export function getDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${key}`)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch { return null }
}

export function useFormDraft<T extends Record<string, unknown>>(
  key: string | null | undefined,
  data: T,
  debounceMs = 1000,
) {
  const storageKey = key ? `${DRAFT_PREFIX}${key}` : null
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevRef = useRef<string>("")

  const save = useCallback(() => {
    if (!storageKey) return
    try {
      const payload = JSON.stringify(data)
      if (payload === prevRef.current) return
      localStorage.setItem(storageKey, payload)
      prevRef.current = payload
      setSavedAt(Date.now())
    } catch { /* silent (quota exceeded, etc.) */ }
  }, [data, storageKey])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [save, debounceMs])

  const clear = useCallback(() => {
    try { if (storageKey) localStorage.removeItem(storageKey) } catch { /* silent */ }
    setSavedAt(null)
    prevRef.current = ""
  }, [storageKey])

  return { clear, savedAt }
}
