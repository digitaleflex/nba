"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, Badge, Button } from "@nba/design-system"
import { Bell, Loader2, Info, CheckCheck, Clock, Volume2, Save } from "lucide-react"
import { PushNotificationToggle } from "@nba/components/push-notification-toggle"
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

const SOUNDS = [
  { id: "default", label: "Classique" },
  { id: "chime", label: "Douce" },
  { id: "urgent", label: "Urgente" },
  { id: "signal", label: "Signal" },
  { id: "pop", label: "Pop" },
] as const

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

function playSound(soundId: string) {
  const audio = new Audio(`/sounds/${soundId}.wav`)
  audio.volume = 0.5
  audio.play().catch(() => {})
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSound, setSelectedSound] = useState("default")
  const [soundLoaded, setSoundLoaded] = useState(false)
  const [soundSaved, setSoundSaved] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/notification-preferences")
      .then((r) => r.json())
      .then((data) => {
        setSelectedSound(data.sound)
        setSoundLoaded(true)
      })
      .catch(() => setSoundLoaded(true))
  }, [])

  async function saveSound() {
    try {
      await fetch("/api/dashboard/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sound: selectedSound }),
      })
      setSoundSaved(true)
      setTimeout(() => setSoundSaved(false), 2000)
    } catch {}
  }

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
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
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
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Tout est à jour"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationToggle />
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="size-4 mr-1.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Son de notification */}
      {soundLoaded && (
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Son de notification</h2>
              </div>
              <Button
                variant={soundSaved ? "default" : "outline"}
                size="sm"
                onClick={saveSound}
                disabled={soundSaved}
              >
                <Save className="size-3.5 mr-1.5" />
                {soundSaved ? "Enregistré" : "Enregistrer"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSound(s.id)
                    playSound(s.id)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    selectedSound === s.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Volume2 className="size-3" />
                  {s.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              role="button"
              tabIndex={0}
              className={`relative overflow-hidden transition-colors cursor-pointer hover:bg-muted/30 ${
                !n.readAt ? "border-primary/20 bg-primary/[0.02]" : ""
              }`}
              onClick={() => !n.readAt && markAsRead(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (!n.readAt) markAsRead(n.id)
                }
              }}
              aria-label={`${n.title} - ${!n.readAt ? "Non lue" : "Lue"}`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                {!n.readAt && (
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" aria-label="Non lue" />
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
