import IORedis from "ioredis"
import { logger } from "./logger"

const log = logger.child({ module: "rate-limit" })

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

export interface RateLimitConfig {
  window: number
  max: number
}

export const rateLimits = {
  AUTH_SIGN_IN: { window: 60, max: 5 },
  AUTH_CHECK_LOGIN: { window: 60, max: 10 },
  ONBOARDING_SEND_OTP: { window: 60, max: 3 },
  ONBOARDING_VERIFY_OTP: { window: 60, max: 5 },
  ONBOARDING_KYC: { window: 3600, max: 5 },
  ONBOARDING_BROKER: { window: 3600, max: 5 },
  PUSH_SUBSCRIBE: { window: 60, max: 10 },
  SUPPORT_SEND: { window: 3600, max: 5 },
  MESSAGE_SEND: { window: 60, max: 20 },
  MESSAGE_ATTACHMENT: { window: 3600, max: 30 },
  JOURNAL_TRADE: { window: 60, max: 30 },
  JOURNAL_REFLECTION: { window: 60, max: 10 },
  JOURNAL_SESSION: { window: 60, max: 10 },
  DELETE_ACCOUNT: { window: 3600, max: 2 },
  HARD_DELETE: { window: 3600, max: 1 },
  CHANGE_PASSWORD: { window: 3600, max: 5 },
  CHANGE_EMAIL: { window: 3600, max: 3 },
  EXPORT_DATA: { window: 3600, max: 5 },
  ADMIN_NOTIFICATION: { window: 60, max: 5 },
  ADMIN_SIGNAL_UPLOAD: { window: 3600, max: 20 },
  ADMIN_CRON_CLEANUP: { window: 600, max: 1 },
  ADMIN_MEMBER_MUTATION: { window: 60, max: 10 },
  ADMIN_SETTINGS: { window: 60, max: 10 },
  DEVICE_MUTATION: { window: 60, max: 10 },
  NOTIFICATION_LIST: { window: 60, max: 60 },
  NOTIFICATION_MUTATION: { window: 60, max: 30 },
  BULK_MESSAGE: { window: 3600, max: 3 },
  SELECT_PLAN: { window: 60, max: 5 },
} as const

export type RateLimitName = keyof typeof rateLimits

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
  headers: Record<string, string>
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 * More accurate than fixed window — prevents burst at window boundaries.
 * Fails closed (503) when Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redis = getRedis()
  if (!redis) {
    log.warn({ key: key, errorCode: "RATE_LIMIT_REDIS_UNAVAILABLE" }, "Redis indisponible — rate limit desactive")
    return {
      allowed: true,
      remaining: config.max,
      resetIn: config.window,
      headers: {
        "X-RateLimit-Limit": config.max.toString(),
        "X-RateLimit-Remaining": config.max.toString(),
        "X-RateLimit-Reset": config.window.toString(),
      },
    }
  }

  const rkey = `ratelimit:sw:${key}`
  const now = Date.now()
  const windowStart = now - config.window * 1000

  try {
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(rkey, 0, windowStart)
    pipeline.zadd(rkey, `${now}`, `${now}:${crypto.randomUUID().slice(0, 8)}`)
    pipeline.zcard(rkey)
    pipeline.expire(rkey, config.window)

    const results = await pipeline.exec()
    const count = results?.[2]?.[1] as number ?? 0
    const remaining = Math.max(0, config.max - count)

    return {
      allowed: count <= config.max,
      remaining,
      resetIn: config.window,
      headers: {
        "X-RateLimit-Limit": config.max.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": config.window.toString(),
      },
    }
  } catch (err) {
    markUnavailable()
    log.warn({ err, key: rkey, errorCode: "RATE_LIMIT_REDIS_ERROR" }, "Erreur Redis — rate limit desactive")
    return {
      allowed: true,
      remaining: config.max,
      resetIn: config.window,
      headers: {
        "X-RateLimit-Limit": config.max.toString(),
        "X-RateLimit-Remaining": config.max.toString(),
        "X-RateLimit-Reset": config.window.toString(),
      },
    }
  }
}

/**
 * Quick check for mutation routes. Returns 429/503 Response if over limit, else null.
 * On success, adds rate limit headers to the existing Response.
 */
export async function rateLimitOrDeny(
  name: RateLimitName,
  identifier: string,
): Promise<Response | null> {
  const config = rateLimits[name]
  const ip = identifier.includes(":")
    ? identifier.split(":").pop() ?? "unknown"
    : "unknown"
  const result = await checkRateLimit(`${name}:${identifier}`, config)

  if (!result.allowed) {
    const status = result.remaining === 0 ? 429 : 503
    log.warn({ name, identifier, ip, status, errorCode: "BUSINESS_RATE_LIMIT" }, "Rate limit exceeded")
    return new Response(
      JSON.stringify({
        code: "BUSINESS_RATE_LIMIT",
        message: status === 503
          ? "Service de limite de taux indisponible. Réessayez plus tard."
          : "Trop de requêtes. Réessayez plus tard.",
        errorId: Math.random().toString(36).slice(2, 10).toUpperCase(),
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          ...result.headers,
        },
      },
    )
  }

  return null
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request, identifier: string): Promise<Response | null> => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown"
    const key = `${identifier}:${ip}`
    const result = await checkRateLimit(key, config)
    if (!result.allowed) {
      const status = result.remaining === 0 ? 429 : 503
      log.warn({ key, ip, identifier, status, errorCode: "BUSINESS_RATE_LIMIT" }, "Rate limit exceeded")
      return new Response(JSON.stringify({ error: status === 503 ? "Service de limite de taux indisponible. Réessayez plus tard." : "Trop de requêtes. Réessayez plus tard." }), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...result.headers,
        },
      })
    }
    return null
  }
}
