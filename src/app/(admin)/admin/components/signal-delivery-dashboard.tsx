"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Badge, cn } from "@nba/design-system"
import { useSocket } from "@nba/lib/hooks/use-socket"
import { InfoTooltip } from "./info-tooltip"

interface ChannelStat {
  channel: string
  sent: number
  failed: number
  pending: number
  bounced: number
}

interface FailedDelivery {
  channel: string
  userEmail: string | null
  userName: string | null
  errorMessage: string | null
  sentAt: string | null
}

interface DeliveryReport {
  signalId: string
  recipientCount: number
  totalDeliveries: number
  sent: number
  failed: number
  pending: number
  bounced: number
  byChannel: ChannelStat[]
  failures: FailedDelivery[]
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  PUSH: "Push",
}

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-500",
  PUSH: "bg-violet-500",
}

export function SignalDeliveryDashboard({ signalId }: { signalId: string }) {
  const [report, setReport] = useState<DeliveryReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const { subscribe, status } = useSocket()

  const fetchReport = useCallback(
    async (isLive = false) => {
      try {
        setLoading(true)
        setError(null)
        if (isLive) setLive(true)
        const res = await fetch(`/api/admin/signals/${signalId}/delivery`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Erreur ${res.status}`)
        }
        const data = (await res.json()) as DeliveryReport
        setReport(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    },
    [signalId],
  )

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  useEffect(() => {
    const off = subscribe<{ signalId?: string; type?: string }>("signal", (payload) => {
      if (payload?.type === "delivery_update" && payload.signalId !== signalId) return
      if (payload?.signalId && payload.signalId !== signalId) return
      fetchReport(true)
    })
    return off
  }, [subscribe, signalId, fetchReport])

  if (loading && !report) {
    return (
      <div className="rounded-xl border bg-neutral-50 dark:bg-neutral-900/40 p-4 text-xs text-muted-foreground">
        Chargement de la diffusion…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
        {error}
      </div>
    )
  }

  if (!report) return null

  const total = report.sent + report.failed + report.pending + report.bounced
  const successRate = total > 0 ? Math.round((report.sent / total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-semibold">
          Diffusion en temps réel
          <InfoTooltip content="Tableau de bord live de l'envoi du signal vers chaque membre (email, push). Il se met à jour automatiquement à chaque accusé de réception ou d'échec renvoyé par les prestataires." />
        </span>
        <span className="flex items-center gap-1.5 text-[10px]">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              status === "connected" ? "bg-emerald-400 animate-pulse" : "bg-neutral-500",
            )}
          />
          {live ? "Mis à jour en direct" : status === "connected" ? "En direct" : "Hors ligne"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Metric
          label="Destinataires"
          value={report.recipientCount}
          tip="Nombre de membres ciblés par ce signal (selon les groupes d'abonnement associés)."
        />
        <Metric
          label="Délivrés"
          value={report.sent}
          tone="ok"
          tip="Notifications confirmées comme bien arrivées chez le membre (email délivré, push accepté, etc.)."
        />
        <Metric
          label="Échecs"
          value={report.failed + report.bounced}
          tone={report.failed + report.bounced > 0 ? "bad" : "ok"}
          tip="Envois rejetés ou signalés : 'FAILED' = erreur d'envoi (boîte mail invalide, quota), 'BOUNCED' = email rejeté par le serveur destinataire ou marqué spam."
        />
        <Metric
          label="En attente"
          value={report.pending}
          tone="warn"
          tip="Notifications encore en cours de traitement (pas encore accusées de réception ni d'échec)."
        />
      </div>

      <div className="space-y-2">
        {report.byChannel.map((c) => {
          const sum = c.sent + c.failed + c.pending + c.bounced
          if (sum === 0) return null
          const pct = Math.round((c.sent / sum) * 100)
          return (
            <div key={c.channel} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  {CHANNEL_LABELS[c.channel] || c.channel}
                  <InfoTooltip
                    side="left"
                  content={
                    {
                      EMAIL: "Email envoyé via Resend. Le statut passe en 'délivré' quand le serveur du membre accepte le message.",
                      PUSH: "Notification push navigateur/web (webhook interne). Échoue si le membre n'a pas autorisé les notifications.",
                    }[c.channel] || "Canal de notification."
                  }
                  />
                </span>
                <span className="text-muted-foreground">
                  {c.sent}/{sum} ·{" "}
                  {c.failed + c.bounced > 0 && (
                    <span className="text-rose-400">{c.failed + c.bounced} échec</span>
                  )}
                  {(c.failed + c.bounced > 0) && c.pending > 0 && " · "}
                  {c.pending > 0 && <span className="text-amber-400">{c.pending} att</span>}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500", CHANNEL_COLORS[c.channel] || "bg-neutral-500")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {successRate < 100 && total > 0 && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          Taux de délivrance : <span className="text-foreground font-semibold">{successRate}%</span>
          <InfoTooltip content="Pourcentage de notifications arrivées avec succès par rapport au total envoyé (délivrés ÷ total). Un taux < 100% indique des échecs à investiguer dans la section ci-dessous." />
        </p>
      )}

      {report.failures.length > 0 && (
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-semibold">
            Échecs de livraison {report.failures.length >= 50 ? "(50 premiers)" : ""}
            <InfoTooltip content="Liste des envois en erreur, avec l'email du membre et le motif renvoyé par le prestataire. Sert au support pour relancer ou corriger un abonnement." />
          </span>
          <div className="max-h-40 overflow-y-auto rounded-xl border divide-y">
            {report.failures.map((f, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2 text-[11px]">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {f.userName || f.userEmail || "Inconnu"}
                  </p>
                  <p className="truncate text-muted-foreground">{f.userEmail}</p>
                  {f.errorMessage && (
                    <p className="truncate text-rose-400/80">{f.errorMessage}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0",
                    f.channel === "EMAIL" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    f.channel === "PUSH" && "bg-violet-500/10 text-violet-400 border-violet-500/20",
                  )}
                >
                  {CHANNEL_LABELS[f.channel] || f.channel}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  tone = "neutral",
  tip,
}: {
  label: string
  value: number
  tone?: "neutral" | "ok" | "bad" | "warn"
  tip?: string
}) {
  return (
    <div className="rounded-xl border bg-neutral-50 dark:bg-neutral-900/40 p-2 text-center">
      <p
        className={cn(
          "text-base font-bold",
          tone === "ok" && "text-emerald-400",
          tone === "bad" && "text-rose-400",
          tone === "warn" && "text-amber-400",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="flex items-center justify-center gap-1 text-[9px] uppercase text-muted-foreground mt-0.5">
        {label}
        {tip && <InfoTooltip content={tip} />}
      </p>
    </div>
  )
}
