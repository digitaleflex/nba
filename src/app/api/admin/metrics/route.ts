import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastHour = new Date(now.getTime() - 3600000)
    const last24h = new Date(now.getTime() - 86400000)

    const [
      totalUsers, activeUsers, suspendedUsers, newUsersToday,
      activeSessions, expiredSessions,
      totalSignals, publishedSignals, draftSignals,
      highEvents24h, highEvents1h, failedLogins24h, failedLogins1h, apiCalls,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { isActive: false, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.session.count({ where: { expiresAt: { lt: now } } }),
      prisma.signal.count(),
      prisma.signal.count({ where: { status: "PUBLISHED" } }),
      prisma.signal.count({ where: { status: "DRAFT" } }),
      prisma.securityEvent.count({ where: { severity: { in: ["HIGH", "CRITICAL"] }, createdAt: { gte: last24h } } }),
      prisma.securityEvent.count({ where: { severity: { in: ["HIGH", "CRITICAL"] }, createdAt: { gte: lastHour } } }),
      prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: last24h } } }),
      prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: lastHour } } }),
      prisma.securityEvent.count({ where: { type: "RATE_LIMIT_EXCEEDED", createdAt: { gte: last24h } } }),
    ])

    let redisOk = false
    let activeIps = 0
    try {
      const redis = getRedis()
      if (redis) {
        await redis.ping()
        redisOk = true
        let cursor = "0"
        do {
          const [nextCursor, keys] = await redis.scan(cursor, { match: "blocked:ip:*", count: 100 })
          cursor = nextCursor
          activeIps += keys.length
        } while (cursor !== "0")
      }
    } catch {}

    return NextResponse.json({
      timestamp: now.toISOString(),
      users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, newToday: newUsersToday },
      sessions: { active: activeSessions, expired: expiredSessions },
      signals: { total: totalSignals, published: publishedSignals, draft: draftSignals },
      security: {
        highCritical24h: highEvents24h,
        highCritical1h: highEvents1h,
        failedLogins24h: failedLogins24h,
        failedLogins1h: failedLogins1h,
        rateLimitExceeded24h: apiCalls,
      },
      system: {
        redis: redisOk ? "ok" : "error",
        blockedIps: activeIps,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
