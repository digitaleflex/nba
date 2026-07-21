import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"

export async function PUT() {
  try {
    const session = await requireActiveUser()
    const rl = await rateLimitOrDeny("NOTIFICATION_MUTATION", session.user.id)
    if (rl) return rl

    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date(), isRead: true },
    })

    return NextResponse.json({ ok: true, count: result.count })
  } catch (error) {
    return handleAuthError(error)
  }
}
