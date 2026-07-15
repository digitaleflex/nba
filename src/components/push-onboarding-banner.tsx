"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2, X } from "lucide-react"
import { cn } from "@nba/design-system"

const SW_URL = "/sw.js"

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

export function PushOnboardingBanner() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [alreadyDismissed, setAlreadyDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || dismissed) return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setChecking(false)
      return
    }
    const wasDismissed = sessionStorage.getItem("push-dismissed-session")
    if (wasDismissed) {
      setAlreadyDismissed(true)
      setChecking(false)
      return
    }
    navigator.serviceWorker
      .getRegistration(SW_URL)
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => {
        if (sub) setSubscribed(true)
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [dismissed])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem("push-dismissed-session", "true")
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register(SW_URL)
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      if (perm !== "granted") {
        setLoading(false)
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error("VAPID public key not configured")
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
        setSubscribed(true)
        sessionStorage.removeItem("push-dismissed-session")
      } else {
        await sub.unsubscribe()
      }
    } catch (err) {
      console.error("Push subscription failed:", err)
    } finally {
      setLoading(false)
    }
  }

  if (checking || subscribed || dismissed || alreadyDismissed) return null

  return (
    <div
      className={cn(
        "relative rounded-xl border border-primary/20 bg-primary/5 p-4 pr-10",
        "animate-in slide-in-from-top-2 fade-in duration-300",
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="size-5 text-primary" />
        </div>
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Ne manquez aucun signal
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Activez les notifications push pour être alerté en temps réel
            dès qu&apos;un nouveau signal de trading est publié.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <BellOff className="size-3.5" />}
            {loading ? "Activation..." : "Activer les notifications"}
          </button>
        </div>
      </div>
    </div>
  )
}
