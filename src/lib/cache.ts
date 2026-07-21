import IORedis from "ioredis"
import { logger } from "./logger"

const log = logger.child({ module: "cache" })

const PREFIX = "nba:cache:v1:"

const globalForCache = globalThis as unknown as { redisCache?: IORedis }

let available = true
let unavailableUntil = 0

let hits = 0
let misses = 0
let invalidations = 0

function getRedis(): IORedis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null
  if (!available) {
    if (Date.now() < unavailableUntil) return null
    available = true
  }
  if (!globalForCache.redisCache) {
    globalForCache.redisCache = new IORedis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 1500,
      lazyConnect: true,
    })
  }
  return globalForCache.redisCache
}

function markUnavailable() {
  available = false
  unavailableUntil = Date.now() + 30000
}

export function getStats() {
  const total = hits + misses
  return {
    hits,
    misses,
    invalidations,
    total,
    ratio: total > 0 ? `${((hits / total) * 100).toFixed(1)}%` : "N/A",
  }
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 30,
): Promise<T> {
  const redis = getRedis()
  const fullKey = PREFIX + key
  if (redis) {
    try {
      const cached = await redis.get(fullKey)
      if (cached != null) {
        try {
          hits++
          return JSON.parse(cached) as T
        } catch {
          // Valeur corrompue dans le cache : on l'ignore et on re-fetch.
          await invalidateKey(key).catch((err) => {
            log.warn({ err, key }, "Failed to invalidate corrupted cache key")
          })
        }
      }
    } catch {
      markUnavailable()
    }
  }
  misses++
  const value = await fetcher()
  if (redis) {
    try {
      await redis.set(fullKey, JSON.stringify(value), "EX", ttlSeconds)
    } catch {
      markUnavailable()
    }
  }
  return value
}

export async function invalidateKey(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.unlink(PREFIX + key)
    invalidations++
  } catch {
    markUnavailable()
  }
}

export async function invalidatePrefix(prefix: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  const pattern = PREFIX + prefix + "*"
  try {
    let cursor = "0"
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 500)
      cursor = next
      if (keys.length) {
        await redis.unlink(...keys)
        invalidations += keys.length
      }
    } while (cursor !== "0")
  } catch {
    markUnavailable()
  }
}
