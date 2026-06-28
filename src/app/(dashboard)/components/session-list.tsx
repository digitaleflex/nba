"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, Button, Badge } from "@nba/design-system"
import { Smartphone, Monitor, X, Trash2 } from "lucide-react"

interface Session {
  id: string
  userAgent?: string
  ipAddress?: string
  createdAt: string
  expiresAt: string
}

function getFriendlyDeviceName(ua?: string): string {
  if (!ua) return "Appareil inconnu"
  const uaLower = ua.toLowerCase()
  
  let browser = ""
  if (uaLower.includes("firefox")) browser = "Firefox"
  else if (uaLower.includes("edg/")) browser = "Edge"
  else if (uaLower.includes("chrome") && !uaLower.includes("chromium")) browser = "Chrome"
  else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari"
  else if (uaLower.includes("chromium")) browser = "Chromium"
  else browser = ua.split("/")[0] || "Navigateur"

  let os = ""
  if (uaLower.includes("iphone")) os = "iPhone"
  else if (uaLower.includes("ipad")) os = "iPad"
  else if (uaLower.includes("android")) os = "Android"
  else if (uaLower.includes("windows")) os = "Windows"
  else if (uaLower.includes("macintosh")) os = "Mac"
  else if (uaLower.includes("linux")) os = "Linux"

  if (os && browser) {
    return `${browser} (${os})`
  }
  return browser || os || "Appareil inconnu"
}

function getFriendlyIp(ip?: string): string {
  if (!ip) return "IP inconnue"
  const cleanIp = ip.trim()
  if (
    cleanIp === "::1" || 
    cleanIp === "127.0.0.1" || 
    cleanIp === "::" ||
    /^0+:0+:0+:0+:0+:0+:0+:[0-9a-fA-F]$/.test(cleanIp) ||
    /^0+:0+:0+:0+:0+:0+:0+:0$/.test(cleanIp)
  ) {
    return "Machine locale"
  }
  return cleanIp
}

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  async function revokeSession(id: string) {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" })
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardContent className="pt-6">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <CardContent className="pt-6 space-y-4">
        <h2 className="text-lg font-semibold">Sessions actives ({sessions.length})</h2>
        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune session active</p>
        )}
        <div className="space-y-2">
          {sessions.map((session) => {
            const isMobile = /mobile|android|iphone/i.test(session.userAgent ?? "")
            return (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border p-3 bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {isMobile ? (
                      <Smartphone className="size-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {getFriendlyDeviceName(session.userAgent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFriendlyIp(session.ipAddress)} · {new Date(session.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
