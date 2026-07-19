import { NextResponse } from "next/server"
import { serverError } from "@nba/lib/api-error"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb?.role || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 })
  }
}
