"use client"

import { useState, useCallback, useEffect } from "react"

interface SystemAlertData {
  id: string
  severity: "critical" | "warning"
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

interface TabNotification {
  tab: string
  count: number
  severity: "info" | "warning" | "critical"
}

export function useNotifications() {
  const [alerts, setAlerts] = useState<SystemAlertData[]>([])
  const [tabNotifications, setTabNotifications] = useState<TabNotification[]>([])

  const addAlert = useCallback((alert: SystemAlertData) => {
    setAlerts((prev) => [...prev, alert])
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const setTabBadge = useCallback((tab: string, count: number, severity: "info" | "warning" | "critical") => {
    setTabNotifications((prev) => {
      const existing = prev.findIndex((n) => n.tab === tab)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { tab, count, severity }
        return next
      }
      return [...prev, { tab, count, severity }]
    })
  }, [])

  // Poll for system alerts every 15s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/security/fraud/health")
        const data = await res.json()
        if (data.activeAlerts > 0) {
          setTabBadge("fraud", data.activeAlerts, data.status === "healthy" ? "info" : "warning")
        }
      } catch {
        // ignore
      }
    }
    poll()
    const id = setInterval(poll, 15000)
    return () => clearInterval(id)
  }, [setTabBadge])

  return {
    alerts,
    tabNotifications,
    addAlert,
    dismissAlert,
    setTabBadge,
  }
}
