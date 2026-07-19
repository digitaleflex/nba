"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, MailQuestion } from "lucide-react"
import { authClient } from "@nba/lib/auth-client"
import { useNotificationSound } from "@nba/lib/hooks/use-notification-sound"
import { Card, CardContent, Input, Button, EmptyState } from "@nba/design-system"
import { CachedGet } from "./types"

interface NotificationsTabProps {
  cachedGet: CachedGet
  invalidate: () => void
}

export function NotificationsTab({ cachedGet, invalidate }: NotificationsTabProps) {
  const { data: currentSession } = authClient.useSession()
  const { play: playNotifSound } = useNotificationSound()

  const [notifTitle, setNotifTitle] = useState("")
  const [notifContent, setNotifContent] = useState("")
  const [sendingNotif, setSendingNotif] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [notifHistory, setNotifHistory] = useState<any[]>([])
  const [loadingNotifHistory, setLoadingNotifHistory] = useState(false)

  const fetchNotifHistory = useCallback(async () => {
    setLoadingNotifHistory(true)
    try {
      const { ok, data } = await cachedGet("/api/admin/notifications")
      if (ok) {
        setNotifHistory(data.notifications || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNotifHistory(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifHistory()
  }, [fetchNotifHistory])

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifContent.trim()) return
    setSendingNotif(true)
    invalidate()
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, content: notifContent }),
      })
      if (res.ok) {
        setNotifTitle("")
        setNotifContent("")
        toast.success("Notification diffusée à tous les utilisateurs")
        fetchNotifHistory()
      } else {
        toast.error("Erreur lors de la diffusion")
      }
    } catch (err) {
      toast.error("Erreur réseau")
      console.error(err)
    } finally {
      setSendingNotif(false)
    }
  }

  const handleTestNotification = async () => {
    if (!notifTitle.trim() || !notifContent.trim() || !currentSession?.user?.id) return
    setSendingTest(true)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, content: notifContent, userId: currentSession.user.id }),
      })
      if (res.ok) {
        playNotifSound()
        toast.success("Notification de test envoyée")
      } else {
        toast.error("Erreur lors du test")
      }
    } catch (err) {
      toast.error("Erreur réseau")
      console.error(err)
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gérez l&apos;envoi de messages d&apos;information internes.
          </p>
        </div>
      </div>

      <Card id="notif-compose" className="border-border bg-card/30 max-w-lg scroll-mt-6">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rédiger une notification système</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Titre</label>
              <Input
                placeholder="Alerte système..."
                className="bg-background border-border text-xs text-foreground"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Contenu</label>
              <textarea
                placeholder="Votre message..."
                className="w-full p-3 rounded-lg border bg-background border-border text-xs text-foreground focus:outline-none focus:border-primary/50 min-h-24"
                value={notifContent}
                onChange={(e) => setNotifContent(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={handleTestNotification}
                disabled={sendingTest || !notifTitle.trim() || !notifContent.trim() || !currentSession?.user?.id}
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Test...
                  </>
                ) : (
                  "Tester"
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={handleSendNotification}
                disabled={sendingNotif || !notifTitle.trim() || !notifContent.trim()}
              >
                {sendingNotif ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Diffuser"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des notifications */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historique des notifications</h3>
        {loadingNotifHistory ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : notifHistory.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {notifHistory.map((notif) => (
              <Card key={notif.id} className="border-border bg-card/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{notif.title}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{notif.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MailQuestion}
            title="Aucune notification envoyée"
            description="Rédigez et diffusez un message aux membres depuis le formulaire ci-dessus."
            shortcut="N"
            action={{ label: "Rédiger une notification", onClick: () => document.getElementById("notif-compose")?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
          />
        )}
      </div>
    </div>
  )
}
