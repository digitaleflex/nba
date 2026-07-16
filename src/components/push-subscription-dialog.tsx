"use client"

import { useEffect, useState } from "react"
import { BellRing, Loader2, X, Volume2, Zap } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, cn } from "@nba/design-system"

const SW_URL = "/sw.js"
const STORAGE_KEY = "nba-push-dialog-seen"

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

export function PushSubscriptionDialog() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    if (Notification.permission === "denied") return

    // Déjà abonné ? On ne montre rien.
    navigator.serviceWorker
      .getRegistration(SW_URL)
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => {
        if (sub) return
        const seen = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
        const count = parseInt(localStorage.getItem("nba-visit-count") || "0", 10)
        const nextVisit = parseInt(localStorage.getItem("nba-push-next-visit") || "0", 10)
        const newCount = count + 1
        localStorage.setItem("nba-visit-count", String(newCount))

        // Affiche au 3e chargement, puis tous les 5 chargements suivants
        if (seen < 2 && newCount >= 3) {
          setShow(true)
          localStorage.setItem(STORAGE_KEY, String(seen + 1))
          localStorage.setItem("nba-push-next-visit", String(newCount + 5))
        } else if (newCount >= nextVisit && seen >= 2) {
          setShow(true)
          localStorage.setItem(STORAGE_KEY, String(seen + 1))
          localStorage.setItem("nba-push-next-visit", String(newCount + 5))
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubscribe() {
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

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        toast.error("Configuration des notifications incomplète (clé VAPID manquante).")
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
        setDone(true)
        setTimeout(() => setShow(false), 2000)
      } else {
        await sub.unsubscribe()
        toast.error("Échec de l&apos;activation côté serveur. Veuillez réessayer.")
      }
    } catch (err) {
      console.error("Push subscription failed:", err)
      toast.error("Impossible d&apos;activer les notifications. Vérifiez que votre navigateur supporte les notifications push.")
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <Dialog open={show} onOpenChange={(o) => { if (!o) setShow(false) }}>
      <DialogContent
        className="!max-w-sm p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Activer les notifications</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto size-14 rounded-full bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/20">
              <BellRing className="size-7 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-foreground">Notifications activées !</p>
            <p className="text-xs text-muted-foreground">
              Vous serez alerté dès qu&apos;un nouveau signal est publié.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer z-10"
            >
              <X className="size-4" />
            </button>

            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center border-b border-border/30">
              <div className="mx-auto size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <BellRing className="size-6 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">
                Ne manquez aucun signal
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Recevez une notification instantanée sur votre téléphone dès qu&apos;un
                signal de trading est publié.
              </p>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-start gap-2.5">
                <Zap className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-muted-foreground">Alertes en temps réel, même écran verrouillé</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Volume2 className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-muted-foreground">Son et vibration pour ne rien rater</span>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full mt-3 h-11 text-sm font-semibold gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Activation...
                  </>
                ) : (
                  <>
                    <BellRing className="size-4" /> Activer les alertes
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground/50 text-center">
                Vous pourrez les désactiver à tout moment dans les paramètres.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}