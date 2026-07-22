import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 10, max: 30 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:blocked-ips")
    if (rlRes) return rlRes
    const redis = getRedis()
    if (!redis) return NextResponse.json({ ips: [] })
    const keys = await redis.keys("blocked:ip:*")
    const ips: { ip: string; ttl: number }[] = []
    for (const key of keys) {
      const ttl = await redis.ttl(key)
      ips.push({ ip: key.replace("blocked:ip:", ""), ttl })
    }
    return NextResponse.json({ ips })
  } catch (error) {
    return handleAuthError(error)
  }
}
