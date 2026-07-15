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

export default async function SignalTrackerPage({
  searchParams: sp,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const searchParams = await sp
  const query = searchParams.q?.toLowerCase() ?? ""
  const filterStatus = searchParams.status ?? ""

  const where: any = { status: "PUBLISHED", deletedAt: null }
  if (query) {
    where.content = { contains: query, mode: "insensitive" }
  }

  const signals = await prisma.signal.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: RECENT_SIGNALS,
    select: {
      id: true,
      content: true,
      publishedAt: true,
      audience: { select: { plan: { select: { name: true } } } },
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

  const statusCounts = {
    all: rows.length,
    delivered: rows.reduce((a, r) => a + r.delivered, 0),
    bounced: rows.reduce((a, r) => a + r.bounced, 0),
    pending: rows.reduce((a, r) => a + r.pending, 0),
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
    try {
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) return
      const r = new IORedis(redisUrl, { maxRetriesPerRequest: null } as any)
      const failed = await r.zrange("bull:signal-distribution:failed", 0, -1)
      for (const id of failed) {
        await r.zrem("bull:signal-distribution:failed", id)
        await r.zadd("bull:signal-distribution:wait", Date.now(), id)
        await r.hdel("bull:signal-distribution:" + id, "failedReason", "finishedOn", "processedOn", "stacktrace")
      }
      await r.quit()
    } catch {}
    revalidatePath("/admin/tracker")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Worker Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <WorkerKpi label="Worker signaux" value={workerHealth.signalWorker} />
        <WorkerKpi label="Worker emails" value={workerHealth.notifWorker} />
        <WorkerKpi label="Jobs en attente" value={String(workerHealth.pendingJobs)} />
        <WorkerKpi label="Signaux analysés" value={String(rows.length)} />
      </div>

      {/* Filtres + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Rechercher un signal..."
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs w-40 md:w-64 outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-medium hover:bg-primary/90"
          >
            Filtrer
          </button>
          {query && (
            <Link
              href="/admin/tracker"
              className="h-9 rounded-lg border border-border px-3 text-xs flex items-center text-muted-foreground hover:text-foreground"
            >
              Réinitialiser
            </Link>
          )}
        </form>
        <form action={handleRetryAll}>
          <button
            type="submit"
            className="h-9 rounded-lg border border-amber-500/30 text-amber-600 bg-amber-500/5 px-4 text-xs font-medium hover:bg-amber-500/10"
          >
            Re-tenter les jobs échoués
          </button>
        </form>
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

      {/* Tableau des signaux (cliquable — cliquer sur une ligne pour voir le détail par utilisateur) */}
      <SignalTableClient
        rows={rows.map((r) => ({
          ...r,
          publishedAt: r.publishedAt?.toISOString() ?? null,
        }))}
      />

      {/* Timeline individuelle par utilisateur */}
      <UserTimeline users={users} />
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
