import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { validateOrThrow, memberQuerySchema } from "@nba/lib/validations"
import { getRedisConnection } from "@nba/lib/queue"
import { logAuditEvent } from "@nba/lib/services/audit"
import { msg } from "@nba/lib/messages"

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { userId } = validateOrThrow(memberQuerySchema, await request.json())

    const redis = getRedisConnection()
    if (!redis) {
      return NextResponse.json({ error: msg.member.REDIS_UNAVAILABLE }, { status: 503 })
    }
    await redis.publish("nba:ws:control", `reset:${userId}`)
    await logAuditEvent({
      userId: session.user.id,
      action: "admin.member.reset_realtime",
      resourceType: "user",
      resourceId: userId,
      details: {},
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
