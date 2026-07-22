import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { sessionManager } from "@nba/lib/security/session-manager"

export async function GET() {
  try {
    const session = await requireActiveUser()
    const [limits, activeSessions, deviceCount] = await Promise.all([
      sessionManager.getPlanLimits(session.user.id),
      prisma.session.count({
        where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      }),
      prisma.device.count({ where: { userId: session.user.id } }),
    ])
    return NextResponse.json({
      plan: {
        maxSessions: limits.maxSessions,
        maxDevices: limits.maxDevices,
        require2fa: limits.require2fa,
      },
      usage: {
        sessions: activeSessions,
        devices: deviceCount,
        sessionsPercent: Math.round((activeSessions / limits.maxSessions) * 100),
        devicesPercent: Math.round((deviceCount / limits.maxDevices) * 100),
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
