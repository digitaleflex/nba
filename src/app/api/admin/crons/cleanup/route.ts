import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { deleteOldAuditLogs } from "@nba/lib/services/audit"

const cleanupRateLimit = rateLimitMiddleware({ window: 600, max: 1 })

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const rateLimitRes = await cleanupRateLimit(req, "cleanup")
    if (rateLimitRes) return rateLimitRes

    const retention = {
      auditLogsDays: 90,
      kycDays: 30,
      inactiveAccountDays: 365,
    }

    const now = new Date()
    const auditCutoff = new Date(now.getTime() - retention.auditLogsDays * 24 * 60 * 60 * 1000)
    const kycCutoff = new Date(now.getTime() - retention.kycDays * 24 * 60 * 60 * 1000)
    const inactiveCutoff = new Date(now.getTime() - retention.inactiveAccountDays * 24 * 60 * 60 * 1000)

    const results: Record<string, number> = {}

    results.auditLogs = await deleteOldAuditLogs(auditCutoff)

    const kycDocuments = await prisma.kycDocument.findMany({
      where: { createdAt: { lt: kycCutoff }, status: "REJECTED" },
      select: { id: true },
    })
    if (kycDocuments.length > 0) {
      await prisma.kycDocument.deleteMany({
        where: { id: { in: kycDocuments.map((d) => d.id) } },
      })
    }
    results.kycDocuments = kycDocuments.length

    const inactiveUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: false,
        updatedAt: { lt: inactiveCutoff },
        sessions: { none: { createdAt: { gte: inactiveCutoff } } },
      },
      select: { id: true, email: true },
    })
    for (const u of inactiveUsers) {
      await prisma.session.deleteMany({ where: { userId: u.id } })
      await prisma.user.update({
        where: { id: u.id },
        data: { deletedAt: now, email: `purged-${Date.now()}-${u.id.slice(0, 8)}@deleted.local` },
      })
    }
    results.inactiveAccounts = inactiveUsers.length

    return NextResponse.json({ ok: true, cleaned: results })
  } catch (error) {
    return handleAuthError(error)
  }
}
