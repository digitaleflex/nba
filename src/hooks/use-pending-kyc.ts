"use client"

import { useState, useEffect } from "react"

export function usePendingKyc(enabled: boolean) {
  const [pendingKyc, setPendingKyc] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetch("/api/admin/kyc?status=PENDING", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.total != null) setPendingKyc(d.total)
        else if (Array.isArray(d?.docs)) setPendingKyc(d.docs.length)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [enabled])

  return pendingKyc
}
