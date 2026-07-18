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
import { SignalTableClient } from "./signal-table-client"
import { UserTimeline } from "./user-timeline"
import { RetryButton } from "./retry-button"
import { TrackerTabs } from "./tracker-tabs"
import IORedis from "ioredis"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { cn } from "@nba/design-system"

const RECENT_SIGNALS = 12

interface UserSignalCompact {
  signalId: string
  signalTitle: string
  publishedAt: string
  plans: string
  plan: string
  emailBucket: string
  emailEvent: string | null
  pushStatus: string | null
  inAppRead: boolean
}

interface PerUser {
  email: string
  name: string
  externalId: string | null
  emailBucket: string
  emailEvent: string | null
  pushStatus: string | null
  inAppRead: boolean
  plan: string
}

interface SignalRow {
  id: string
  title: string
  content: string
  author: string
  publishedAt: Date | null
  plans: string
  planBreakdown: { name: string; count: number }[]
  hasImages: boolean
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

export default async function SignalTrackerPage({
  searchParams: sp,
}: {
  searchParams: Promise<{ q?: string; status?: string; range?: string }>
}) {
  const searchParams = await sp
  const query = searchParams.q?.toLowerCase() ?? ""
  const range = searchParams.range ?? "7d"
  const rangeMs = range === "24h" ? 24 * 60 * 60 * 1000
    : range === "7d" ? 7 * 24 * 60 * 60 * 1000
    : range === "30d" ? 30 * 24 * 60 * 60 * 1000
    : 0

  const where: any = { status: "PUBLISHED", deletedAt: null }
  if (query) {
    where.content = { contains: query, mode: "insensitive" }
  }
  if (rangeMs > 0) {
    where.publishedAt = { gte: new Date(Date.now() - rangeMs) }
  }

  const signals = await prisma.signal.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: RECENT_SIGNALS,
    select: {
      id: true,
      content: true,
      publishedAt: true,
      imageUrl: true,
      imageUrls: true,
      creator: { select: { name: true } },
      audience: {
        select: {
          plan: { select: { id: true, name: true } },
        },
      },
    },
  })

  // Worker health check
  let workerHealth = { signalWorker: "inconnu", notifWorker: "inconnu", pendingJobs: 0 }
  try {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      const r = new IORedis(redisUrl, { maxRetriesPerRequest: null } as any)
      const [sigMeta, notifMeta, pendingSig] = await Promise.all([
        r.hget("bull:signal-distribution:meta", "version").catch(() => null),
        r.hget("bull:notification-delivery:meta", "version").catch(() => null),
        r.zcard("bull:signal-distribution:wait").catch(() => 0),
      ])
      workerHealth = {
        signalWorker: sigMeta ? "actif" : "inactif",
        notifWorker: notifMeta ? "actif" : "inactif",
        pendingJobs: pendingSig,
      }
      await r.quit()
    }
  } catch {} // Redis indisponible, on ignore

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
        userId: true,
        user: { select: { id: true, email: true, name: true } },
        deliveries: { select: { channel: true, status: true, externalId: true } },
      },
    })

    const planIds = signal.audience.map((a: any) => a.plan.id ?? a.planId)
    const userIds = notifications.map((n) => n.userId)
    const accessRequests = userIds.length > 0
      ? await prisma.accessRequest.findMany({
          where: { userId: { in: userIds }, planId: { in: planIds }, status: "APPROVED" },
          select: { userId: true, plan: { select: { name: true } } },
        })
      : []
    const userPlanMap = new Map<string, string>()
    for (const ar of accessRequests) {
      if (!userPlanMap.has(ar.userId)) {
        userPlanMap.set(ar.userId, ar.plan.name)
      }
    }

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
        plan: userPlanMap.get(n.userId) || signal.audience.map((a: any) => a.plan.name).join(", "),
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

    const planCount = new Map<string, number>()
    for (const u of perUser) {
      planCount.set(u.plan, (planCount.get(u.plan) ?? 0) + 1)
    }
    const planBreakdown = signal.audience.map((a: any) => ({
      name: a.plan.name,
      count: planCount.get(a.plan.name) ?? 0,
    }))

    rows.push({
      id: signal.id,
      title: snippet(signal.content),
      content: signal.content,
      author: (signal as any).creator?.name || "Inconnu",
      publishedAt: signal.publishedAt,
      plans: signal.audience.map((a: any) => a.plan.name).join(", ") || "—",
      planBreakdown,
      hasImages: !!(signal as any).imageUrl || ((signal as any).imageUrls?.length ?? 0) > 0,
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

  const deliveryRate = totals.emailsSent > 0 ? Math.round((totals.delivered / totals.emailsSent) * 100) : 0
  const bounceRate = totals.emailsSent > 0 ? Math.round((totals.bounced / totals.emailsSent) * 100) : 0
  const openRate = totals.delivered > 0 ? Math.round((totals.opened / totals.delivered) * 100) : 0

  // Alerts
  const alerts: { type: "error" | "warning"; message: string }[] = []
  if (workerHealth.signalWorker === "inactif") alerts.push({ type: "error", message: "Le worker de distribution des signaux est inactif" })
  if (workerHealth.notifWorker === "inactif") alerts.push({ type: "error", message: "Le worker de notification est inactif" })
  if (bounceRate > 5) alerts.push({ type: "warning", message: `Taux de bounce élevé (${bounceRate} %) — vérifiez la qualité des emails` })
  if (workerHealth.pendingJobs > 10) alerts.push({ type: "warning", message: `${workerHealth.pendingJobs} jobs en attente dans la file signaux` })

  // Per-plan aggregate stats
  const planStats = new Map<string, { users: number; delivered: number; bounced: number; opened: number; sent: number }>()
  for (const row of rows) {
    for (const u of row.perUser) {
      if (!planStats.has(u.plan)) planStats.set(u.plan, { users: 0, delivered: 0, bounced: 0, opened: 0, sent: 0 })
      const s = planStats.get(u.plan)!
      s.users++
      if (u.emailBucket === "delivered") s.delivered++
      else if (u.emailBucket === "bounced") s.bounced++
      else if (u.emailBucket === "opened") s.opened++
      if (u.emailBucket !== "unknown" && u.emailBucket !== "pas d'email") s.sent++
    }
  }

  // Build per-user timeline data (aggregate all signals per user)
  const userMap = new Map<string, { id: string; name: string; email: string; signals: UserSignalCompact[] }>()
  for (const row of rows) {
    for (const u of row.perUser) {
      const key = u.email
      if (!userMap.has(key)) {
        userMap.set(key, { id: key, name: u.name, email: u.email, signals: [] })
      }
      userMap.get(key)!.signals.push({
        signalId: row.id,
        signalTitle: row.title,
        publishedAt: row.publishedAt?.toISOString() ?? "",
        plans: row.plans,
        plan: u.plan,
        emailBucket: u.emailBucket,
        emailEvent: u.emailEvent,
        pushStatus: u.pushStatus,
        inAppRead: u.inAppRead,
      })
    }
  }
  const users = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  async function handleRetryAll() {
    "use server"
    let count = 0
    try {
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) return { count: 0 }
      const r = new IORedis(redisUrl, { maxRetriesPerRequest: null } as any)
      const failed = await r.zrange("bull:signal-distribution:failed", 0, -1)
      count = failed.length
      for (const id of failed) {
        await r.zrem("bull:signal-distribution:failed", id)
        await r.zadd("bull:signal-distribution:wait", Date.now(), id)
        await r.hdel("bull:signal-distribution:" + id, "failedReason", "finishedOn", "processedOn", "stacktrace")
      }
      await r.quit()
    } catch {}
    revalidatePath("/admin/tracker")
    return { count }
  }

  return (
    <div className="space-y-6">
      {/* Header — always visible */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Tracker de délivrabilité</h1>
          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Temps réel
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LiveRefresh />
          </div>
        </div>
      </div>

      <TrackerTabs
        dashboard={
          <>
            {/* Worker Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <WorkerKpi label="Worker signaux" value={workerHealth.signalWorker} />
              <WorkerKpi label="Worker emails" value={workerHealth.notifWorker} />
              <WorkerKpi label="Jobs en attente" value={String(workerHealth.pendingJobs)} />
              <WorkerKpi label="Signaux analysés" value={String(rows.length)} />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-xs font-medium flex items-center gap-2",
                      a.type === "error"
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : "border-amber-500/30 bg-amber-500/5 text-amber-600",
                    )}
                  >
                    <span className={cn("size-2 rounded-full shrink-0", a.type === "error" ? "bg-destructive" : "bg-amber-500")} />
                    {a.message}
                  </div>
                ))}
              </div>
            )}

            {/* KPIs — top 4 toujours visibles, reste toggleable sur mobile */}
            <MobileKpis
              items={[
                { label: "Signaux", value: rows.length },
                { label: "Destinataires", value: totals.recipients },
                { label: "Délivrés", value: totals.delivered, tone: "success" },
                { label: "Taux délivrabilité", value: deliveryRate, suffix: "%", tone: deliveryRate >= 95 ? "success" : deliveryRate >= 80 ? "info" : "danger" },
                { label: "Taux d'ouverture", value: openRate, suffix: "%", tone: openRate >= 40 ? "success" : openRate >= 20 ? "info" : "danger" },
                { label: "Bounces", value: totals.bounced, tone: "danger" },
                { label: "Taux de bounce", value: bounceRate, suffix: "%", tone: bounceRate <= 2 ? "success" : bounceRate <= 5 ? "info" : "danger" },
                { label: "Plaintes", value: totals.complained, tone: "danger" },
                { label: "Emails envoyés", value: totals.emailsSent },
                { label: "Ouverts", value: totals.opened, tone: "info" },
                { label: "In-app lus", value: totals.inAppRead, tone: "info" },
                { label: "Push envoyés", value: totals.pushSent },
                { label: "Push échoués", value: totals.pushFailed, tone: "danger" },
              ]}
            />

            {/* Delivery funnel */}
            {totals.emailsSent > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Entonnoir de livraison</h3>
                <div className="space-y-2">
                  <FunnelBar label="Emails envoyés" value={totals.emailsSent} pct={100} color="bg-primary" />
                  <FunnelBar label="Délivrés" value={totals.delivered} pct={deliveryRate} color="bg-success" />
                  <FunnelBar label="Ouverts" value={totals.opened} pct={openRate} color="bg-info" />
                  <FunnelBar label="Bounces" value={totals.bounced} pct={bounceRate} color="bg-destructive" />
                </div>
              </div>
            )}

            {/* Per-plan summary */}
            {planStats.size > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <h3 className="text-sm font-semibold">Délivrabilité par plan</h3>
                </div>
                <div className="divide-y divide-border/50">
                  {Array.from(planStats.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([plan, s]) => {
                    const planDeliveryRate = s.sent > 0 ? Math.round((s.delivered / s.sent) * 100) : 0
                    return (
                      <div key={plan} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{plan}</div>
                          <div className="text-[10px] text-muted-foreground">{s.users} utilisateurs · {s.sent} emails</div>
                        </div>
                        <div className="flex items-center gap-3 text-xs tabular-nums">
                          <span className={cn("font-semibold", planDeliveryRate >= 95 ? "text-success" : planDeliveryRate >= 80 ? "text-info" : "text-destructive")}>
                            {planDeliveryRate}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", planDeliveryRate >= 95 ? "bg-success" : planDeliveryRate >= 80 ? "bg-info" : "bg-destructive")}
                              style={{ width: `${planDeliveryRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        }
        signals={
          <>
            {/* Filtres + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form className="flex items-center gap-2 flex-wrap">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Rechercher un signal..."
                  className="h-9 rounded-lg border border-border bg-background px-3 text-xs w-40 md:w-64 outline-none focus:border-primary"
                />
                <input type="hidden" name="range" value={range} />
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-medium hover:bg-primary/90"
                >
                  Filtrer
                </button>
                {(query || range !== "7d") && (
                  <Link
                    href="/admin/tracker"
                    className="h-9 rounded-lg border border-border px-3 text-xs flex items-center text-muted-foreground hover:text-foreground"
                  >
                    Réinitialiser
                  </Link>
                )}
              </form>
              <div className="flex items-center gap-1">
                {(["24h", "7d", "30d", "all"] as const).map((r) => {
                  const href = `/admin/tracker?range=${r}${query ? `&q=${encodeURIComponent(query)}` : ""}`
                  return (
                    <Link
                      key={r}
                      href={href}
                      className={cn(
                        "h-7 rounded-md px-2.5 text-[10px] font-medium flex items-center transition-colors",
                        range === r
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground border border-border",
                      )}
                    >
                      {r === "24h" ? "24h" : r === "7d" ? "7j" : r === "30d" ? "30j" : "Tout"}
                    </Link>
                  )
                })}
              </div>
              <RetryButton serverAction={handleRetryAll} />
            </div>

            {/* Tableau des signaux */}
            <SignalTableClient
              rows={rows.map((r) => ({
                ...r,
                publishedAt: r.publishedAt?.toISOString() ?? null,
              }))}
            />
          </>
        }
        timeline={
          <>
            <UserTimeline users={users} />
          </>
        }
      />
    </div>
  )
}

function Kpi({ label, value, tone, suffix }: { label: string; value: number; tone?: string; suffix?: string }) {
  const color =
    tone === "success" ? "text-success" : tone === "info" ? "text-info" : tone === "danger" ? "text-destructive" : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}{suffix ?? ""}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function FunnelBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden relative">
        <div className={`h-full rounded-md transition-all ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="w-16 text-right text-xs font-semibold tabular-nums">{value}</span>
      <span className="w-10 text-right text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  )
}


function WorkerKpi({ label, value }: { label: string; value: string }) {
  const ok = value === "actif"
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", ok ? "text-success" : "text-destructive")}>
        <span className={cn("h-2 w-2 rounded-full", ok ? "bg-success" : "bg-destructive")} />
        {value}
      </span>
    </div>
  )
}

function MobileKpis({ items }: {
  items: { label: string; value: number; tone?: string; suffix?: string }[]
}) {
  return (
    <>
      {/* Desktop: tout */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>
      {/* Mobile: top 4 + toggle */}
      <div className="md:hidden space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {items.slice(0, 4).map((k) => (
            <Kpi key={k.label} {...k} />
          ))}
        </div>
        <details className="group">
          <summary className="cursor-pointer text-xs text-primary font-medium hover:underline px-1 py-1">
            <span className="group-open:hidden">Voir tous les indicateurs ({items.length - 4} de plus)</span>
            <span className="hidden group-open:inline">Masquer les indicateurs</span>
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {items.slice(4).map((k) => (
              <Kpi key={k.label} {...k} />
            ))}
          </div>
        </details>
      </div>
    </>
  )
}
