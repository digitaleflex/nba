import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { sendPushToUser } from "@nba/lib/services/push"

const testRateLimit = rateLimitMiddleware({ window: 60, max: 3 })

// POST /api/push/test
export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await testRateLimit(req, `push-test:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true },
    })
    if (!user?.isActive) {
      return NextResponse.json({ sent: 0, failed: 0, devices: 0, reason: "INACTIVE" }, { status: 200 })
    }

    const result = await sendPushToUser(session.user.id, {
      title: "🔔 Alerte de test",
      body: "Si vous voyez ceci, vos alertes de signaux fonctionnent",
      url: "/dashboard/notifications",
      tag: `test-${Date.now()}`,
    })

    const devices = await prisma.pushSubscription.count({ where: { userId: session.user.id } })

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      devices,
      ...(result.skipped ? { reason: result.skipped } : {}),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
