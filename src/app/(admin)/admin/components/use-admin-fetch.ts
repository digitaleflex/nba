"use client"

import { useState, useEffect, useCallback } from "react"

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export type CachedGet = (url: string, ttlMs?: number) => Promise<{ ok: boolean; data: any }>

export function useAdminFetch<T = any>(
  fetchUrl: string | null,
  cachedGet: CachedGet,
  options: { ttlMs?: number; autoRefreshMs?: number } = {},
) {
  const { ttlMs, autoRefreshMs } = options
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null })

  const fetchData = useCallback(async () => {
    if (!fetchUrl) return
    setState((prev) => ({ ...prev, loading: true }))
    const res = await cachedGet(fetchUrl, ttlMs)
    if (res.ok) {
      setState({ data: res.data as T, loading: false, error: null })
    } else {
      setState({ data: null, loading: false, error: res.data?.error ?? "Erreur de chargement" })
    }
  }, [fetchUrl, cachedGet, ttlMs])

  useEffect(() => {
    fetchData()
    if (autoRefreshMs && autoRefreshMs > 0) {
      const id = setInterval(fetchData, autoRefreshMs)
      return () => clearInterval(id)
    }
  }, [fetchData, autoRefreshMs])

  return { ...state, refetch: fetchData }
}
