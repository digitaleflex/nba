import IORedis from "ioredis"
import { logger } from "./logger"

const log = logger.child({ module: "rate-limit" })

// Rate-limiting distribué via Redis (sliding window using sorted sets).
// Plus précis que le fixed window : évite les pics aux frontières de fenêtre.

const globalForRl = globalThis as unknown as { redisRl?: IORedis }
let rlAvailable = true
let rlUnavailableUntil = 0

function getRedis(): IORedis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null
  if (!rlAvailable) {
    if (Date.now() < rlUnavailableUntil) return null
    rlAvailable = true
  }
  if (!globalForRl.redisRl) {
    globalForRl.redisRl = new IORedis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 1500,
      lazyConnect: true,
    })
  }
  return globalForRl.redisRl
}

function markUnavailable() {
  rlAvailable = false
  rlUnavailableUntil = Date.now() + 30000
}

interface RateLimitConfig {
  window: number // in seconds
  max: number
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 * More accurate than fixed window — prevents burst at window boundaries.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedis()
  if (!redis) {
    return { allowed: true, remaining: config.max, resetIn: config.window }
  }

  const rkey = `ratelimit:sw:${key}`
  const now = Date.now()
  const windowStart = now - config.window * 1000

  try {
    const pipeline = redis.pipeline()
    // Remove entries outside the window
    pipeline.zremrangebyscore(rkey, 0, windowStart)
    // Add current request
    pipeline.zadd(rkey, `${now}`, `${now}:${crypto.randomUUID().slice(0, 8)}`)
    // Count entries in window
    pipeline.zcard(rkey)
    // Set TTL on the key
    pipeline.expire(rkey, config.window)

    const results = await pipeline.exec()
    const count = results?.[2]?.[1] as number ?? 0
    const remaining = Math.max(0, config.max - count)

    return { allowed: count <= config.max, remaining, resetIn: config.window }
  } catch {
    markUnavailable()
    return { allowed: true, remaining: config.max, resetIn: config.window }
  }
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request, identifier: string): Promise<Response | null> => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown"
    const key = `${identifier}:${ip}`
    const result = await checkRateLimit(key, config)
    if (!result.allowed) {
      log.warn({ key, ip, identifier, errorCode: "BUSINESS_RATE_LIMIT" }, "Rate limit exceeded")
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": result.resetIn.toString(),
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetIn.toString(),
        },
      })
    }
    return null
  }
}
