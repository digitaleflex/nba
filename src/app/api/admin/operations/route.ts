import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { getCached, getStats as getCacheStats } from "@nba/lib/cache"
import { getAllCircuitStates } from "@nba/lib/circuit-breaker"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const data = await getCached(
      "ops",
      async () => {
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Toutes les requêtes DB en un seul batch parallèle
    const [
      kycPendingCount,
      brokerPendingCount,
      requestsPendingCount,
      nextScheduledSignal,
      failedEmailsCount,
      totalMembers,
      publishedSignalsCount,
      approvedKycCount,
      totalEmailsSent,
      totalNotificationsSent,
      recentActivities,
      registrations,
      approved,
      allSignals,
    ] = await Promise.all([
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
      prisma.brokerVerification.count({ where: { status: "PENDING" } }),
      prisma.accessRequest.count({ where: { status: "PENDING" } }),
      prisma.signal.findFirst({
        where: {
          status: "DRAFT",
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          content: true,
          scheduledAt: true,
        },
      }),
      prisma.notificationDelivery.count({
        where: {
          status: { in: ["FAILED", "BOUNCED"] },
          channel: "EMAIL",
        },
      }),
      prisma.user.count(),
      prisma.signal.count({ where: { status: "PUBLISHED" } }),
      prisma.kycDocument.count({ where: { status: "APPROVED" } }),
      prisma.notificationDelivery.count({ where: { channel: "EMAIL", status: "SENT" } }),
      prisma.notification.count(),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.user.groupBy({
        by: ["createdAt"],
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.accessRequest.findMany({
        where: { status: "APPROVED" },
        select: {
          userId: true,
          reviewedAt: true,
          plan: { select: { id: true, name: true, price: true, currency: true, durationDays: true } },
        },
      }),
      prisma.signal.findMany({
        where: { status: "PUBLISHED" },
        select: { createdAt: true },
      }),
    ])

    // Membres actifs & MRR
    const nowMs = Date.now()
    const uniqueMembers = new Set<string>()
    const uniqueActive = new Set<string>()
    const uniqueAtRisk = new Set<string>()
    let mrr = 0
    let atRiskMrr = 0

    for (const a of approved) {
      uniqueMembers.add(a.userId)
      const price = Number(a.plan.price)
      const durationMonths = Math.max(a.plan.durationDays, 1) / 30
      const m = price / durationMonths
      mrr += m
      if (a.reviewedAt && nowMs < a.reviewedAt.getTime() + a.plan.durationDays * 86400000) {
        uniqueActive.add(a.userId)
      } else {
        uniqueAtRisk.add(a.userId)
        atRiskMrr += m
      }
    }

    // Signaux publiés par jour (7j) pour sparkline
    const signalsByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return allSignals.filter(s => new Date(s.createdAt).toDateString() === d.toDateString()).length
    }).reverse()

    // Évolution MRR jour par jour sur 7j (agrégation des approuvés)
    const mrrByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return approved
        .filter(a => a.reviewedAt && new Date(a.reviewedAt).toDateString() === d.toDateString())
        .reduce((sum, a) => sum + Number(a.plan.price) / Math.max(a.plan.durationDays, 1) / 30, 0)
    }).reverse()

    // Aggrégation par jour pour le graphe
    const dailyRegistrations = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString("fr-FR", { weekday: "short" })
      const dateKey = d.toDateString()

      // Trouver le nombre d'inscriptions pour ce jour
      const count = registrations.filter(
        (r) => new Date(r.createdAt).toDateString() === dateKey
      ).length

      return { day: dayStr, count }
    }).reverse()

    // 5. Statuts de santé des services de l'infrastructure
    // Test Redis
    let redisHealthy = false
    try {
      const { default: Redis } = await import("ioredis")
      const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        connectTimeout: 3000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
      })
      await redis.connect()
      const pong = await redis.ping()
      redisHealthy = pong === "PONG"
      await redis.quit()
    } catch {
      redisHealthy = false
    }

    // Test storage (check if storage directory is writable)
    let storageHealthy = false
    try {
      const fs = await import("fs")
      const testFile = "./storage/.healthcheck"
      fs.writeFileSync(testFile, "ok")
      fs.unlinkSync(testFile)
      storageHealthy = true
    } catch {
      storageHealthy = false
    }

    // SMTP: check if config exists (can't test without sending)
    const smtpHealthy = !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST)

    return {
      attention: {
        kycPendingCount,
        brokerPendingCount,
        requestsPendingCount,
        nextScheduledSignal,
        failedEmailsCount,
      },
      stats: {
        totalMembers,
        activeMembers: uniqueActive.size,
        activeSubscriptions: uniqueActive.size,
        publishedSignalsCount,
        approvedKycCount,
        totalEmailsSent,
        totalNotificationsSent,
        mrr: Number(mrr.toFixed(2)),
        currency: approved[0]?.plan.currency ?? "XOF",
      },
      atRisk: {
        members: uniqueAtRisk.size,
        mrr: Number(atRiskMrr.toFixed(2)),
      },
      signalsTimeline: signalsByDay,
      mrrTimeline: mrrByDay,
      recentActivities,
      activityGraph: dailyRegistrations,
      systemStatus: {
        redis: redisHealthy ? "healthy" : "error",
        bullmq: redisHealthy ? "healthy" : "warning",
        smtp: smtpHealthy ? "healthy" : "warning",
        storage: storageHealthy ? "healthy" : "warning",
        circuitBreakers: getAllCircuitStates(),
        cache: getCacheStats(),
      },
    }
      },
      5,
    )

    return NextResponse.json(data)
  } catch (error) {
    return handleAuthError(error)
  }
}
