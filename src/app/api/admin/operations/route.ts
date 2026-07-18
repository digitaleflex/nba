import { NextResponse } from "next/server"
import { serverError } from "@nba/lib/api-error"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getCached } from "@nba/lib/cache"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier le rôle
    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

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
    ])

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
        publishedSignalsCount,
        approvedKycCount,
        totalEmailsSent,
        totalNotificationsSent,
      },
      recentActivities,
      activityGraph: dailyRegistrations,
      systemStatus: {
        redis: redisHealthy ? "healthy" : "error",
        bullmq: redisHealthy ? "healthy" : "warning",
        smtp: smtpHealthy ? "healthy" : "warning",
        storage: storageHealthy ? "healthy" : "warning",
      },
    }
      },
      5,
    )

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
