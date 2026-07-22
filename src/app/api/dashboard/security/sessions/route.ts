import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0)
    const sessions = await prisma.session.findMany({
      where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true, createdAt: true, updatedAt: true, expiresAt: true,
        ipAddress: true, userAgent: true, country: true, city: true,
        riskLevel: true, riskScore: true, isHighRisk: true, riskReason: true,
        device: {
          select: { name: true, browser: true, os: true, deviceType: true, trustLevel: true },
        },
      },
    })
    return NextResponse.json({ sessions })
  } catch (error) {
    return handleAuthError(error)
  }
}
