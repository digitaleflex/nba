import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 20 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:geo-events")
    if (rlRes) return rlRes

    const last24h = new Date(Date.now() - 86400000)

    const events = await prisma.securityEvent.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        createdAt: { gte: last24h },
      },
      select: {
        id: true, type: true, severity: true,
        latitude: true, longitude: true,
        country: true, city: true,
        ipAddress: true, createdAt: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ events })
  } catch (error) {
    return handleAuthError(error)
  }
}
