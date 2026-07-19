"use client"

import { useState, useEffect } from "react"

export function usePendingAccessRequests(enabled: boolean) {
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetch("/api/admin/access-requests?status=PENDING", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.total != null) setPendingRequests(d.total)
        else if (Array.isArray(d?.requests)) setPendingRequests(d.requests.length)
        else if (Array.isArray(d)) setPendingRequests(d.length)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [enabled])

  return pendingRequests
}
