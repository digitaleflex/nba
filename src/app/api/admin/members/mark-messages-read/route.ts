import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { validateOrThrow, memberQuerySchema } from "@nba/lib/validations"
import { prisma } from "@nba/lib/db"
import { invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { userId } = validateOrThrow(memberQuerySchema, await request.json())

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    })
    const conversationIds = participants.map((p) => p.conversationId)

    let updated = 0
    if (conversationIds.length > 0) {
      const result = await prisma.message.updateMany({
        where: {
          conversationId: { in: conversationIds },
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      })
      updated = result.count
    }

    await invalidatePrefix(`conv:${userId}`)
    await logAuditEvent({
      userId: session.user.id,
      action: "admin.member.mark_messages_read",
      resourceType: "user",
      resourceId: userId,
      details: { updated },
    })
    return NextResponse.json({ success: true, updated })
  } catch (error) {
    return handleAuthError(error)
  }
}
