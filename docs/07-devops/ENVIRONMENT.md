# Environment Configuration

> **Version:** 1.0

## Files

| File | Environment | Committed? |
|------|-------------|------------|
| `.env.example` | Template | ✅ Yes |
| `.env.local` | Development | ❌ No |
| `.env.staging` | Staging | ❌ No |
| `.env.production` | Production | ❌ No |

## Variables

```env
# Application
NEXT_PUBLIC_APP_URL=
NODE_ENV=development|staging|production

# Database (Neon)
DATABASE_URL=

# Redis
REDIS_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Resend
RESEND_API_KEY=
```

## Validation

All environment variables are validated at startup using Zod.

```typescript
import { z } from "zod"

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
})

export const env = envSchema.parse(process.env)
```
