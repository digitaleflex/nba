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
        const keys = await redis.keys("blocked:ip:*")
        blockedIps = keys.length
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
