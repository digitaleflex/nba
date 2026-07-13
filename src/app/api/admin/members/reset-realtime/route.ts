import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getRedisConnection } from "@nba/lib/queue"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 })
    }

    const redis = getRedisConnection()
    if (!redis) {
      return NextResponse.json({ error: "Redis indisponible" }, { status: 503 })
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
