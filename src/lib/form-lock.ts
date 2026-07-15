const lockMap = new Map<string, number>()

export function acquireLock(key: string, ttlMs = 10_000): boolean {
  const now = Date.now()
  const held = lockMap.get(key)
  if (held && now < held + ttlMs) return false
  lockMap.set(key, now)
  return true
}

export function releaseLock(key: string): void {
  lockMap.delete(key)
}

export async function withLock<T>(key: string, fn: () => Promise<T>, ttlMs = 15_000): Promise<T> {
  if (!acquireLock(key, ttlMs)) {
    throw new Error("Duplicate request — please wait before retrying.")
  }
  try {
    return await fn()
  } finally {
    releaseLock(key)
  }
}

export function formLockKey(userId: string, formName: string): string {
  return `form:${userId}:${formName}`
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of lockMap) {
    if (now - ts > 60_000) lockMap.delete(key)
  }
}, 300_000)