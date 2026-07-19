"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, Button } from "@nba/design-system"
import {
  BellOff,
  BellRing,
  Loader2,
  Info,
  CheckCheck,
  Clock,
  Volume2,
  Save,
  VolumeX,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  PartyPopper,
  TestTube2,
  Trash2,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { useNotificationSound } from "@nba/lib/hooks/use-notification-sound"
import { NOTIFICATION_SOUNDS } from "@nba/lib/notification-sounds"

interface Notification {
  id: string
  title: string
  body: string
  type: string
  readAt: string | null
  linkUrl: string | null
  createdAt: string
  data?: {
    signalId?: string
    imageUrl?: string | null
    imageUrls?: string[] | null
  } | null
}

function getThumbnail(n: Notification): string | null {
  if (!n.data) return null
  if (n.data.imageUrl) return `/api/files/${n.data.imageUrl}`
  if (Array.isArray(n.data.imageUrls) && n.data.imageUrls.length > 0) {
    return `/api/files/${n.data.imageUrls[0]}`
  }
  return null
}

const VOLUME_KEY = "nba-notification-volume"

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
  const { play: playSound, changeVolume: changeVolumeNofit, changeSound } = useNotificationSound()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(1)

  const [selectedSound, setSelectedSound] = useState("default")
  const [volume, setVolume] = useState(0.5)
  const [soundLoaded, setSoundLoaded] = useState(false)
  const [soundSaved, setSoundSaved] = useState(false)
  const [soundError, setSoundError] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)

  const [permStatus, setPermStatus] = useState<NotificationPermission | "unsupported" | "unknown">("unknown")
  const [requestingPerm, setRequestingPerm] = useState(false)
  const [testRunning, setTestRunning] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/notification-preferences")
      .then((r) => { if (!r.ok) throw new Error("Erreur"); return r.json() })
      .then((data) => {
        setSelectedSound(data.sound)
        setPrefs(data.prefs || {})
        setSoundLoaded(true)
        setPrefsLoaded(true)
      })
      .catch(() => { setSoundLoaded(true); setPrefsLoaded(true) })

    const savedVolume = localStorage.getItem(VOLUME_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedVolume) setVolume(parseFloat(savedVolume))

    if (typeof window === "undefined") return
    if (typeof Notification === "undefined") {
      setPermStatus("unsupported")
    } else {
      setPermStatus(Notification.permission)
    }
  }, [])

  function changeVolume(v: number) {
    setVolume(v)
    changeVolumeNofit(v)
  }

  async function saveSound() {
    setSoundError(false)
    try {
      const res = await fetch("/api/dashboard/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sound: selectedSound }),
      })
      if (!res.ok) {
        setSoundError(true)
        return
      }
      setSoundSaved(true)
      // Applique le son en direct (sinon le hook reste sur l'ancienne valeur jusqu'au reload)
      changeSound(selectedSound)
      setTimeout(() => setSoundSaved(false), 2000)
    } catch {
      setSoundError(true)
    }
  }

  function togglePref(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !(prev[key] !== false) }))
  }

  async function savePrefs() {
    setPrefsSaving(true)
    try {
      const res = await fetch("/api/dashboard/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      })
      if (!res.ok) throw new Error("failed")
    } catch {
      // silent
    } finally {
      setPrefsSaving(false)
    }
  }

  async function requestPerm() {
    if (typeof Notification === "undefined") return
    setRequestingPerm(true)
    try {
      const perm = await Notification.requestPermission()
      setPermStatus(perm)
    } catch {} finally {
      setRequestingPerm(false)
    }
  }

  async function testNotification() {
    setTestRunning(true)
    playSound(selectedSound)
    setTimeout(() => {
      try {
        if (typeof Notification === "undefined") return
        if (Notification.permission === "granted") {
          const n = new Notification("🔔 Notification de test", {
            body: "Si vous voyez ceci, les notifications fonctionnent parfaitement !",
            icon: "/icon.png",
            badge: "/icons/icon-192x192.png",
            tag: "test-notification",
          })
          setTimeout(() => n.close(), 6000)
        }
      } catch {
        // silencieux
      } finally {
        setTimeout(() => setTestRunning(false), 1000)
      }
    }, 100)
  }

  function testSoundOnly() {
    playSound(selectedSound)
  }

  const fetchNotifications = useCallback(async (loadMore = false) => {
    try {
      const nextPage = loadMore ? pageRef.current + 1 : 1
      const res = await fetch(`/api/dashboard/notifications?page=${nextPage}&limit=10`)
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      const notifications = Array.isArray(data.notifications) ? data.notifications : []
      if (loadMore) {
        setNotifications((prev) => [...prev, ...notifications])
      } else {
        setNotifications(notifications)
      }
      pageRef.current = nextPage
      setHasMore(nextPage < (data.pagination?.totalPages ?? 0))
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/notifications?page=${pageRef.current}&limit=10`)
      if (!res.ok) return
      const data = await res.json()
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setHasMore(pageRef.current < (data.pagination?.totalPages ?? 0))
      setUnreadCount(data.unreadCount ?? 0)
    } catch { /* silent refresh */ }
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    await fetchNotifications(true)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(refreshNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, refreshNotifications])

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
    try {
      const res = await fetch("/api/dashboard/notifications/read-all", { method: "PUT" })
      if (!res.ok) return
      const { count } = await res.json()
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
      )
      setUnreadCount((prev) => Math.max(0, prev - (count ?? prev)))
    } catch {}
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`/api/dashboard/notifications/${id}`, { method: "DELETE" })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setUnreadCount((prev) => Math.max(0, prev - (notifications.find((n) => n.id === id)?.readAt ? 0 : 1)))
    } catch {}
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

  // Permission status config
  const permConfig = {
    granted: {
      icon: ShieldCheck,
      title: "Notifications autorisées",
      desc: "Votre navigateur affichera les notifications système.",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
      pulse: false,
    },
    denied: {
      icon: ShieldX,
      title: "Notifications bloquées",
      desc: "Les notifications sont désactivées dans les paramètres de votre navigateur.",
      color: "text-destructive",
      bg: "bg-destructive/5 border-destructive/20",
      pulse: false,
    },
    default: {
      icon: ShieldAlert,
      title: "Autorisation requise",
      desc: "Activez les notifications pour ne rien manquer.",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
      pulse: true,
    },
    unsupported: {
      icon: BellOff,
      title: "Non supporté",
      desc: "Votre navigateur ne supporte pas les notifications système.",
      color: "text-muted-foreground",
      bg: "bg-muted/50 border-border",
      pulse: false,
    },
    unknown: {
      icon: ShieldAlert,
      title: "Chargement...",
      desc: "Vérification des permissions en cours.",
      color: "text-muted-foreground",
      bg: "bg-muted/50 border-border",
      pulse: false,
    },
  }[permStatus]

  const PermIcon = permConfig.icon

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
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="size-4 mr-1.5" />
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* ── Autorisation navigateur (section cool) ── */}
      <Card className={`border ${permConfig.bg}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className={`size-12 rounded-xl flex items-center justify-center ${permConfig.bg} border`}>
                <PermIcon className={`size-6 ${permConfig.color} ${permConfig.pulse ? "animate-pulse" : ""}`} />
              </div>
              {permConfig.pulse && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full size-3 bg-amber-500" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold ${permConfig.color}`}>
                {permConfig.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {permConfig.desc}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {permStatus === "default" && (
                  <Button size="sm" onClick={requestPerm} disabled={requestingPerm}>
                    {requestingPerm ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <BellRing className="size-3.5 mr-1.5" />}
                    Autoriser les notifications
                  </Button>
                )}
                {permStatus === "granted" && (
                  <>
                    <Button size="sm" variant="outline" onClick={testNotification} disabled={testRunning}>
                      {testRunning ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <TestTube2 className="size-3.5 mr-1.5" />}
                      Tester une notification
                    </Button>
                    <Button size="sm" variant="ghost" onClick={testSoundOnly}>
                      <Volume2 className="size-3.5 mr-1.5" />
                      Tester le son
                    </Button>
                  </>
                )}
                {permStatus === "denied" && (
                  <p className="text-xs text-muted-foreground">
                    Pour réactiver : icône 🔒 dans la barre d&apos;adresse → Notifications → Autoriser
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Son de notification ── */}
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

            {soundError && (
              <p className="text-xs text-destructive mt-2">
                Échec de l'enregistrement. Réessayez.
              </p>
            )}

            {/* Volume slider */}
            <div className="mb-5 flex items-center gap-3">
              <button
                onClick={() => changeVolume(volume === 0 ? 0.5 : 0)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground shrink-0"
                title={volume === 0 ? "Activer le son" : "Couper le son"}
              >
                {volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="flex-1 accent-primary h-1.5"
                aria-label="Volume des notifications"
              />
              <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                {Math.round(volume * 100)}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {NOTIFICATION_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSound(s.id)
                    playSound(s.id)
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                    selectedSound === s.id
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Volume2 className="size-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[10px] opacity-70 truncate">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Préférences par type ── */}
      {prefsLoaded && (
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Types de notifications</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={savePrefs}
                disabled={prefsSaving}
              >
                <Save className="size-3.5 mr-1.5" />
                {prefsSaving ? "..." : "Enregistrer"}
              </Button>
            </div>
            <div className="space-y-0.5">
              {[
                { key: "signal", label: "Signaux", desc: "Nouveaux signaux de trading publiés" },
                { key: "kyc", label: "KYC", desc: "Validation de vos documents d'identité" },
                { key: "broker", label: "Broker", desc: "Validation de votre compte broker" },
                { key: "access", label: "Abonnement", desc: "Changements de votre abonnement" },
                { key: "security", label: "Sécurité", desc: "Connexions, changements de mot de passe" },
                { key: "system", label: "Annonces", desc: "Messages de l'équipe NeverBrokeAgain" },
                { key: "message", label: "Messages", desc: "Nouveaux messages de la communauté" },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="min-w-0 mr-3">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                  <div
                    role="switch"
                    aria-checked={prefs[key] !== false}
                    tabIndex={0}
                    onClick={() => togglePref(key)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePref(key) } }}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary ${
                      prefs[key] !== false ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg transform ring-0 transition-transform duration-200 ${
                        prefs[key] !== false ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <PartyPopper className="size-10 text-muted-foreground" />
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
          {notifications.map((n) => {
            const thumb = getThumbnail(n)
            return (
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
                  {thumb && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/60 bg-muted shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {n.linkUrl && (
                        <Link
                          href={n.linkUrl}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir le détail
                        </Link>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(n.id)
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Chargement...</>
                ) : (
                  <><ChevronDown className="size-3.5 mr-1.5" /> Voir plus</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
