import IORedis from "ioredis"

// Rate-limiting distribué via Redis (fixed window).
// Remplace l'ancien Map en mémoire qui ne fonctionnait que sur un seul conteneur.

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
  window: number
  max: number
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedis()
  if (!redis) {
    // Pas de Redis -> on laisse passer (dégradé sûr)
    return { allowed: true, remaining: config.max, resetIn: config.window }
  }
  const rkey = `ratelimit:${config.window}:${key}`
  try {
    const count = await redis.incr(rkey)
    if (count === 1) {
      await redis.expire(rkey, config.window)
    }
    const ttl = await redis.ttl(rkey)
    const resetIn = ttl > 0 ? ttl : config.window
    const remaining = Math.max(0, config.max - count)
    return { allowed: count <= config.max, remaining, resetIn }
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
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": result.resetIn.toString(),
        },
      })
    }
    return null
  }
}
