import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
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
