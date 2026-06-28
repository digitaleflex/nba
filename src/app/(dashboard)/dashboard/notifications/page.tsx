"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { Bell, Loader2, Info, CheckCheck, Clock } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  readAt: string | null
  linkUrl: string | null
  createdAt: string
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/notifications")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/dashboard/notifications/${id}`, { method: "PUT" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.readAt)
    await Promise.all(unread.map((n) => markAsRead(n.id)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Info className="size-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Tout est à jour"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="size-4 mr-1.5" />
            Tout marquer lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="size-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Aucune notification</p>
              <p className="text-sm text-muted-foreground">
                Vous recevrez des notifications lors de la publication de nouveaux signaux.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`relative overflow-hidden transition-colors cursor-pointer hover:bg-muted/30 ${
                !n.readAt ? "border-primary/20 bg-primary/[0.02]" : ""
              }`}
              onClick={() => !n.readAt && markAsRead(n.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                {!n.readAt && (
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${!n.readAt ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      className="text-xs text-primary mt-1 inline-block hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Voir le détail
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
