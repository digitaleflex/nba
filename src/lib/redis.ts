import IORedis from "ioredis"

let unavailableUntil = 0

function isAvailable(): boolean {
  return Date.now() >= unavailableUntil
}

function markUnavailable(ms = 30_000): void {
  unavailableUntil = Date.now() + ms
}

export function getRedisConnection(): IORedis | null {
  if (!isAvailable()) return null
  try {
    return new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      connectTimeout: 3000,
      commandTimeout: 3000,
      retryStrategy: (times: number) => Math.min(times * 100, 1500),
      lazyConnect: false,
    })
  } catch {
    markUnavailable()
    return null
  }
}

export { isAvailable, markUnavailable }
