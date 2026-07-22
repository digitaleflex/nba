"use client"

import { useState } from "react"
import { Loader2, MailQuestion } from "lucide-react"
import { Card, Badge, cn, EmptyState } from "@nba/design-system"
import { useAdminFetch } from "../components/use-admin-fetch"
import { FilterPills } from "../components/filter-pills"
import { CachedGet } from "./types"

const EMAIL_FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "SENT", label: "Envoyés" },
  { value: "FAILED", label: "En échec" },
  { value: "BOUNCED", label: "Rejetés" },
]

interface EmailsTabProps {
  cachedGet: CachedGet
  opsData: any
}

export function EmailsTab({ cachedGet, opsData }: EmailsTabProps) {
  const [emailStatusFilter, setEmailStatusFilter] = useState("ALL")
  const { data: emailsData, loading: loadingEmails } = useAdminFetch<any[]>(
    `/api/admin/emails?status=${emailStatusFilter}`,
    cachedGet,
  )
  const emails = emailsData ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Suivi des e-mails</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Consultez l&apos;état de livraison des notifications envoyées aux utilisateurs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">E-mails envoyés</span>
            <p className="text-2xl font-bold text-foreground">
              {opsData?.stats?.totalEmailsSent ?? 0}
            </p>
          </div>
        </Card>
        <Card className="border-border/60 bg-card shadow-sm">
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">E-mails en échec</span>
            <p className="text-2xl font-bold text-foreground">
              {opsData?.attention?.failedEmailsCount ?? 0}
            </p>
          </div>
        </Card>
        <Card className="border-border/60 bg-card shadow-sm">
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Notifications envoyées</span>
            <p className="text-2xl font-bold text-foreground">
              {opsData?.stats?.totalNotificationsSent ?? 0}
            </p>
          </div>
        </Card>
      </div>

      <FilterPills options={EMAIL_FILTERS} active={emailStatusFilter} onChange={setEmailStatusFilter} />

      {loadingEmails ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : emails.length > 0 ? (
        <Card className="border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Notification</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
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
