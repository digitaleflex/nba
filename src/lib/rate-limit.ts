const stores = new Map<string, Map<string, { count: number; resetAt: number }>>()

interface RateLimitConfig {
  window: number
  max: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  let store = stores.get(config.window.toString())
  if (!store) {
    store = new Map()
    stores.set(config.window.toString(), store)
  }

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.window * 1000 })
    return { allowed: true, remaining: config.max - 1, resetIn: config.window }
  }

  entry.count++
  const remaining = Math.max(0, config.max - entry.count)
  const resetIn = Math.ceil((entry.resetAt - now) / 1000)

  if (entry.count > config.max) {
    return { allowed: false, remaining: 0, resetIn }
  }

  return { allowed: true, remaining, resetIn }
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request, identifier: string): Promise<Response | null> => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown"
    const key = `${identifier}:${ip}`
    const result = checkRateLimit(key, config)
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
