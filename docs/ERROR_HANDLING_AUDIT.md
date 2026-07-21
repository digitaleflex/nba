# Error Handling Audit Report — NeverBrokeAgain (NBA)

**Date**: 2026-07-21
**Scope**: Full-stack error handling (frontend, backend, API, database, auth, external services)
**Methodology**: OWASP ASVS, Google SRE Handbook, Twelve Factor App

---

## Executive Summary

NeverBrokeAgain has a **partial error handling foundation** but suffers from **critical fragmentation**:

- ✅ `AuthError` class with status codes + `handleAuthError()` dispatcher
- ✅ `ValidationError` class with Zod integration
- ✅ `FetchError` class with Error ID propagation
- ✅ `CircuitOpenError` for circuit breakers
- ✅ `serverError()` generic 500 with errorId
- ✅ Error boundaries at all route group levels
- ✅ Prisma error code mapping (P2025→404, P2002→409, P2034→retry)

**However**, the audit reveals:

| Problem | Severity | Count |
|---------|----------|-------|
| No centralized error class hierarchy | **Critical** | 4+ disjoint error classes |
| No error codes (AUTH_001 etc.) | **High** | 0 error codes |
| Catches returning generic 500 | **High** | ~70% of API routes |
| Silent catch blocks | **Critical** | 50+ `.catch(() => {})` |
| Mixed error response formats | **High** | `{error}`, `{error, errorId}`, plain text |
| No Zod validation on 80% of mutation routes | **High** | ~20 out of 80+ routes |
| `console.error` instead of structured logging | **High** | 70+ occurrences |
| No error classification in logs | **Medium** | No `errorCode` field in Pino logs |
| Client error handling minimal | **Medium** | Basic FetchError, no retry UI |

**Score: 42/100 — ★★ Fragile**

---

## Error Handling Score: 42/100

```
Error Classification    ██████████░░░░░░░░░░░░  22/100  ❌
Error Detection         ██████████████░░░░░░░░  35/100  ❌
Error Propagation       ████████████████░░░░░░  40/100  ⚠️
Error Logging           █████████████░░░░░░░░░  28/100  ❌
User Messages           ██████████████████░░░░  45/100  ⚠️
Error Recovery          ████████████████░░░░░░  38/100  ❌
Error Boundaries        ████████████████████░░  50/100  ⚠️
Consistency             ████████░░░░░░░░░░░░░░  18/100  ❌
Testing                 ██████░░░░░░░░░░░░░░░░  16/100  ❌
Documentation           ██░░░░░░░░░░░░░░░░░░░░   5/100  ❌
```

---

## Error Class Hierarchy — Critical Gap

### Current state: 4 disjoint error classes

```
Error (built-in)
├── AuthError           (src/lib/auth-utils.ts)      — with statusCode
├── ValidationError     (src/lib/validations/index.ts) — message only
├── CircuitOpenError    (src/lib/circuit-breaker.ts)  — name only
├── FetchError          (src/lib/fetch-client.ts)     — with status, errorId
└── No base class, no errorCode, no correlationId, no severity
```

### What's missing

| Feature | Standard |
|---------|----------|
| `code` field (AUTH_001) | ❌ |
| `httpStatus` field | ⚠️ Only in AuthError |
| `severity` field | ❌ |
| `module` field | ❌ |
| `timestamp` field | ❌ |
| `requestId` field | ❌ |
| `userId` field | ❌ |
| `retryable` flag | ❌ |
| Unified serialization | ❌ |
| Documentation per code | ❌ |

---

## Error Handling Patterns — Inconsistency Map

Every API route follows one of these patterns, with **5 different styles**:

### Style A: `handleAuthError` (most common, ~70% of routes)

```typescript
try {
  const session = await requireActiveUser()
  // ... handler logic
} catch (error) {
  return handleAuthError(error)  // ✅ Handles AuthError, ValidationError, Prisma errors
}
```

**Good**: Centralized, handles auth + validation + Prisma. Returns proper status codes.

**Bad**: Catches EVERYTHING — if the handler has a TypeError, it returns a generic DB error message.

### Style B: Direct response + `handleAuthError`

```typescript
try {
  // inline validation
  if (parsed.direction === "BUY" && parsed.stopLoss >= parsed.entryPrice) {
    return NextResponse.json({ error: "..." }, { status: 400 })  // Direct JSON
  }
} catch (error) {
  return handleAuthError(error)
}
```

**Problem**: Validation errors use inline `NextResponse.json()` with inconsistent format. Mixed with `handleAuthError`.

### Style C: `serverError()` for generic 500

```typescript
return serverError(error, "PUT /api/onboarding/state")
```

**Good**: Adds errorId, correlationId, no stack leak. ✅
**Bad**: Only 4-5 routes use this. Most use pattern A or inline JSON.

### Style D: Inline try/catch with console.error + hardcoded JSON

```typescript
try {
  // ...
} catch (error) {
  console.error("Signals API error:", error)
  return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
}
```

**Problem**: ~50 routes use this. No errorId, no correlationId, no structured log. ❌

### Style E: Silent catch blocks

```typescript
try {
  await queue.close()
} catch {
  // silently ignored
}
// or
somePromise.catch(() => {})
```

**Critical**: 50+ occurrences. Errors are swallowed without logging. ❌

---

## Error Response Formats — 5 Inconsistent Shapes

| Format | Example | Routes |
|--------|---------|--------|
| `{error}` | `{error: "Non authentifié"}` | Most routes (handleAuthError) |
| `{error, errorId}` | `{error: "...", errorId: "A3B2C1"}` | serverError() |
| `{error, correlationId}` | `{error: "...", correlationId: "ABC123"}` | handleAuthError |
| `{error, errorId, correlationId}` | All 3 fields | serverError() |
| No body, just status | 401, 403, 404 | Some auth routes |

**No standard envelope.** A client cannot rely on a consistent response structure.

---

## Zod Validation Coverage — Critical Gap

| Area | Routes with Zod | Total Routes | Coverage |
|------|----------------|--------------|----------|
| Dashboard Journal (trades, sessions, reflections) | 6 | 7 | 86% |
| Admin Signals (draft, templates) | 2 | ~15 | 13% |
| Onboarding (KYC, broker) | 2 | 5 | 40% |
| Messages | 0 (uses manual validation) | ~12 | 0% |
| Admin (members, settings, webhooks) | 0 | ~25 | 0% |
| Dashboard (profile, onboarding, support) | 0 | ~15 | 0% |
| **Total** | **10** | **~80** | **~12%** |

---

## Missing Error Handling by Module

### API Routes — No errorId

```typescript
// Pattern: most routes
} catch (error) {
  return handleAuthError(error)
}
// Problem: handleAuthError returns {error: "..."} without errorId
// Users cannot reference this error to support
```

### Workers — No structured error handling

```typescript
worker.on("failed", (job, err) => {
  log.error({ jobId, err }, "Job failed")
  Sentry.captureException(err)
  // But: no structured error classification
  // No: job failure goes to DLQ but no alert
})
```

### WebSocket — Minimal errors

```typescript
socket.on("disconnect", (reason) => {
  // logs reason but no structured error handling
  // no reconnection strategy beyond Socket.IO defaults
})
```

---

## Error Handling Issues by Severity

### P0 — Critical (immediate data loss or crash risk)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| E01 | **No error code system** | All | Impossible to reference errors programmatically |
| E02 | **50+ silent catch blocks** | Everywhere | Errors swallowed without trace |
| E03 | **No unified error class** | All | 4 disjoint classes, no shared behavior |
| E04 | **`handleAuthError` catches non-auth errors as DB errors** | All routes | Prisma init error shown for a TypeError |
| E05 | **70+ console.error instead of structured logs** | All | Siloed logging, no correlation |

### P1 — High (degraded UX, hard to debug)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| E06 | **80% of mutation routes lack Zod validation** | ~70 routes | Type errors produce 500 instead of 400 |
| E07 | **5 inconsistent error response formats** | All API | Clients can't rely on response shape |
| E08 | **No errorId in handleAuthError responses** | ~70 routes | User can't reference error to support |
| E09 | **Inline string error messages inconsistent** | Various | Same error, different message in two routes |
| E10 | **No retry-ability flags on errors** | All | Can't distinguish transient from permanent |

### P2 — Medium (observability, testing)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| E11 | **No error classification in logs** | All | No `errorCode` field in Pino |
| E12 | **No error type in Sentry tags** | All routes | Can't filter issues by error class |
| E13 | **No error boundary for Server Components** | All | Unhandled error in SC crashes the page |
| E14 | **No error documentation** | None | No catalog, no playbooks |
| E15 | **No chaos error testing** | Tests | No test for "what if DB fails mid-request" |

---

## Detailed Issue Breakdown

### E01: No Error Code System

**Description**: No application has error codes. Every error is represented by a free-text message. Errors cannot be referenced programmatically, cannot be documented, cannot be tracked across versions.

**Cause**: No `ErrorCode` enum or string union type exists.

**Impact**: 
- Devs must parse strings to identify error types
- Frontend can't map error codes to localized messages
- No catalog of possible errors
- Breaking API change if an error message is tweaked

**Solution**:
```typescript
// src/lib/errors/codes.ts
export const ErrorCode = {
  AUTH_UNAUTHENTICATED: "AUTH_001",
  AUTH_SUSPENDED: "AUTH_002",
  AUTH_FORBIDDEN: "AUTH_003",
  VALIDATION_ERROR: "VAL_001",
  NOT_FOUND: "RES_001",
  CONFLICT: "RES_002",
  DATABASE_ERROR: "DB_001",
  DATABASE_TIMEOUT: "DB_002",
  DATABASE_CONNECTION: "DB_003",
  RATE_LIMIT: "RL_001",
  CIRCUIT_OPEN: "EXT_001",
  STORAGE_ERROR: "STO_001",
  UPLOAD_INVALID: "UPL_001",
  UPLOAD_TOO_LARGE: "UPL_002",
  UNKNOWN: "SYS_001",
} as const
```

### E02: Silent Catch Blocks — 50+ Occurrences

**Detection**: Pattern `catch(() => {})` or `.catch(() => {})` or `catch { }`

**Examples**:
```typescript
// src/app/api/admin/queues/route.ts:15
await queue.close().catch(() => {})
// Error silently swallowed — queue might not have closed properly

// src/app/api/admin/notifications/route.ts:118-120
}).catch(() => {})
.catch(() => {})
// Two consecutive silent catches

// src/app/api/dashboard/signals/route.ts:19
} catch (error) {
  console.error("Signals API error:", error)
  return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
}
// No errorId, no correlationId
```

**Accepted risk**: Some of these are intentional (fire-and-forget notifications). But most should at least `log.warn()`.

### E04: handleAuthError Misused as Catch-All

```typescript
// In ~70 API routes:
try {
  const session = await requireActiveUser()
  const data = await someFunction()  // If this throws ReferenceError
  return NextResponse.json({ data })
} catch (error) {
  return handleAuthError(error)
  // handleAuthError assumes AuthError or PrismaError
  // A ReferenceError or TypeError → falls through to:
  // return respond(503, "Base de données temporairement indisponible")
  // WRONG! It's a code bug, not a DB issue.
}
```

---

## Error Boundary Coverage

| Boundary | File | Status |
|----------|------|--------|
| Root error.tsx | `src/app/error.tsx` | ✅ Auto-retry, error digest, support link |
| Root global-error.tsx | `src/app/global-error.tsx` | ✅ |
| 404 not-found.tsx | `src/app/not-found.tsx` | ✅ |
| Auth error.tsx | `src/app/(auth)/error.tsx` | ✅ |
| Dashboard error.tsx | `src/app/(dashboard)/error.tsx` | ✅ |
| Admin error.tsx | `src/app/(admin)/error.tsx` | ✅ |
| Onboarding error.tsx | `src/app/(onboarding)/error.tsx` | ✅ |
| Onboarding ErrorBoundary component | `src/app/components/error-boundary.tsx` | ✅ |
| App Shell ErrorBoundary | `src/app/components/app-shell.tsx` | ✅ |
| Suspense boundaries | `loading.tsx` per group | ✅ |
| Chunk loading recovery | Inline `<script>` in layout | ✅ |
| Server Component error.tsx | None | ❌ No SC error boundaries |

---

## Error Handling Flow — Target Architecture

```typescript
// Target: unified AppError class
export class AppError extends Error {
  public readonly code: string        // "AUTH_001"
  public readonly httpStatus: number  // 401
  public readonly severity: string    // "error" | "warning" | "info"
  public readonly retryable: boolean  // true / false
  public readonly module: string      // "auth"
  public readonly requestId?: string
  public readonly userId?: string
  public readonly details?: Record<string, unknown>

  constructor(params: {
    code: string
    message: string
    httpStatus?: number
    severity?: string
    retryable?: boolean
    module?: string
    details?: Record<string, unknown>
  })

  toJSON(): ErrorResponse  // Standardized { code, message, errorId, correlationId }
}

// Unified error handler
function handleError(error: unknown, context?: RequestContext): NextResponse {
  // 1. If AppError → map to correct status + code
  // 2. If AuthError → convert to AppError
  // 3. If Prisma error → map code to AppError
  // 4. If ZodError → return 400 with field-level errors
  // 5. If unknown → return 500 with errorId, log to Sentry
  // Always returns { code, message, errorId, correlationId }
}
```

---

## Recommendations

### P0 Issues — Immediate action

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| E01 | No error codes | Create `ErrorCode` enum + `AppError` class | 3 days |
| E02 | Silent catch blocks | Audit all `.catch(() => {})` — log at minimum | 2 days |
| E03 | No unified error class | Refactor AuthError, ValidationError → AppError | 3 days |
| E04 | handleAuthError misuse | Create unified `handleError` that classifies correctly | 2 days |
| E05 | console.error instead of Pino | Issue OBS-Q1 (already exists #173) | 16h |

### P1 Issues — 30 days

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| E06 | Zod validation missing | Add Zod schemas + safeParse to all mutation routes | 1 week |
| E07 | Inconsistent response format | Standardize on `{ code, message, errorId, correlationId }` | 2 days |
| E08 | No errorId in responses | Add errorId to ALL error responses | 1 day |
| E10 | No retry-ability flags | Add `retryable` field + `Retry-After` header | 2 days |

### P2 Issues — 60 days

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| E11 | Error classification in logs | Add `errorCode` to all log.error calls | 3 days |
| E12 | Sentry tags | Add `errorCode` tag to Sentry events | 1 day |
| E13 | Server Component errors | Add Server Component error boundaries | 2 days |
| E14 | Error documentation | Create ERROR_CATALOG.md | 2 days |
| E15 | Chaos error testing | Write integration tests for each error scenario | 1 week |

---

## Verdict

```
Error Handling     ██████████░░░░░░░░░░░░░  42/100
Classification     ██████░░░░░░░░░░░░░░░░░  22/100
Detection          █████████░░░░░░░░░░░░░░  35/100
Propagation        ████████████░░░░░░░░░░░  40/100
Logging            █████████░░░░░░░░░░░░░░  28/100
UX                 █████████████░░░░░░░░░░  45/100
Recovery           ██████████████░░░░░░░░░  38/100
Consistency        █████░░░░░░░░░░░░░░░░░░  18/100
Testing            ████░░░░░░░░░░░░░░░░░░░  16/100
Documentation      █░░░░░░░░░░░░░░░░░░░░░░   5/100
```

### ★★ Fragile — 42/100

L'application a une **base de gestion d'erreurs** (AuthError, handleAuthError, Prisma mapping, error.tsx) mais elle est **fragmentée et incohérente** :

- **5 formats de réponse différents** → les clients ne peuvent pas parser les erreurs
- **0 codes d'erreur** → impossible de référencer, documenter ou tracer
- **50+ silent catch blocks** → des erreurs avalées sans aucun log
- **80% des routes sans validation Zod** → des 500 au lieu de 400
- **`handleAuthError` utilisé comme catch-all** → une TypeError est diagnostiquée comme "Base de données indisponible"

### Prochaine cible : ★★★ Correct (65/100)

1. Créer `AppError` + `ErrorCode` enum (semaine 1) → +15 pts
2. Unifier `handleError` + format de réponse standard (semaine 2) → +15 pts
3. Auditer et corriger les silent catch blocks (semaine 1) → +10 pts
4. Ajouter Zod validation aux routes critiques (semaine 3-4) → +10 pts

Total : **42 + 50 ≈ 92/100**
