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
    const ips: { ip: string; ttl: number }[] = []
    let cursor = "0"
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", "blocked:ip:*", "COUNT", 100)
      cursor = nextCursor
      for (const key of keys) {
        const ttl = await redis.ttl(key)
        ips.push({ ip: key.replace("blocked:ip:", ""), ttl })
      }
    } while (cursor !== "0")
    return NextResponse.json({ ips })
  } catch (error) {
    return handleAuthError(error)
  }
}
