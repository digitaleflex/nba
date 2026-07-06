"use client"

import { useEffect, useState } from "react"
import { Button } from "@nba/design-system"
import { Bell, BellOff, Loader2 } from "lucide-react"

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

export function PushNotificationToggle({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false)
      return
    }
    setSupported(true)
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "default")

    // Vérifier si déjà abonné (silencieusement, ne pas faire crasher en mode privé)
    navigator.serviceWorker
      .getRegistration(SW_URL)
      .then((reg) => {
        if (reg) {
          return reg.pushManager.getSubscription()
        }
        return null
      })
      .then((sub) => {
        if (sub) setSubscribed(true)
      })
      .catch((err) => {
        // Mode privé ou restriction navigateur: on désactive silencieusement
        console.warn("Push check failed (private mode?):", err)
        setSupported(false)
      })
  }, [])

  async function subscribe() {
    if (!supported) return
    setLoading(true)
    try {
      // 1. Enregistrer le Service Worker
      const reg = await navigator.serviceWorker.register(SW_URL)
      await navigator.serviceWorker.ready

      // 2. Demander la permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") {
        setLoading(false)
        return
      }

      // 3. S'abonner au push
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

      // 4. Envoyer la subscription au serveur
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
      } else {
        await sub.unsubscribe()
      }
    } catch (err) {
      console.error("Push subscription failed:", err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL)
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error("Push unsubscribe failed:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  if (compact) {
    return (
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading || (!subscribed && permission === "denied")}
        type="button"
        title={
          subscribed 
            ? "Désactiver les notifications push" 
            : permission === "denied" 
              ? "Notifications push bloquées par le navigateur" 
              : "Activer les notifications push"
        }
        className={`p-2 rounded-lg border transition-all duration-200 ${
          subscribed
            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            : permission === "denied"
              ? "border-destructive/20 bg-destructive/5 text-destructive cursor-not-allowed opacity-50"
              : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : subscribed ? (
          <Bell className="size-4" />
        ) : (
          <BellOff className="size-4" />
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {subscribed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribe}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Bell className="size-4 mr-1" />}
          Notifications actives
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribe}
          disabled={loading || permission === "denied"}
        >
          {loading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <BellOff className="size-4 mr-1" />}
          {permission === "denied" ? "Notifications bloquées" : "Activer les notifications"}
        </Button>
      )}
    </div>
  )
}
