import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getCached } from "@nba/lib/cache"

/**
 * Centre de contrôle admin : données temps réel pour le monitoring opérationnel.
 * Cache serveur court (5s) pour absorber le polling client sans surcharger la DB.
 */
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const data = await getCached(
      "control-room",
      async () => {
        const now = new Date()
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Requêtes parallèles
        const [
          activeMembers,
          membersWithOverride,
          signalsLast24h,
          signalsLast7d,
          notificationsLast7d,
          emailsSentLast7d,
          recentEmailEvents,
          clicksLast7d,
          topClickLinks,
          pushSentLast24h,
          pushFailedLast24h,
          pushSubsCount,
          recentSignals,
          bouncedLast24h,
          complainedLast24h,
        ] = await Promise.all([
          prisma.user.count({ where: { isActive: true, deletedAt: null } }),
          prisma.user.count({ where: { signalsAccessOverride: true } }),
          prisma.signal.count({ where: { status: "PUBLISHED", publishedAt: { gte: last24h } } }),
          prisma.signal.count({ where: { status: "PUBLISHED", publishedAt: { gte: last7d } } }),
          prisma.notification.count({ where: { type: "SIGNAL", createdAt: { gte: last7d } } }),
          prisma.notificationDelivery.count({
            where: { channel: "EMAIL", status: "SENT", createdAt: { gte: last7d } },
          }),
          prisma.emailEvent.findMany({
            where: { createdAt: { gte: last7d } },
            orderBy: { createdAt: "desc" },
            take: 40,
            select: { type: true, externalId: true, createdAt: true },
          }),
          prisma.emailEvent.count({ where: { type: "email.clicked", createdAt: { gte: last7d } } }),
          prisma.emailEvent.groupBy({
            by: ["clickLink"],
            where: { type: "email.clicked", createdAt: { gte: last7d }, clickLink: { not: null } },
            _count: true,
            orderBy: { _count: { clickLink: "desc" } },
            take: 5,
          }),
          prisma.notificationDelivery.count({
            where: { channel: "PUSH", status: "SENT", createdAt: { gte: last24h } },
          }),
          prisma.notificationDelivery.count({
            where: { channel: "PUSH", status: "FAILED", createdAt: { gte: last24h } },
          }),
          prisma.pushSubscription.count(),
          prisma.signal.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            take: 8,
            select: {
              id: true,
              content: true,
              publishedAt: true,
              createdBy: true,
              audience: { select: { plan: { select: { name: true } } } },
            },
          }),
          prisma.emailEvent.count({ where: { type: "email.bounced", createdAt: { gte: last24h } } }),
          prisma.emailEvent.count({ where: { type: "email.complained", createdAt: { gte: last24h } } }),
        ])

        // Funnel email sur 7j
        const delivered = recentEmailEvents.filter((e) => e.type === "email.delivered").length
        const opened = recentEmailEvents.filter((e) => e.type === "email.opened").length
        const bounced = recentEmailEvents.filter((e) => e.type === "email.bounced").length
        const complained = recentEmailEvents.filter((e) => e.type === "email.complained").length

        // Live feed : signaux publiés + événements email récents
        type FeedItem = {
          kind: "signal" | "email_delivered" | "email_opened" | "email_bounced" | "email_complained"
          at: string
          title: string
          detail: string
          status: "ok" | "warn" | "danger"
        }
        const feed: FeedItem[] = []

        for (const s of recentSignals) {
          if (!s.publishedAt) continue
          const plans = s.audience.map((a) => a.plan.name).join(", ") || "—"
          feed.push({
            kind: "signal",
            at: s.publishedAt.toISOString(),
            title: "Signal publié",
            detail: `${plans} • ${s.content.slice(0, 60)}`,
            status: "ok",
          })
        }
        for (const e of recentEmailEvents.slice(0, 20)) {
          const map: Record<string, { title: string; status: FeedItem["status"] }> = {
            "email.delivered": { title: "Email délivré", status: "ok" },
            "email.opened": { title: "Email ouvert", status: "ok" },
            "email.clicked": { title: "Lien cliqué", status: "ok" },
            "email.bounced": { title: "Email rejeté (bounce)", status: "danger" },
            "email.complained": { title: "Plainte email", status: "danger" },
            "email.sent": { title: "Email envoyé", status: "ok" },
            "email.failed": { title: "Échec d'envoi", status: "danger" },
          }
          const m = map[e.type]
          if (!m) continue
          feed.push({
            kind: e.type.replace("email.", "email_") as FeedItem["kind"],
            at: e.createdAt.toISOString(),
            title: m.title,
            detail: e.externalId,
            status: m.status,
          })
        }
        feed.sort((a, b) => (a.at < b.at ? 1 : -1))
        const liveFeed = feed.slice(0, 20)

        // Santé système
        let redisHealthy = false
        try {
          const { default: Redis } = await import("ioredis")
          const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
            connectTimeout: 3000,
            maxRetriesPerRequest: 0,
            lazyConnect: true,
          })
          await redis.connect()
          redisHealthy = (await redis.ping()) === "PONG"
          await redis.quit()
        } catch {
          redisHealthy = false
        }
        const webhookConfigured = !!process.env.RESEND_WEBHOOK_SECRET
        let storageHealthy = false
        try {
          const fs = await import("fs")
          const f = "./storage/.healthcheck"
          fs.writeFileSync(f, "ok")
          fs.unlinkSync(f)
          storageHealthy = true
        } catch {
          storageHealthy = false
        }

        // Alertes
        const alerts: { level: "warn" | "danger"; message: string }[] = []
        if (bouncedLast24h > 0) {
          alerts.push({ level: "danger", message: `${bouncedLast24h} bounce(s) email sur 24h` })
        }
        if (complainedLast24h > 0) {
          alerts.push({ level: "danger", message: `${complainedLast24h} plainte(s) email sur 24h` })
        }
        if (pushFailedLast24h > 0) {
          alerts.push({
            level: "warn",
            message: `${pushFailedLast24h} push web échoué(s) sur 24h`,
          })
        }
        if (!webhookConfigured) {
          alerts.push({
            level: "warn",
            message: "RESEND_WEBHOOK_SECRET non configuré (tracking email en fallback)",
          })
        }
        if (!redisHealthy) {
          alerts.push({ level: "danger", message: "Redis injoignable" })
        }

        return {
          kpis: {
            activeMembers,
            membersWithOverride,
            signalsLast24h,
            signalsLast7d,
            emailsSentLast7d,
            delivered,
            opened,
            bounced,
            complained,
            openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
            clicks: clicksLast7d,
            ctr: delivered > 0 ? Math.round((clicksLast7d / delivered) * 100) : 0,
            topClickLinks: topClickLinks
              .filter((t) => t.clickLink)
              .map((t) => ({ link: t.clickLink as string, count: t._count })),
            pushSentLast24h,
            pushFailedLast24h,
            pushSubsCount,
          },
          funnel: {
            signals: signalsLast7d,
            recipients: notificationsLast7d,
            emailsSent: emailsSentLast7d,
            delivered,
            opened,
            clicked: clicksLast7d,
            bounced,
            complained,
          },
          liveFeed,
          systemHealth: {
            redis: redisHealthy ? "healthy" : "error",
            webhook: webhookConfigured ? "healthy" : "warning",
            storage: storageHealthy ? "healthy" : "warning",
            pushSubs: pushSubsCount,
          },
          alerts,
        }
      },
      5, // TTL court pour quasi temps réel
    )

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
