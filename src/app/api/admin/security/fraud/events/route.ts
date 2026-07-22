import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:events")
    if (rlRes) return rlRes
    const events = await prisma.securityEvent.findMany({
      where: { severity: { in: ["HIGH", "CRITICAL"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } }, device: { select: { name: true } } },
    })
    const total = await prisma.securityEvent.count({
      where: { severity: { in: ["HIGH", "CRITICAL"] } },
    })
    return NextResponse.json({ events, total })
  } catch (error) {
    return handleAuthError(error)
  }
}
