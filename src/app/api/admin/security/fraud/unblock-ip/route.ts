import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:unblock-ip")
    if (rlRes) return rlRes
    const { ip } = await req.json()
    if (!ip) return NextResponse.json({ error: "ip requise" }, { status: 400 })
    const redis = getRedis()
    if (redis) await redis.del(`blocked:ip:${ip}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
