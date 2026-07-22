import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { ip } = await req.json()
    if (!ip) return NextResponse.json({ error: "ip requise" }, { status: 400 })
    const redis = getRedis()
    if (redis) await redis.del(`blocked:ip:${ip}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
