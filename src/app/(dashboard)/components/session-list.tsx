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
                className="flex items-center justify-between rounded-lg border p-3"
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
                    <p className="text-sm font-medium truncate">
                      {session.userAgent
                        ? session.userAgent.split("/")[0] || "Appareil inconnu"
                        : "Appareil inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress ?? "IP inconnue"} · {new Date(session.createdAt).toLocaleDateString()}
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
