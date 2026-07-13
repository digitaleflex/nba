import IORedis from "ioredis"

const PREFIX = "nba:cache:v1:"

// Connexion singleton (sur le même modèle que src/lib/queue.ts).
const globalForCache = globalThis as unknown as { redisCache?: IORedis }

let available = true
let unavailableUntil = 0

function getRedis(): IORedis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null
  if (!available) {
    if (Date.now() < unavailableUntil) return null
    available = true // on retente après la fenêtre de cooldown
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

/**
 * Lit une valeur depuis le cache Redis, ou l'exécute via `fetcher` et la stocke (TTL).
 * Jamais bloquant : en cas d'erreur Redis, on retombe sur le fetcher.
 */
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
      if (cached != null) return JSON.parse(cached) as T
    } catch {
      markUnavailable()
    }
  }
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
    await redis.del(PREFIX + key)
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
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
      cursor = next
      if (keys.length) await redis.del(...keys)
    } while (cursor !== "0")
  } catch {
    markUnavailable()
  }
}
