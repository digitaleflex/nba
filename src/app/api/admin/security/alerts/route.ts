import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "admin:security:alerts")
    if (rlRes) return rlRes
    const lastHour = new Date(Date.now() - 3600000)
    const [highCritical, blockedIps] = await Promise.all([
      prisma.securityEvent.count({
        where: {
          severity: { in: ["HIGH", "CRITICAL"] },
          createdAt: { gte: lastHour },
        },
      }),
      prisma.securityEvent.count({
        where: { type: "DEVICE_BLOCKED", createdAt: { gte: lastHour } },
      }),
    ])
    return NextResponse.json({ alerts: highCritical + blockedIps, highCritical, blockedIps })
  } catch (error) {
    return handleAuthError(error)
  }
}
