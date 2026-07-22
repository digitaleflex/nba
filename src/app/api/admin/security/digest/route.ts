import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { dailySecurityDigestEmail } from "@nba/lib/email"
import { sendEmailSync } from "@nba/lib/services/notifications"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 3600, max: 2 })

export async function POST(req: Request) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "security:digest")
    if (rlRes) return rlRes
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last24h = new Date(now.getTime() - 86400000)

    const [highEvents, failedLogins, blockedIps, suspendedAccounts, newUsers, criticalEvents] = await Promise.all([
      prisma.securityEvent.count({ where: { severity: { in: ["HIGH", "CRITICAL"] }, createdAt: { gte: today } } }),
      prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: last24h } } }),
      prisma.securityEvent.count({ where: { type: "DEVICE_BLOCKED", createdAt: { gte: today } } }),
      prisma.user.count({ where: { isActive: false, suspendedAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.securityEvent.findMany({
        where: { severity: "CRITICAL", createdAt: { gte: today } },
        distinct: ["type"],
        select: { type: true },
      }),
    ])

    const adminEmail = process.env.ADMIN_ALERT_EMAIL
    if (!adminEmail) return NextResponse.json({ error: "ADMIN_ALERT_EMAIL non configure" }, { status: 400 })

    const template = dailySecurityDigestEmail({
      highEvents, failedLogins, blockedIps, suspendedAccounts, newUsers,
      criticalEventTypes: criticalEvents.map(e => e.type),
    })
    await sendEmailSync(adminEmail, template.subject, template.html)

    return NextResponse.json({ sent: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
