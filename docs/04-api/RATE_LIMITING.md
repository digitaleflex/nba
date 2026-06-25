# Rate Limiting

> **Version:** 1.0

## Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 1 minute |
| Register | 3 attempts | 1 hour |
| Forgot Password | 3 attempts | 1 hour |
| Reset Password | 3 attempts | 1 hour |
| Public API | 100 requests | 1 minute |
| Authenticated API | 1000 requests | 1 minute |

## Implementation

Rate limiting uses Redis via a middleware.

```typescript
// lib/middleware.ts
import { redis } from "@/lib/redis"

export async function rateLimit(key: string, limit: number, window: number) {
  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, window)
  return current <= limit
}
```

## Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```
