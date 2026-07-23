import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 15 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "admin:sessions:list")
    if (rlRes) return rlRes
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        ipAddress: true,
        userAgent: true,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json(sessions)
  } catch (error) {
    return handleAuthError(error)
  }
}
