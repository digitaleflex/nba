import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "security:ack-event")
    if (rlRes) return rlRes

    const { id } = await params
    const { acknowledged } = await req.json()
    const event = await prisma.securityEvent.findUnique({
      where: { id },
    })
    if (!event) return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 })

    const details = (event.details as Record<string, unknown>) ?? {}
    if (acknowledged) {
      details.acknowledgedAt = new Date().toISOString()
      details.acknowledgedBy = admin.user.email
      details.acknowledgedById = admin.user.id
    } else {
      delete details.acknowledgedAt
      delete details.acknowledgedBy
      delete details.acknowledgedById
    }

    await prisma.securityEvent.update({
      where: { id },
      data: { details: details as any },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
