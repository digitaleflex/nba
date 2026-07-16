"use client"

import { useEffect, useState } from "react"
import { BellRing, Loader2, X, Volume2, Zap, ShieldAlert, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from "@nba/design-system"

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
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    setPermission(Notification.permission)

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

      if (Notification.permission === "denied") {
        setLoading(false)
        return
      }

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") {
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
        ) : permission === "denied" ? (
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto size-14 rounded-full bg-amber-500/10 flex items-center justify-center ring-4 ring-amber-500/20">
              <ShieldAlert className="size-7 text-amber-500" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Notifications bloquées</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Vous avez déjà refusé les notifications pour ce site.
                Pas d&apos;inquiétude, vous pouvez les réactiver en 3 étapes&nbsp;:
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 text-left space-y-3">
              <div className="flex items-start gap-3">
                <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div className="text-xs text-muted-foreground space-y-1 min-w-0">
                  <p className="font-medium text-foreground">Repérez l&apos;icône dans la barre d&apos;adresse</p>
                  <div className="flex items-center gap-1.5 bg-background rounded-lg border border-border px-3 py-2 text-[11px] font-mono">
                    <span className="size-3.5 flex items-center justify-center text-[10px]">🔒</span>
                    <span className="text-muted-foreground">https://</span>
                    <span className="text-foreground">access.signauxx.com</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div className="text-xs text-muted-foreground space-y-1 min-w-0">
                  <p className="font-medium text-foreground">Cliquez dessus et ouvrez les paramètres du site</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-background border border-border px-2.5 py-1 text-[10px]">
                      Notifications <span className="text-destructive">Bloquées</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-background border border-border px-2.5 py-1 text-[10px]">
                      → <span className="text-emerald-600 font-medium">Autoriser</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div className="text-xs text-muted-foreground space-y-1 min-w-0">
                  <p className="font-medium text-foreground">Rechargez la page pour appliquer</p>
                  <p className="text-[10px]">Cliquez sur le bouton ci-dessous une fois le paramètre modifié.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShow(false)}
                className="flex-1 h-10 text-xs"
              >
                Plus tard
              </Button>
              <Button
                size="sm"
                className="flex-1 h-10 text-xs gap-1.5"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="size-3.5" /> Recharger la page
              </Button>
            </div>
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