"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type PushSubscriptionState =
  | "unsupported"
  | "ios-install"
  | "needs-permission"
  | "denied"
  | "needs-repair"
  | "active"

export interface UsePushSubscriptionResult {
  state: PushSubscriptionState
  subscription: PushSubscription | null
  enable: () => Promise<void>
  repair: () => Promise<void>
  disable: () => Promise<void>
  sendTest: () => Promise<{ sent: number; failed: number; devices: number; reason?: string } | null>
  recheck: () => Promise<void>
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia?.("(display-mode: standalone)").matches === true || (navigator as any).standalone === true
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function usePushSubscription(): UsePushSubscriptionResult {
  const [state, setState] = useState<PushSubscriptionState>("needs-permission")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const vapidKeyRef = useRef<string | null>(null)

  const getVapidKey = useCallback(async (): Promise<string | null> => {
    if (vapidKeyRef.current) return vapidKeyRef.current
    const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (envKey) {
      vapidKeyRef.current = envKey
      return envKey
    }
    try {
      const res = await fetch("/api/push/vapid-key")
      if (!res.ok) return null
      const data = await res.json()
      vapidKeyRef.current = data?.key ?? data?.publicKey ?? null
      return vapidKeyRef.current
    } catch {
      return null
    }
  }, [])

  const checkServerRegistered = useCallback(async (endpoint: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/push/status?endpoint=${encodeURIComponent(endpoint)}`)
      if (!res.ok) return false
      const data = await res.json()
      return !!data.registered
    } catch {
      return false
    }
  }, [])

  const computeState = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) {
      setState("unsupported")
      return
    }
    if (isIOS() && !isStandalone()) {
      setState("ios-install")
      return
    }
    const perm = Notification.permission
    if (perm === "default") {
      setState("needs-permission")
      return
    }
    if (perm === "denied") {
      setState("denied")
      return
    }
    // granted : vérifier l'abonnement local
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js")
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (!sub) {
        setState("needs-repair")
        // réabonnement automatique silencieux
        void repairSilent()
        return
      }
      setSubscription(sub)
      const registered = await checkServerRegistered(sub.endpoint)
      if (!registered) {
        setState("needs-repair")
        void repairSilent()
        return
      }
      setState("active")
    } catch {
      setState("needs-repair")
    }
  }, [])

  const repairSilent = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const key = await getVapidKey()
      if (!key) return
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      })
      setSubscription(sub)
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: (sub as any).toJSON?.().keys?.p256dh, auth: (sub as any).toJSON?.().keys?.auth }, userAgent: navigator.userAgent }),
      })
      setState("active")
    } catch {
      // silencieux
    }
  }, [getVapidKey])

  const enable = useCallback(async () => {
    // Ordre obligatoire : permission AVANT tout await.
    const perm = await Notification.requestPermission()
    if (perm !== "granted") {
      setState("denied")
      return
    }
    const reg = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready
    const key = await getVapidKey()
    if (!key) {
      setState("needs-repair")
      return
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    })
    setSubscription(sub)
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: (sub as any).toJSON?.().keys ?? {},
        userAgent: navigator.userAgent,
      }),
    })
    setState("active")
  }, [getVapidKey])

  const repair = useCallback(async () => {
    await repairSilent()
  }, [repairSilent])

  const disable = useCallback(async () => {
    try {
      const sub = (subscription ?? (await navigator.serviceWorker.getRegistration("/sw.js"))?.pushManager?.getSubscription()) as PushSubscription | undefined
      if (sub) {
        await sub.unsubscribe()
        await fetch("/api/push/unsubscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
    } catch {
      // silencieux
    }
    setSubscription(null)
    setState("needs-permission")
  }, [subscription])

  const sendTest = useCallback(async () => {
    try {
      const res = await fetch("/api/push/test", { method: "POST" })
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const recheck = useCallback(async () => {
    await computeState()
  }, [computeState])

  useEffect(() => {
    void computeState()
    const onVisibility = () => {
      if (document.visibilityState === "visible") void computeState()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [computeState])

  return { state, subscription, enable, repair, disable, sendTest, recheck }
}
