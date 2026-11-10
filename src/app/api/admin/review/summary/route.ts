import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

// GET /api/admin/review/summary
// Compteurs de la file "À traiter" : tout ce qui attend une action admin.
export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const [requests, kyc, broker, bugs, support] = await Promise.all([
      prisma.accessRequest.count({ where: { status: "PENDING" } }),
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
      prisma.brokerVerification.count({ where: { status: "PENDING" } }),
      prisma.notification.findMany({
        where: { type: "bug_report" },
        select: { data: true },
        take: 500,
      }),
      prisma.notification.findMany({
        where: { type: "support" },
        select: { data: true },
        take: 500,
      }),
    ])

    const openBugs = bugs.filter((b) => ((b.data as Record<string, unknown> | null)?.status ?? "OPEN") === "OPEN").length
    const openSupport = support.filter((s) => {
      const st = (s.data as Record<string, unknown> | null)?.status
      return !st || st === "OPEN"
    }).length

    const total = requests + kyc + broker + openBugs + openSupport

    return NextResponse.json({ requests, kyc, broker, bugs: openBugs, support: openSupport, total })
  } catch (error) {
    return handleAuthError(error)
  }
}
