import { prisma } from "@nba/lib/db"
import {
  getResendStatusMap,
  getLatestEventMap,
  classifyResendStatus,
  classifyByEventType,
  type ResendEmailStatus,
  type DeliveryBucket,
} from "@nba/lib/services/resend-delivery"
import { LiveRefresh } from "./live-refresh"

const RECENT_SIGNALS = 12

interface PerUser {
  email: string
  name: string
  externalId: string | null
  emailBucket: string
  emailEvent: string | null
  pushStatus: string | null
  inAppRead: boolean
}

interface SignalRow {
  id: string
  title: string
  publishedAt: Date | null
  plans: string
  recipients: number
  inAppRead: number
  emailsSent: number
  delivered: number
  bounced: number
  complained: number
  opened: number
  pending: number
  failed: number
  unknown: number
  pushSent: number
  pushFailed: number
  perUser: PerUser[]
}

function snippet(content: string): string {
  const text = content.replace(/[#*_`>\-]/g, " ").replace(/\s+/g, " ").trim()
  return text.length > 60 ? text.slice(0, 60) + "…" : text
}

export const dynamic = "force-dynamic"

export default async function SignalTrackerPage() {
  const signals = await prisma.signal.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: RECENT_SIGNALS,
    select: {
      id: true,
      content: true,
      publishedAt: true,
      audience: { select: { plan: { select: { name: true } } } },
    },
  })

  const rows: SignalRow[] = []
  const allExternalIds: string[] = []

  for (const signal of signals) {
    const notifications = await prisma.notification.findMany({
      where: {
        type: "SIGNAL",
        data: { path: ["signalId"], equals: signal.id },
      },
      select: {
        isRead: true,
        user: { select: { email: true, name: true } },
        deliveries: { select: { channel: true, status: true, externalId: true } },
      },
    })

    const perUser: PerUser[] = []
    for (const n of notifications) {
      const emailDelivery = n.deliveries.find((d) => d.channel === "EMAIL")
      const pushDelivery = n.deliveries.find((d) => d.channel === "PUSH")
      const externalId = emailDelivery?.externalId ?? null
      if (externalId) allExternalIds.push(externalId)
      perUser.push({
        email: n.user.email,
        name: n.user.name,
        externalId,
        emailBucket: "unknown",
        emailEvent: null,
        pushStatus: pushDelivery
          ? pushDelivery.status === "SENT"
            ? "envoyé"
            : pushDelivery.status === "FAILED"
              ? "échoué"
              : pushDelivery.status
          : null,
        inAppRead: n.isRead,
      })
    }

    const emailsSent = notifications.reduce(
      (s, n) => s + n.deliveries.filter((d) => d.channel === "EMAIL").length,
      0,
    )
    const pushSent = notifications.reduce(
      (s, n) => s + n.deliveries.filter((d) => d.channel === "PUSH" && d.status === "SENT").length,
      0,
    )
    const pushFailed = notifications.reduce(
      (s, n) => s + n.deliveries.filter((d) => d.channel === "PUSH" && d.status === "FAILED").length,
      0,
    )

    rows.push({
      id: signal.id,
      title: snippet(signal.content),
      publishedAt: signal.publishedAt,
      plans: signal.audience.map((a) => a.plan.name).join(", ") || "—",
      recipients: notifications.length,
      inAppRead: notifications.filter((n) => n.isRead).length,
      emailsSent,
      delivered: 0,
      bounced: 0,
      complained: 0,
      opened: 0,
      pending: 0,
      failed: 0,
      unknown: 0,
      pushSent,
      pushFailed,
      perUser,
    })
  }

  const eventMap = await getLatestEventMap(allExternalIds)
  const statusMap = await getResendStatusMap(allExternalIds)

  for (const row of rows) {
    for (const u of row.perUser) {
      let bucket: DeliveryBucket
      let event: string | null
      if (u.externalId && eventMap.has(u.externalId)) {
        const evt = eventMap.get(u.externalId)
        bucket = classifyByEventType(evt)
        event = evt ?? "en attente Resend"
      } else if (u.externalId) {
        const status: ResendEmailStatus | null = statusMap.get(u.externalId) ?? null
        bucket = classifyResendStatus(status)
        event = status?.last_event ?? "en attente Resend"
      } else {
        bucket = "unknown"
        event = "pas d'email"
      }
      u.emailBucket = bucket
      u.emailEvent = event
      row[bucket] = (row[bucket] ?? 0) + 1
    }
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.recipients += r.recipients
      acc.inAppRead += r.inAppRead
      acc.emailsSent += r.emailsSent
      acc.delivered += r.delivered
      acc.bounced += r.bounced
      acc.complained += r.complained
      acc.opened += r.opened
      acc.pushSent += r.pushSent
      acc.pushFailed += r.pushFailed
      return acc
    },
    { recipients: 0, inAppRead: 0, emailsSent: 0, delivered: 0, bounced: 0, complained: 0, opened: 0, pushSent: 0, pushFailed: 0 },
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Tracker de délivrabilité des signaux</h1>
          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Temps réel (webhooks)
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque signal publié est distribué à tous les membres des groupes ciblés via <b>email</b> +{" "}
          <b>notification in-app</b> + <b>push web</b>. Le statut email est suivi en temps réel via les
          webhooks Resend (ouverture, livraison, bounce, plainte). Les statuts push/in-app sont suivis
          à la distribution.
        </p>
        <div className="mt-2">
          <LiveRefresh />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi label="Signaux" value={rows.length} />
        <Kpi label="Destinataires" value={totals.recipients} />
        <Kpi label="In-app lus" value={totals.inAppRead} tone="info" />
        <Kpi label="Emails envoyés" value={totals.emailsSent} />
        <Kpi label="Délivrés" value={totals.delivered} tone="success" />
        <Kpi label="Ouverts" value={totals.opened} tone="info" />
        <Kpi label="Bounces" value={totals.bounced} tone="danger" />
        <Kpi label="Plaintes" value={totals.complained} tone="danger" />
        <Kpi label="Push envoyés" value={totals.pushSent} />
        <Kpi label="Push échoués" value={totals.pushFailed} tone="danger" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium">Signal</th>
                <th className="px-4 py-2.5 font-medium">Groupes</th>
                <th className="px-4 py-2.5 font-medium text-right">Dest.</th>
                <th className="px-4 py-2.5 font-medium text-right">In-app lus</th>
                <th className="px-4 py-2.5 font-medium text-right">Emails</th>
                <th className="px-4 py-2.5 font-medium text-right">Délivrés</th>
                <th className="px-4 py-2.5 font-medium text-right">Ouverts</th>
                <th className="px-4 py-2.5 font-medium text-right">Bounces</th>
                <th className="px-4 py-2.5 font-medium text-right">Plaintes</th>
                <th className="px-4 py-2.5 font-medium text-right">Push</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.publishedAt ? new Date(r.publishedAt).toLocaleString("fr-FR") : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.plans}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.recipients}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.inAppRead}/{r.recipients}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.emailsSent}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">{r.delivered}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-info">{r.opened}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{r.bounced}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{r.complained}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="text-success">{r.pushSent}</span>
                    {r.pushFailed > 0 && (
                      <span className="text-destructive"> / {r.pushFailed}</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun signal publié récemment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rows[0] && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="font-semibold">Détail par utilisateur — dernier signal</h2>
            <p className="text-xs text-muted-foreground">{rows[0].title}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium">Utilisateur</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Email (Resend)</th>
                  <th className="px-4 py-2.5 font-medium">Push web</th>
                  <th className="px-4 py-2.5 font-medium">In-app</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows[0].perUser.map((u, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">{u.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <BucketBadge bucket={u.emailBucket} event={u.emailEvent} />
                    </td>
                    <td className="px-4 py-2.5">
                      {u.pushStatus ? (
                        <span
                          className={
                            u.pushStatus === "envoyé"
                              ? "inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success"
                              : "inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
                          }
                        >
                          {u.pushStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.inAppRead ? (
                        <span className="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                          lu
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">non lu</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows[0].perUser.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Aucun destinataire pour ce signal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "success" | "info" | "danger" }) {
  const color =
    tone === "success" ? "text-success" : tone === "info" ? "text-info" : tone === "danger" ? "text-destructive" : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function BucketBadge({ bucket, event }: { bucket: string; event: string | null }) {
  const map: Record<string, string> = {
    delivered: "bg-success/10 text-success",
    opened: "bg-info/10 text-info",
    bounced: "bg-destructive/10 text-destructive",
    complained: "bg-destructive/10 text-destructive",
    pending: "bg-amber-500/10 text-amber-600",
    failed: "bg-destructive/10 text-destructive",
    unknown: "bg-muted text-muted-foreground",
  }
  const cls = map[bucket] ?? map.unknown
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{event ?? bucket}</span>
}
