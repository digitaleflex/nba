"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Bell, X, Loader2 } from "lucide-react"
import { Button } from "@nba/design-system"

const SW_URL = "/sw.js"
const DISMISSED_KEY = "nba:push-prompt-dismissed"
const DISMISSED_RESHOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (!isNaN(elapsed) && elapsed < DISMISSED_RESHOW_MS) return
    }
    if (Notification.permission === "denied") return

    navigator.serviceWorker
      .getRegistration(SW_URL)
      .then((reg) => {
        if (reg) return reg.pushManager.getSubscription()
        return null
      })
      .then((sub) => {
        if (!sub) setVisible(true)
      })
      .catch(() => {})
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register(SW_URL)
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      if (perm !== "granted") {
        toast.error("Veuillez autoriser les notifications dans les paramètres de votre navigateur.")
        setLoading(false)
        return
      }

      let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        try {
          const r = await fetch("/api/push/vapid-key")
          if (r.ok) { const d = await r.json(); vapidKey = d.key }
        } catch {}
      }
      if (!vapidKey) {
        toast.error("Configuration des notifications incomplète.")
        setLoading(false)
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = sub.toJSON()
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      })

      if (res.ok) {
        toast.success("Notifications activées avec succès !")
        setVisible(false)
      } else {
        await sub.unsubscribe()
        toast.error("Échec de l'activation côté serveur.")
      }
    } catch (err) {
      console.error("Push subscription failed:", err)
      toast.error("Impossible d'activer les notifications.")
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Ne manquez aucun signal</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Activez les notifications push pour recevoir les signaux en temps réel, même lorsque l&apos;application est fermée.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" onClick={subscribe} disabled={loading}>
            {loading ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Bell className="size-3.5 mr-1" />}
            Activer les notifications
          </Button>
          <Button variant="ghost" size="sm" onClick={dismiss} disabled={loading}>
            Plus tard
          </Button>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
