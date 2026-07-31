import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import type { Prisma } from "@nba/generated/prisma/client"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:auth-attempts")
    if (rlRes) return rlRes

    const type = req.nextUrl.searchParams.get("type")
    const successParam = req.nextUrl.searchParams.get("success")
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase()

    const where: Prisma.LoginAttemptWhereInput = {}
    if (type === "LOGIN" || type === "SIGNUP") where.type = type
    if (successParam === "true" || successParam === "false") where.success = successParam === "true"
    if (email) where.email = { contains: email }

    const [attempts, total, counts] = await Promise.all([
      prisma.loginAttempt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          type: true,
          success: true,
          reason: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.loginAttempt.count({ where }),
      prisma.loginAttempt.groupBy({
        by: ["success"],
        where: { createdAt: { gte: new Date(Date.now() - 3600000) } },
        _count: true,
      }),
    ])

    const hourCounts = {
      success: counts.find((c) => c.success === true)?._count ?? 0,
      failed: counts.find((c) => c.success === false)?._count ?? 0,
    }

    return NextResponse.json({ attempts, total, hourCounts })
  } catch (error) {
    return handleAuthError(error)
  }
}
