import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:abuse")
    if (rlRes) return rlRes
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastHour = new Date(now.getTime() - 3600000)

    const [highEvents, failedLogins, blockedDevices, suspendedAccounts] = await Promise.all([
      prisma.securityEvent.count({ where: { severity: { in: ["HIGH", "CRITICAL"] }, createdAt: { gte: today } } }),
      prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: lastHour } } }),
      prisma.securityEvent.count({ where: { type: "DEVICE_BLOCKED", createdAt: { gte: today } } }),
      prisma.user.count({ where: { isActive: false, suspendedAt: { gte: today } } }),
    ])

    let blockedIps = 0
    try {
      const redis = getRedis()
      if (redis) {
        let cursor = "0"
        do {
          const [nextCursor, keys] = await redis.scan(cursor, { match: "blocked:ip:*", count: 100 })
          cursor = nextCursor
          blockedIps += keys.length
        } while (cursor !== "0")
      }
    } catch {}

    const recentEvents = await prisma.securityEvent.findMany({
      where: { createdAt: { gte: lastHour }, severity: { in: ["HIGH", "CRITICAL"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, severity: true, userId: true, ipAddress: true, createdAt: true, details: true,
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({
      summary: { highEvents, failedLogins, blockedDevices, suspendedAccounts, blockedIps },
      recentEvents,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
