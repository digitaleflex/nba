import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const cleanupRateLimit = rateLimitMiddleware({ window: 600, max: 1 })

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const rateLimitRes = await cleanupRateLimit(req, "cleanup")
    if (rateLimitRes) return rateLimitRes

    const retention = {
      auditLogsDays: 90,
      kycDays: 30,
    }

    const now = new Date()
    const auditCutoff = new Date(now.getTime() - retention.auditLogsDays * 24 * 60 * 60 * 1000)
    const kycCutoff = new Date(now.getTime() - retention.kycDays * 24 * 60 * 60 * 1000)

    const results: Record<string, number> = {}

    const auditDeleted = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: auditCutoff } },
    })
    results.auditLogs = auditDeleted.count

    const kycDocuments = await prisma.kycDocument.findMany({
      where: { createdAt: { lt: kycCutoff }, status: { in: ["REJECTED", "EXPIRED"] } },
      select: { id: true },
    })
    if (kycDocuments.length > 0) {
      await prisma.kycDocument.deleteMany({
        where: { id: { in: kycDocuments.map((d) => d.id) } },
      })
    }
    results.kycDocuments = kycDocuments.length

    return NextResponse.json({ ok: true, cleaned: results })
  } catch (error) {
    return handleAuthError(error)
  }
}
