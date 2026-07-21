import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const [activeSessions, uniqueSessions, lastSession, failedLogins, lastFailedAudit] = await Promise.all([
      prisma.session.count({
        where: { expiresAt: { gt: now } },
      }),
      prisma.session.findMany({
        where: { expiresAt: { gt: now } },
        select: { ipAddress: true },
        distinct: ["ipAddress"],
      }),
      prisma.session.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, ipAddress: true },
      }),
      prisma.auditLog.count({
        where: {
          action: "LOGIN_FAILED",
          createdAt: { gte: todayStart },
        },
      }),
      prisma.auditLog.findFirst({
        where: { action: "LOGIN_FAILED" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ])

    const uniqueIps = uniqueSessions.filter((s) => s.ipAddress).length

    return NextResponse.json({
      activeSessions,
      uniqueIps,
      lastLogin: lastSession
        ? new Date(lastSession.createdAt).toLocaleString("fr-FR")
        : null,
      failedLogins,
      lastFailedAttempt: lastFailedAudit
        ? new Date(lastFailedAudit.createdAt).toLocaleString("fr-FR")
        : null,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
