import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { sessionManager } from "@nba/lib/security/session-manager"
import { securityEventBus } from "@nba/lib/security/security-event-bus"

export async function GET() {
  try {
    const session = await requireActiveUser()
    const sessions = await prisma.session.findMany({
      where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, createdAt: true, updatedAt: true, expiresAt: true,
        ipAddress: true, userAgent: true, country: true, city: true,
        riskLevel: true, riskScore: true, isHighRisk: true,
        deviceId: true,
        device: {
          select: { name: true, browser: true, os: true, deviceType: true },
        },
      },
    })
    const limits = await sessionManager.getPlanLimits(session.user.id)
    return NextResponse.json({
      sessions,
      activeCount: sessions.length,
      maxSessions: limits.maxSessions,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authSession = await requireActiveUser()
    const body = await req.json()
    const { sessionId } = body
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 })
    }
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    })
    if (!targetSession || targetSession.userId !== authSession.user.id) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 })
    }
    await sessionManager.revokeSession(sessionId, authSession.user.id)
    await securityEventBus.emit({
      userId: authSession.user.id,
      type: "SESSION_REVOKED",
      severity: "INFO",
      sessionId,
      details: { revokedBy: "user" },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
