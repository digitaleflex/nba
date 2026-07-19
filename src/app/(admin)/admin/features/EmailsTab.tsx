"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, MailQuestion } from "lucide-react"
import { Card, Badge, cn, EmptyState } from "@nba/design-system"
import { CachedGet } from "./types"

interface EmailsTabProps {
  cachedGet: CachedGet
  opsData: any
}

export function EmailsTab({ cachedGet, opsData }: EmailsTabProps) {
  const [emails, setEmails] = useState<any[]>([])
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>("ALL")

  const fetchEmails = useCallback(async (status = "ALL") => {
    setLoadingEmails(true)
    try {
      const { ok, data } = await cachedGet(`/api/admin/emails?status=${status}`)
      if (ok) {
        setEmails(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEmails(false)
    }
  }, [cachedGet])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmails(emailStatusFilter)
  }, [emailStatusFilter, fetchEmails])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Suivi des e-mails</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Consultez l&apos;état de livraison des notifications envoyées aux utilisateurs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">E-mails envoyés</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.totalEmailsSent ?? 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">E-mails en échec</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.attention?.failedEmailsCount ?? 0}
          </p>
        </Card>
        <Card className="border-border bg-card/30 p-6 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Notifications envoyées</span>
          <p className="text-2xl font-bold text-foreground">
            {opsData?.stats?.totalNotificationsSent ?? 0}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "SENT", "FAILED", "BOUNCED"].map((s) => (
          <button
            key={s}
            onClick={() => setEmailStatusFilter(s)}
            className={cn(
              "text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
              emailStatusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {s === "ALL" ? "Tous" : s}
          </button>
        ))}
      </div>

      {loadingEmails ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : emails.length > 0 ? (
        <Card className="border-border bg-card/10">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Notification</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {emails.map((em) => (
                  <tr key={em.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{em.notification?.user?.name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{em.notification?.user?.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground/90 max-w-xs">
                      <p className="font-medium">{em.notification?.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{em.notification?.body}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] uppercase",
                          em.status === "PENDING" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          em.status === "SENT" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          (em.status === "FAILED" || em.status === "BOUNCED") && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}
                      >
                        {em.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(em.sentAt || em.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-rose-600 text-[10px] max-w-xs">
                      {em.errorMessage || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={MailQuestion}
          title="Aucun e-mail trouvé"
          description="Les e-mails envoyés aux membres apparaîtront ici."
          action={emailStatusFilter !== "ALL" ? { label: "Tous les e-mails", onClick: () => setEmailStatusFilter("ALL") } : undefined}
        />
      )}
    </div>
  )
}
