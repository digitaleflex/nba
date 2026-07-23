# MASTER AUTH ARCHITECTURE

## Architecture d'Authentification Complete -- NBA Platform

**Version:** 1.0.0
**Date:** 2026-07-22
**Stack:** Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis (ioredis), Socket.IO
**Auteurs:** equipe Security & Platform
**Classification:** INTERNE - CONFIDENTIEL

---

## Table des Matieres

1. [Executive Summary](#1-executive-summary)
2. [Better Auth Deep Dive](#2-better-auth-deep-dive)
3. [Session Management](#3-session-management)
4. [Cookie Architecture](#4-cookie-architecture)
5. [Authentication Flows](#5-authentication-flows)
6. [OAuth Integration](#6-oauth-integration)
7. [2FA/MFA](#7-2fa-mfa)
8. [Device Management](#8-device-management)
9. [Rate Limiting](#9-rate-limiting)
10. [Security Events & Audit](#10-security-events--audit)
11. [Password Policies](#11-password-policies)
12. [Session Hijacking Protection](#12-session-hijacking-protection)
13. [WebSocket Authentication](#13-websocket-authentication)
14. [Middleware Security](#14-middleware-security)
15. [API Security](#15-api-security)
16. [Database Schema](#16-database-schema)
17. [Performance](#17-performance)
18. [Monitoring & Observability](#18-monitoring--observability)
19. [Testing Strategy](#19-testing-strategy)
20. [Implementation Roadmap](#20-implementation-roadmap)
21. [Appendices](#21-appendices)

---

## 1. Executive Summary

### 1.1 Vision

NBA Platform adopte une architecture Zero-Trust pour l'authentification. Chaque requete est verifiee, chaque session est liee a un dispositif et une empreinte, et chaque tentative est auditee.

### 1.2 Principes Fondamentaux

```
+-----------------------------------------------------------+
|            PRINCIPES D'AUTHENTIFICATION                    |
+-----------------------------------------------------------+
| 1. Zero-Trust : ne jamais faire confiance                  |
| 2. Defense-in-Depth : cookies + fingerprint + IP           |
| 3. Least Privilege : chaque entite a le minimum            |
| 4. Auditabilite : chaque transition est loguee             |
| 5. Securite par defaut : securite > commodite              |
| 6. Resilience : mode degrade (fallback local)              |
+-----------------------------------------------------------+
```

### 1.3 Matrice de Maturite

| Domaine | Niveau Actuel | Niveau Cible | Priorite |
|---------|--------------|-------------|----------|
| Session Management | 3/5 | 5/5 | Haute |
| Cookie Security | 4/5 | 5/5 | Haute |
| Rate Limiting | 4/5 | 5/5 | Haute |
| 2FA/MFA | 2/5 | 5/5 | Critique |
| Device Fingerprinting | 3/5 | 5/5 | Haute |
| Audit & Sec Events | 3/5 | 5/5 | Moyenne |
| WebSocket Auth | 3/5 | 5/5 | Haute |
| Password Policies | 3/5 | 4/5 | Moyenne |
| Hijacking Protection | 2/5 | 5/5 | Critique |
| RBAC/ABAC | 4/5 | 5/5 | Moyenne |

### 1.4 Score de Maturite Global

**Score actuel : 31/50**
**Score cible : 49/50**
**Ecart : 18 points**

---

## 2. Better Auth Deep Dive

### 2.1 Architecture Diagramme

```
+--------------------------------------------------------------------+
|                    CLIENT (Next.js 16)                             |
|  +---------------+  +--------------+  +----------------------+     |
|  | auth-client    |  | middleware    |  | WebSocket Client     |    |
|  | (createAuth    |  | (route guard) |  | (Socket.IO)          |    |
|  |  Client)       |  |              |  |                      |    |
|  +-------+--------+  +------+-------+  +----------+-----------+    |
|         |                   |                       |               |
+---------+-------------------+-----------------------+---------------+
            |                   |                       |
     HTTP Cookies         Cookie Check            HMAC Cookie
            |                   |                       |
+---------+-------------------+-----------------------+---------------+
|                    SERVER (Next.js 16)                             |
|  +-------------------------------------------------------------+  |
|  |              better-auth (server)                            |  |
|  |  +-----------+  +-----------+  +------------------------+   |  |
|  |  | auth.ts    |  | plugins   |  | hooks                  |   |  |
|  |  | (config)   |  |nextCookies|  | databaseHooks          |   |  |
|  |  +-----+------+  +-----------+  | - before create user   |   |  |
|  |        |                        | - after create user    |   |  |
|  |        |                        | - session limits       |   |  |
|  |  +-----+----------------------------------------------+  |   |  |
|  |  |  Rate Limiter (multi-layer)                         |  |   |  |
|  |  |  - IP-based sliding window                         |  |   |  |
|  |  |  - User-based sliding window                       |  |   |  |
|  |  |  - Global throttling                               |  |   |  |
|  |  +----------------------------------------------------+  |   |  |
|  +-------------------------------------------------------------+  |
|                                                                     |
|  +-------------------------------------------------------------+  |
|  |              Prisma Adapter                                  |  |
|  |  +----------+ +----------+ +----------+ +--------------+    |  |
|  |  |  User    | | Session  | | Account  | |Verification  |    |  |
|  |  +----------+ +----------+ +----------+ +--------------+    |  |
|  +-------------------------+-----------------------------------+  |
|                            |                                       |
|  +-------------------------+-----------------------------------+  |
|  |              PostgreSQL (Neon)                               |  |
|  +-------------------------------------------------------------+  |
|                                                                     |
|  +-------------------------------------------------------------+  |
|  |              Redis (ioredis)                                 |  |
|  |  - Rate limiting (sliding window sorted sets)                |  |
|  |  - Session cache (TTL: 7 jours)                              |  |
|  |  - Device fingerprint cache                                  |  |
|  |  - Token blacklist                                           |  |
|  |  - Rate limit fallback (local LRU en memoire)                |  |
|  +-------------------------------------------------------------+  |
+--------------------------------------------------------------------+
```

### 2.2 Configuration Complete (auth.ts)

```typescript
// src/lib/auth.ts -- Configuration Better Auth complete
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./db"
import { nextCookies } from "better-auth/next-js"
import { twoFactor } from "better-auth/plugins/two-factor"
import { admin } from "better-auth/plugins/admin"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from "./services/notifications"
import { isEmailBanned } from "./services/moderation"
import { purgeSoftDeletedUser } from "./services/user-deletion"
import { redis } from "./redis"
import { logger } from "./logger"

const log = logger.child({ module: "better-auth" })

const trustedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,
  user: {
    modelName: "user",
    additionalFields: {
      phone: { type: "string", required: false },
      whatsapp: { type: "string", required: false },
      country: { type: "string", required: false },
      language: { type: "string", required: false, defaultValue: "fr" },
      timezone: { type: "string", required: false, defaultValue: "Europe/Paris" },
      onboardingStatus: { type: "string", required: false, defaultValue: "REGISTERED" },
      isActive: { type: "boolean", required: false, defaultValue: true },
      suspendedAt: { type: "date", required: false },
      signalsAccessOverride: { type: "boolean", required: false, defaultValue: false },
      metadata: { type: "json", required: false },
      deletedAt: { type: "date", required: false },
      notificationSound: { type: "string", required: false, defaultValue: "default" },
      emailStatus: { type: "string", required: false, defaultValue: "OK" },
      emailStatusAt: { type: "date", required: false },
    },
  },
  session: {
    modelName: "session",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    additionalFields: {
      deviceFingerprint: { type: "string", required: false },
      ipAddress: { type: "string", required: false },
      userAgent: { type: "string", required: false },
      isBoundToDevice: { type: "boolean", required: false, defaultValue: true },
      lastVerifiedAt: { type: "date", required: false },
      suspiciousFlags: { type: "json", required: false },
    },
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user, url)
      log.info({ userId: user.id }, "Password reset email sent")
    },
    resetPasswordTokenExpiresIn: 60 * 60,
  },
  password: {
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    hash: {
      type: "bcrypt",
      rounds: 12,
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user, url)
      log.info({ userId: user.id }, "Verification email sent")
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 3 },
      "/request-password-reset": { window: 3600, max: 3 },
      "/verify-email": { window: 60, max: 3 },
      "/two-factor/verify": { window: 60, max: 5 },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    ipAddress: {
      ipAddressHeaders:
        process.env.NODE_ENV === "production"
          ? ["cf-connecting-ip"]
          : [],
    },
    cookiePrefix: process.env.NODE_ENV === "production" ? "__Secure-" : "",
    crossSubDomainCookies: false,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const banned = await isEmailBanned(user.email)
          if (banned) {
            throw new Error("ACCOUNT_BANNED:" + banned.reason)
          }
          await purgeSoftDeletedUser(prisma, user.email)
          log.info({ email: user.email }, "User pre-create checks passed")
        },
        after: async (user) => {
          await sendWelcomeEmail({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          log.info({ userId: user.id }, "Welcome email queued")
        },
      },
      update: {
        before: async (user) => {
          if (user.email) {
            const existing = await prisma.user.findUnique({
              where: { id: user.id },
              select: { email: true },
            })
            if (existing && existing.email !== user.email) {
              log.warn({ userId: user.id }, "Email change detected")
            }
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const activeSessions = await prisma.session.count({
            where: { userId: session.userId },
          })
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: { select: { name: true } } },
          })
          const maxSessions = getMaxSessionsForRole(user?.role?.name ?? "MEMBER")
          if (activeSessions >= maxSessions) {
            const oldest = await prisma.session.findFirst({
              where: { userId: session.userId },
              orderBy: { createdAt: "asc" },
            })
            if (oldest) {
              await prisma.session.delete({
                where: { id: oldest.id },
              })
              log.warn({
                userId: session.userId,
                evictedSessionId: oldest.id,
                maxSessions,
              }, "Oldest session evicted due to limit")
            }
          }
        },
        after: async (session) => {
          await redis.setex("session:" + session.id,
            60 * 60 * 24 * 7,
            JSON.stringify(session),
          )
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: "NBA Platform",
      totpOptions: {
        digits: 6,
        period: 30,
        algorithm: "SHA1",
      },
      backupCodeOptions: {
        count: 8,
        length: 12,
      },
      strategies: ["totp", "email"],
      otpOptions: {
        expiresIn: 300,
        length: 6,
      },
    }),
    admin({
      adminRoles: ["SUPER_ADMIN", "ADMIN"],
      defaultRole: "MEMBER",
    }),
  ],
})

function getMaxSessionsForRole(role: string): number {
  switch (role) {
    case "SUPER_ADMIN": return 10
    case "ADMIN": return 5
    case "MEMBER": return 3
    case "VIP": return 5
    default: return 3
  }
}

export type Session = typeof auth.$Infer.Session
```

### 2.3 Plugin System

Better Auth 1.6.20 supporte un systeme de plugins par pipeline :

```
  +---------------------------+
  |      Requete              |
  +------------+--------------+
               |
  +------------v--------------+
  |  Plugin Pipeline          |
  |  +---------------------+  |
  |  | nextCookies()       |  | <- Gestion cookies securisees
  |  +---------------------+  |
  |  +---------------------+  |
  |  | twoFactor()         |  | <- 2FA/MFA (TOTP + Email OTP)
  |  +---------------------+  |
  |  +---------------------+  |
  |  | admin()             |  | <- RBAC
  |  +---------------------+  |
  +---------------------------+
               |
  +------------v--------------+
  |  databaseHooks            |
  |  - before/after user      |
  |  - before/after session   |
  +---------------------------+
```

### 2.4 Prisma Adapter -- Mapping

| Modele Better Auth | Table Prisma | Champs cles |
|-------------------|--------------|-------------|
| User | `users` | id, email, name, emailVerified, image |
| Session | `sessions` | id, userId, token, expiresAt, ipAddress, userAgent |
| Account | `accounts` | id, userId, providerId, accountId, accessToken |
| Verification | `verifications` | id, identifier, value, expiresAt |

---

## 3. Session Management

### 3.1 Cycle de Vie Complet

```
  +----------+    +----------+    +-----------+    +----------+    +----------+
  |  CREATED |--->|  ACTIVE  |--->|  EXTENDED |--->| EXPIRING |--->|  EXPIRED |
  +----------+    +----------+    +-----------+    +----------+    +----------+
       |               |                                   |              |
       |               |                                   |              |
       v               v                                   v              v
  +----------+    +----------+    +-----------+    +----------+    +----------+
  | REVOKED  |    |  LOCKED  |    |  ENABLED  |    | REMOVED  |    | ARCHIVED |
  +----------+    +----------+    +-----------+    +----------+    +----------+
```

### 3.2 State Machine

```
Etats :
  CREATED   -> Session creee mais pas encore activee
  ACTIVE    -> Session en cours d'utilisation
  EXTENDED  -> Session prolongee via updateAge
  EXPIRING  -> Session dans la fenetre d'expiration
  EXPIRED   -> Session expiree (temps ecoule)
  REVOKED   -> Session revoquee (admin, user, securite)
  LOCKED    -> Session verrouillee (anomalie detectee)
  ARCHIVED  -> Session archivee pour historique

Transitions (12 transitions) :
  T1:  CREATED    -> ACTIVE   : verification reussie
  T2:  ACTIVE     -> EXTENDED : refresh token
  T3:  ACTIVE     -> REVOKED  : deconnexion, admin, securite
  T4:  ACTIVE     -> LOCKED   : anomalie detectee
  T5:  EXTENDED   -> ACTIVE   : utilisation continue
  T6:  EXTENDED   -> EXPIRING : 15% du TTL restant
  T7:  EXPIRING   -> EXTENDED : refresh avant expiration
  T8:  EXPIRING   -> EXPIRED  : timeout atteint
  T9:  EXPIRED    -> ARCHIVED : cleanup auto
  T10: LOCKED     -> ACTIVE   : verification reussie
  T11: LOCKED     -> REVOKED  : echec verification
  T12: REVOKED    -> ARCHIVED : cleanup (24h)
```

### 3.3 Limites de Sessions par Plan

```typescript
// src/lib/session-limits.ts
export interface SessionLimits {
  maxConcurrent: number
  maxDevices: number
  sessionTTL: number
  refreshWindow: number
  idleTimeout: number
  allowedIpRange?: string[]
  requireDeviceBinding: boolean
  requireFingerprint: boolean
}

export const PLAN_LIMITS: Record<string, SessionLimits> = {
  FREE: {
    maxConcurrent: 1,
    maxDevices: 1,
    sessionTTL: 60 * 60 * 24,
    refreshWindow: 60 * 60,
    idleTimeout: 60 * 30,
    requireDeviceBinding: true,
    requireFingerprint: false,
  },
  STARTER: {
    maxConcurrent: 2,
    maxDevices: 2,
    sessionTTL: 60 * 60 * 24 * 3,
    refreshWindow: 60 * 60 * 12,
    idleTimeout: 60 * 60,
    requireDeviceBinding: true,
    requireFingerprint: false,
  },
  PRO: {
    maxConcurrent: 3,
    maxDevices: 3,
    sessionTTL: 60 * 60 * 24 * 7,
    refreshWindow: 60 * 60 * 24,
    idleTimeout: 60 * 60 * 2,
    requireDeviceBinding: true,
    requireFingerprint: true,
  },
  VIP: {
    maxConcurrent: 5,
    maxDevices: 5,
    sessionTTL: 60 * 60 * 24 * 14,
    refreshWindow: 60 * 60 * 24 * 2,
    idleTimeout: 60 * 60 * 4,
    requireDeviceBinding: true,
    requireFingerprint: true,
  },
  ADMIN: {
    maxConcurrent: 5,
    maxDevices: 5,
    sessionTTL: 60 * 60 * 12,
    refreshWindow: 60 * 60 * 4,
    idleTimeout: 60 * 30,
    allowedIpRange: ["10.0.0.0/8", "172.16.0.0/12"],
    requireDeviceBinding: true,
    requireFingerprint: true,
  },
  SUPER_ADMIN: {
    maxConcurrent: 10,
    maxDevices: 5,
    sessionTTL: 60 * 60 * 8,
    refreshWindow: 60 * 60 * 2,
    idleTimeout: 60 * 15,
    allowedIpRange: ["10.0.0.0/8"],
    requireDeviceBinding: true,
    requireFingerprint: true,
  },
}
```

### 3.4 Session Rotation

```typescript
// src/lib/session-rotation.ts
import { prisma } from "./db"
import { redis } from "./redis"
import { logger } from "./logger"

const log = logger.child({ module: "session-rotation" })

export async function rotateSession(
  sessionToken: string,
  ipAddress: string,
  userAgent: string,
): Promise<{ newToken: string; expiresAt: Date } | null> {
  const oldSession = await prisma.session.findUnique({
    where: { token: sessionToken },
  })
  if (!oldSession) return null

  const blacklisted = await redis.get("blacklist:session:" + oldSession.id)
  if (blacklisted) return null

  const newToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000)

  const [newSession] = await prisma.$transaction([
    prisma.session.create({
      data: {
        userId: oldSession.userId,
        token: newToken,
        expiresAt,
        ipAddress,
        userAgent,
        deviceFingerprint: oldSession.deviceFingerprint ?? null,
        isBoundToDevice: oldSession.isBoundToDevice ?? true,
        lastVerifiedAt: new Date(),
      },
    }),
    prisma.session.update({
      where: { id: oldSession.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    }),
  ])

  await redis.setex("blacklist:session:" + oldSession.id, 60 * 60 * 24, "1")

  log.info({
    oldSessionId: oldSession.id,
    newSessionId: newSession.id,
    userId: oldSession.userId,
  }, "Session rotated")

  return { newToken, expiresAt }
}

export async function isTokenBlacklisted(sessionId: string): Promise<boolean> {
  const blacklisted = await redis.get("blacklist:session:" + sessionId)
  return blacklisted !== null
}
```

### 3.5 Revocation de Session

```typescript
// src/lib/session-revocation.ts
export type RevocationReason =
  | "USER_LOGOUT"
  | "ADMIN_REVOKE"
  | "PASSWORD_CHANGED"
  | "DEVICE_UNTRUSTED"
  | "SUSPICIOUS_ACTIVITY"
  | "SESSION_LIMIT_EXCEEDED"
  | "ACCOUNT_SUSPENDED"
  | "EMAIL_CHANGED"
  | "TWO_FACTOR_DISABLED"
  | "CROSS_ORIGIN_DETECTED"

export async function revokeSession(
  sessionId: string,
  reason: RevocationReason,
  triggeredBy: string,
): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  })
  if (!session) return

  await prisma.$transaction(async (tx) => {
    await tx.session.delete({ where: { id: sessionId } })
    await redis.setex("blacklist:session:" + sessionId,
      60 * 60 * 24 * 7,
      JSON.stringify({ reason, triggeredBy, revokedAt: new Date().toISOString() }),
    )
    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: "SESSION_REVOKED",
        resourceType: "session",
        resourceId: sessionId,
        details: { reason, triggeredBy, ipAddress: session.ipAddress },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        severity: "WARN",
        searchText: "session revoked " + reason,
      },
    })
    await redis.del("session:" + sessionId)
  })
  log.warn({ sessionId, userId: session.userId, reason, triggeredBy }, "Session revoked")
}

export async function revokeAllSessions(
  userId: string,
  excludeSessionId?: string,
  reason: RevocationReason = "USER_LOGOUT",
): Promise<number> {
  const where = excludeSessionId
    ? { userId, id: { not: excludeSessionId } }
    : { userId }
  const sessions = await prisma.session.findMany({ where })
  const pipeline = redis.pipeline()
  for (const session of sessions) {
    pipeline.setex("blacklist:session:" + session.id,
      60 * 60 * 24 * 7,
      JSON.stringify({ reason, triggeredBy: userId, revokedAt: new Date().toISOString() }),
    )
    pipeline.del("session:" + session.id)
  }
  await pipeline.exec()
  const result = await prisma.session.deleteMany({ where })
  log.warn({ userId, count: result.count, reason }, "All sessions revoked")
  return result.count
}
```

### 3.6 Controle de Sessions Concurrentes

```typescript
// src/lib/session-concurrent.ts
export async function enforceSessionLimit(
  userId: string,
  roleName: string,
  newSessionId: string,
): Promise<void> {
  const limits = PLAN_LIMITS[roleName] ?? PLAN_LIMITS.FREE
  const activeSessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  })
  if (activeSessions.length > limits.maxConcurrent) {
    const toRemove = activeSessions.slice(0, activeSessions.length - limits.maxConcurrent)
    for (const session of toRemove) {
      if (session.id !== newSessionId) {
        await revokeSession(session.id, "SESSION_LIMIT_EXCEEDED", "system")
      }
    }
    log.warn({ userId, roleName, limit: limits.maxConcurrent, evicted: toRemove.length },
      "Concurrent session limit enforced")
  }
}

export async function checkSessionLimit(
  userId: string,
  roleName: string,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = PLAN_LIMITS[roleName] ?? PLAN_LIMITS.FREE
  const current = await prisma.session.count({
    where: { userId, expiresAt: { gt: new Date() } },
  })
  return { allowed: current < limits.maxConcurrent, current, limit: limits.maxConcurrent }
}
```

---

## 4. Cookie Architecture

### 4.1 Structure des Cookies

```
+--------------------------------------------------------------------+
|                    COOKIE ARCHITECTURE                              |
+--------------------------------------------------------------------+
|  Production (__Secure- prefix)                                      |
|  +--------------------------------------------------------------+  |
|  | __Secure-better-auth.session_token=<signed>                   |  |
|  |   - HttpOnly: true    (pas d'acces JS)                        |  |
|  |   - SameSite: Lax     (protection CSRF)                       |  |
|  |   - Secure: true      (HTTPS only)                            |  |
|  |   - Path: /           (toutes les routes)                     |  |
|  |   - Max-Age: 604800   (7 jours)                               |  |
|  +--------------------------------------------------------------+  |
|                                                                     |
|  Development (pas de prefixe)                                       |
|  +--------------------------------------------------------------+  |
|  | better-auth.session_token=<signed>                             |  |
|  |   - HttpOnly: true                                             |  |
|  |   - SameSite: Lax                                              |  |
|  |   - Secure: false    (localhost OK)                            |  |
|  |   - Path: /                                                    |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+
```

### 4.2 Format du Cookie

```
better-auth.session_token=<base64url(json_payload)>.signature

Structure du payload (json):
{
  "sub": "session_token_value",
  "exp": 1700000000,
  "iat": 1699395200,
  "type": "session"
}

Parametres de signature:
  - Algorithme: HMAC-SHA256
  - Clef: BETTER_AUTH_SECRET (32+ caracteres)
  - Entree: base64url(json_payload)
  - Sortie: base64url(signature)
```

### 4.3 Strategie de Rotation

Better Auth gere le refresh des cookies automatiquement via `session.updateAge`.

Mecanisme de rotation :
```
T0: Creation de la session         [TTL: 7 jours]
T0+24h: Premiere rotation         [updateAge: 24h]
  -> Nouveau cookie, nouvelle signature
  -> Ancien cookie marque comme stale (token toujours valide)
T0+48h: Deuxieme rotation
  -> Ancien stale token expire
T0+7j: Session expiree
```

```typescript
export function getCookieOptions(isProduction: boolean): Record<string, unknown> {
  const prefix = isProduction ? "__Secure-" : ""
  return {
    [prefix + "better-auth.session_token"]: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  }
}
```

### 4.4 Anti-Tampering

```typescript
// src/lib/cookie-verify.ts
import { createHmac, timingSafeEqual } from "crypto"

export function verifyCookieSignature(
  cookieValue: string,
  secret: string,
): { valid: boolean; payload: string | null } {
  try {
    const lastDot = cookieValue.lastIndexOf(".")
    if (lastDot === -1) return { valid: false, payload: null }

    const payload = cookieValue.slice(0, lastDot)
    const receivedSig = cookieValue.slice(lastDot + 1)

    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url")

    const receivedBuf = Buffer.from(receivedSig, "base64url")
    const expectedBuf = Buffer.from(expectedSig, "base64url")

    if (receivedBuf.length !== expectedBuf.length) {
      return { valid: false, payload: null }
    }

    const valid = timingSafeEqual(receivedBuf, expectedBuf)
    return { valid, payload: valid ? payload : null }
  } catch {
    return { valid: false, payload: null }
  }
}

export function extractAndVerifySessionToken(
  cookies: string,
  cookieName: string,
  secret: string,
): string | null {
  const patterns = [
    cookieName,
    "__Secure-" + cookieName,
    "__Host-" + cookieName,
  ]
  for (const name of patterns) {
    const match = cookies.match(new RegExp("(?:^|;)\\s*" + escapeRegex(name) + "=([^;]+)"))
    if (match) {
      const { valid, payload } = verifyCookieSignature(match[1], secret)
      if (valid) {
        try {
          const parsed = JSON.parse(Buffer.from(payload!, "base64url").toString())
          return parsed.sub ?? null
        } catch {
          continue
        }
      }
    }
  }
  return null
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
```

### 4.5 Isolation par Prefixe

| Prefixe | Securite | Use Case | Statut |
|---------|----------|----------|--------|
| Aucun | Standard | Developpement local | Dev |
| `__Secure-` | Haute | Production HTTPS | Prod |
| `__Host-` | Maximale | Sous-domaines isoles | Future |

---
## 5. Authentication Flows

### 5.1 Login Flow (Sequence complete)

```
  +-------+         +----------+         +----------+         +--------+        +--------+
  | Client|        |Middleware|        |  Auth API |        | Better |        |  Redis |
  +-------+         +----------+         +----------+         +--------+        +--------+
      |                 |                    |                  |                 |
      | POST /api/auth/ |                    |                  |                 |
      | sign-in/email   |                    |                  |                 |
      | {email,password}|                    |                  |                 |
      |---------------->|                    |                  |                 |
      |                 |  Forward request   |                  |                 |
      |                 |------------------->|                  |                 |
      |                 |                    |  1. Rate Check   |                 |
      |                 |                    |  (sliding window)|                 |
      |                 |                    |----------------->|                 |
      |                 |                    |  rate:allow      |                 |
      |                 |                    |<-----------------|                 |
      |                 |                    |  2. Verify creds |                 |
      |                 |                    |----------------->|                 |
      |                 |                    |                  |  3. Hash check |
      |                 |                    |                  |  (bcrypt)      |
      |                 |                    |  4. Session      |                 |
      |                 |                    |  CREATED (DB)    |                 |
      |                 |                    |  5. Cache session|                 |
      |                 |                    |--------------------------------->  |
      |                 |                    |  setex session:  |                 |
      |                 |                    |  {id} 7d         |                 |
      |                 |                    |<---------------------------------  |
      |                 |                    |  6. Set cookie   |                 |
      |  Set-Cookie:    |                    |                  |                 |
      |  session_token  |                    |                  |                 |
      |<----------------|<-------------------|                  |                 |
      |  7. Redirect    |                    |                  |                 |
      |  /dashboard     |                    |                  |                 |
      |<----------------|<-------------------|                  |                 |
```

### 5.2 Login (Code Complet)

```typescript
// src/app/api/auth/sign-in/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimitMiddleware } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

const log = logger.child({ module: "auth:sign-in" })
const signInRateLimit = rateLimitMiddleware({ window: 60, max: 5 })

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"

  const rateLimitResponse = await signInRateLimit(request, "sign-in:" + ip)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Email et mot de passe requis" },
        { status: 400 },
      )
    }

    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
        status: "PENDING",
      },
    })

    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers,
    })

    if (!result) {
      await prisma.loginAttempt.updateMany({
        where: { email: email.toLowerCase(), ipAddress: ip, status: "PENDING" },
        data: { status: "FAILED", failureReason: "invalid_credentials" },
      })
      log.warn({ email: email.toLowerCase(), ip }, "Failed login attempt")
      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect" },
        { status: 401 },
      )
    }

    await prisma.loginAttempt.updateMany({
      where: { email: email.toLowerCase(), ipAddress: ip, status: "PENDING" },
      data: { status: "SUCCESS" },
    })

    const fp = request.headers.get("x-device-fingerprint")
    if (fp && result.session) {
      await prisma.session.update({
        where: { id: result.session.id },
        data: { deviceFingerprint: fp },
      })
    }

    log.info({ email: email.toLowerCase(), userId: result.user?.id }, "Successful login")
    const response = NextResponse.json(result)
    return response
  } catch (error) {
    log.error({ error, ip }, "Sign-in error")
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Une erreur est survenue" },
      { status: 500 },
    )
  }
}
```

### 5.3 Register Flow

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimitMiddleware } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const log = logger.child({ module: "auth:register" })
const registerRateLimit = rateLimitMiddleware({ window: 3600, max: 3 })

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"

  const rateLimitResponse = await registerRateLimit(request, "register:" + ip)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const passwordErrors = validatePasswordStrength(body.password)
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { code: "WEAK_PASSWORD", errors: passwordErrors },
        { status: 422 },
      )
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
      headers: request.headers,
    })

    if (!result) {
      return NextResponse.json(
        { code: "REGISTRATION_FAILED", message: "Inscription echouee" },
        { status: 400 },
      )
    }

    log.info({ userId: result.user?.id, email: body.email, ip }, "New user registered")
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    log.error({ error, ip }, "Registration error")
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Une erreur est survenue" },
      { status: 500 },
    )
  }
}

function validatePasswordStrength(password: string): string[] {
  const errors: string[] = []
  if (password.length < 10) errors.push("Minimum 10 caracteres")
  if (!/[A-Z]/.test(password)) errors.push("Au moins une majuscule")
  if (!/[a-z]/.test(password)) errors.push("Au moins une minuscule")
  if (!/[0-9]/.test(password)) errors.push("Au moins un chiffre")
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Au moins un caractere special")
  return errors
}
```

### 5.4 Password Reset Flow

```typescript
export async function requestPasswordReset(email: string): Promise<void> {
  await auth.api.forgetPassword({ body: { email } })
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const errors = validatePasswordStrength(newPassword)
  if (errors.length > 0) throw new Error("WEAK_PASSWORD:" + errors.join(","))
  const result = await auth.api.resetPassword({ body: { token, newPassword } })
  if (!result) throw new Error("INVALID_RESET_TOKEN")
  if (result.session) {
    await revokeAllSessions(result.user.id, result.session.id, "PASSWORD_CHANGED")
  }
}
```

### 5.5 Email Verification Flow

```typescript
export async function verifyEmail(token: string): Promise<void> {
  const result = await auth.api.verifyEmail({ body: { token } })
  if (!result) throw new Error("INVALID_VERIFICATION_TOKEN")
  log.info({ userId: result.user.id }, "Email verified")
}

export async function resendVerification(email: string): Promise<void> {
  await auth.api.sendVerificationEmail({ body: { email } })
}
```

---

## 6. OAuth Integration

### 6.1 Providers

```typescript
import { google, discord } from "better-auth/plugins/oauth"

export const auth = betterAuth({
  plugins: [
    nextCookies(),
    twoFactor({...}),
    admin({...}),
    google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: process.env.NEXT_PUBLIC_APP_URL + "/api/auth/callback/google",
      scope: ["openid", "email", "profile"],
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        allowDifferentEmails: false,
      },
    }),
    discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      redirectURI: process.env.NEXT_PUBLIC_APP_URL + "/api/auth/callback/discord",
      scope: ["identify", "email"],
    }),
  ],
})
```

### 6.2 Account Linking

```typescript
// src/lib/account-linking.ts
import { prisma } from "./db"
import { logger } from "./logger"

const log = logger.child({ module: "account-linking" })

export async function linkOAuthAccount(
  userId: string,
  providerId: string,
  accountId: string,
  accessToken: string | null,
  refreshToken: string | null,
  scope: string | null,
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.account.findUnique({
    where: { providerId_accountId: { providerId, accountId } },
  })
  if (existing) {
    if (existing.userId !== userId) {
      return { success: false, error: "Ce compte est deja lie a un autre utilisateur" }
    }
    return { success: true }
  }
  await prisma.account.create({
    data: { userId, providerId, accountId, accessToken, refreshToken, scope },
  })
  log.info({ userId, providerId, accountId }, "OAuth account linked")
  return { success: true }
}

export async function unlinkOAuthAccount(
  userId: string,
  providerId: string,
): Promise<{ success: boolean; error?: string }> {
  const accounts = await prisma.account.findMany({ where: { userId } })
  const hasPassword = accounts.some((a) => a.providerId === "credential")
  const oauthCount = accounts.filter((a) => a.providerId !== "credential").length
  if (!hasPassword && oauthCount <= 1) {
    return {
      success: false,
      error: "Vous devez avoir un mot de passe ou un autre compte OAuth lie",
    }
  }
  await prisma.account.deleteMany({ where: { userId, providerId } })
  log.info({ userId, providerId }, "OAuth account unlinked")
  return { success: true }
}
```

### 6.3 Token Management

```typescript
// src/lib/oauth-tokens.ts
import { prisma } from "./db"
import { logger } from "./logger"

const log = logger.child({ module: "oauth-tokens" })

export async function storeOAuthToken(
  accountId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
): Promise<void> {
  await prisma.account.update({
    where: { id: accountId },
    data: {
      accessToken,
      refreshToken: refreshToken,
      accessTokenExpiresAt: expiresAt,
    },
  })
}

export async function refreshOAuthToken(
  userId: string,
  providerId: string,
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId },
  })
  if (!account?.refreshToken) return null

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
    })
    if (!response.ok) {
      log.error({ userId, providerId, status: response.status }, "Token refresh failed")
      return null
    }
    const data = await response.json()
    const newExpiry = new Date(Date.now() + data.expires_in * 1000)
    await storeOAuthToken(account.id, data.access_token, data.refresh_token ?? account.refreshToken, newExpiry)
    return data.access_token
  } catch (error) {
    log.error({ error, userId, providerId }, "Token refresh error")
    return null
  }
}
```

---

## 7. 2FA/MFA

### 7.1 State Machine

```
                    +------------------+
                    |    DISABLED      |
                    +--------+---------+
                             | enable
                             v
                    +------------------+
             +------|  PENDING_SETUP   |-------+
             |      +--------+---------+       |
        verify totp         |                  cancel
             |         setup complete          |
             v              v                   v
     +-------------+ +------------------+  +----------+
     | NEEDS_VERIF | |     ACTIVE       |  | DISABLED |
     | (pending)   | |  (totp/email)   |  +----------+
     +-------------+ +--------+---------+
             |                |
        verify totp      disable 2fa
             |                |
             v                v
     +-------------+ +------------------+
     |   ACTIVE    | |    DISABLED      |
     +-------------+ +------------------+
             |
        lost device
             |
             v
     +------------------+
     | RECOVERY_MODE    |
     | (backup codes)   |
     +--------+---------+
              |
         valid code
              |
              v
     +------------------+
     |   ACTIVE         |
     +------------------+
```

### 7.2 Transitions de la State Machine 2FA

| Transition | From | To | Declencheur | Validation |
|-----------|------|----|-------------|-----------|
| T1 | DISABLED | PENDING_SETUP | User initie setup | Mot de passe requis |
| T2 | PENDING_SETUP | ACTIVE | TOTP verify reussi | TOTP a 6 chiffres |
| T3 | PENDING_SETUP | DISABLED | Annulation | Aucune |
| T4 | ACTIVE | NEEDS_VERIF | Login avec 2FA requis | Session partielle |
| T5 | NEEDS_VERIF | ACTIVE | TOTP/email OTP valide | Code a 6 chiffres |
| T6 | ACTIVE | RECOVERY_MODE | Perte d'acces | Backup code valide |
| T7 | RECOVERY_MODE | ACTIVE | Backup code valide | Code de recuperation |
| T8 | ACTIVE | DISABLED | User desactive 2FA | Mot de passe requis |
| T9 | RECOVERY_MODE | DISABLED | Admin reinitialise | Admin auth |

### 7.3 Configuration TOTP

```typescript
import { twoFactor } from "better-auth/plugins/two-factor"

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "NBA Platform",
      totpOptions: {
        digits: 6,
        period: 30,
        algorithm: "SHA1",
        window: 1,
      },
      backupCodeOptions: {
        count: 8,
        length: 12,
        format: "alphanumeric",
      },
      strategies: ["totp", "email"],
      otpOptions: {
        expiresIn: 300,
        length: 6,
        rateLimit: {
          maxAttempts: 5,
          window: 300,
        },
      },
      skipVerification: {
        enabled: true,
        allowedIpRanges: ["10.0.0.0/8", "172.16.0.0/12"],
        trustDevice: {
          enabled: true,
          maxAge: 60 * 60 * 24 * 30,
          cookieName: "trusted-device",
        },
      },
    }),
  ],
})
```

### 7.4 Code TOTP - Verification et Setup

```typescript
// src/lib/two-factor.ts
import { prisma } from "./db"
import { logger } from "./logger"

const log = logger.child({ module: "two-factor" })

export async function setupTOTP(
  userId: string,
  password: string,
): Promise<{ secret: string; uri: string; qrCode: string } | { error: string }> {
  try {
    const result = await auth.api.twoFactor.createTotp({
      body: { password },
      headers: new Headers({ "x-user-id": userId }),
    } as any)
    if (!result) return { error: "Echec de la configuration TOTP" }
    return { secret: result.secret, uri: result.uri, qrCode: result.qrCode }
  } catch (error) {
    log.error({ error, userId }, "TOTP setup failed")
    return { error: "Mot de passe incorrect" }
  }
}

export async function verifyAndEnableTOTP(
  userId: string,
  code: string,
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    const result = await auth.api.twoFactor.verifyTotp({
      body: { code },
      headers: new Headers({ "x-user-id": userId }),
    } as any)
    if (!result) return { success: false, error: "Code invalide" }
    log.info({ userId }, "TOTP enabled successfully")
    return { success: true, backupCodes: result.backupCodes }
  } catch (error) {
    return { success: false, error: "Code invalide ou expire" }
  }
}

export async function verifyTwoFactorCode(
  userId: string,
  code: string,
  strategy: "totp" | "email",
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await auth.api.twoFactor.verify({
      body: { code, strategy },
      headers: new Headers({ "x-user-id": userId }),
    } as any)
    if (!result) return { success: false, error: "Code invalide" }
    return { success: true }
  } catch (error) {
    return { success: false, error: "Code invalide ou expire" }
  }
}

export async function useBackupCode(
  userId: string,
  backupCode: string,
): Promise<{ success: boolean; remaining: number; error?: string }> {
  const code = await prisma.twoFactorBackupCode.findUnique({
    where: { userId_code: { userId, code: backupCode } },
  })
  if (!code || code.usedAt) {
    return { success: false, remaining: 0, error: "Code invalide ou deja utilise" }
  }
  await prisma.twoFactorBackupCode.update({
    where: { id: code.id },
    data: { usedAt: new Date() },
  })
  const remaining = await prisma.twoFactorBackupCode.count({
    where: { userId, usedAt: null },
  })
  log.warn({ userId, remaining }, "Backup code used")
  return { success: true, remaining }
}
```

### 7.5 Backup Codes - Gestion

```typescript
// src/lib/backup-codes.ts
import { prisma } from "./db"
import { randomBytes, createHash } from "crypto"

export async function generateBackupCodes(
  userId: string,
  count: number = 8,
  length: number = 12,
): Promise<{ codes: string[]; generatedAt: Date }> {
  await prisma.twoFactorBackupCode.deleteMany({ where: { userId } })
  const codes: string[] = []
  const codesData: Array<{ userId: string; code: string; createdAt: Date }> = []
  for (let i = 0; i < count; i++) {
    const code = generateCode(length)
    const hash = createHash("sha256").update(code).digest("hex")
    codes.push(formatCode(code))
    codesData.push({ userId, code: hash, createdAt: new Date() })
  }
  await prisma.twoFactorBackupCode.createMany({ data: codesData })
  return { codes, generatedAt: new Date() }
}

function generateCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code
}
```

---
## 8. Device Management

### 8.1 Modele de Confiance

```
                    +-------------------+
                    |  TRUSTED          |
                    |  - 2FA bypass     |
                    |  - 30 jours       |
                    |  - Known IPs      |
                    +--------+----------+
                             |
                    +--------v----------+
                    |  VERIFIED         |
                    |  - Email code     |
                    |  - Known device   |
                    |  - 7 jours        |
                    +--------+----------+
                             |
                    +--------v----------+
                    |  RECOGNIZED       |
                    |  - Cookie         |
                    |  - Fingerprint    |
                    |  - IP geoloc      |
                    +--------+----------+
                             |
                    +--------v----------+
                    |  UNKNOWN          |
                    |  - New device     |
                    |  - New IP         |
                    |  - New browser    |
                    +-------------------+
```

### 8.2 Fingerprinting

```typescript
// src/lib/device-fingerprint.ts
import { createHash } from "crypto"
import { prisma } from "./db"
import { logger } from "./logger"

const log = logger.child({ module: "device-fingerprint" })

export interface DeviceFingerprint {
  hash: string
  components: {
    userAgent: string
    platform: string
    language: string
    colorDepth: number
    screenResolution: string
    timezone: string
    canvas: string | null
    webgl: string | null
    fonts: string[]
    audio: string | null
  }
}

export function generateFingerprint(
  components: DeviceFingerprint["components"],
): string {
  const data = [
    components.userAgent,
    components.platform,
    components.language,
    components.colorDepth.toString(),
    components.screenResolution,
    components.timezone,
    components.canvas ?? "",
    components.webgl ?? "",
    components.audio ?? "",
    ...components.fonts,
  ].join("|")
  return createHash("sha256").update(data).digest("hex")
}

export function collectFingerprintComponents(
  headers: Headers,
): Partial<DeviceFingerprint["components"]> {
  return {
    userAgent: headers.get("user-agent") ?? "",
    platform: headers.get("sec-ch-ua-platform") ?? "",
    language: headers.get("accept-language") ?? "",
  }
}

export async function registerDevice(
  userId: string,
  fingerprint: string,
  metadata: {
    name?: string
    ipAddress?: string
    userAgent?: string
    deviceType?: string
    brand?: string
    model?: string
    os?: string
    browser?: string
  },
): Promise<{ deviceId: string; isNew: boolean }> {
  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint } },
  })
  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        ipAddress: metadata.ipAddress ?? existing.ipAddress,
        userAgent: metadata.userAgent ?? existing.userAgent,
      },
    })
    return { deviceId: existing.id, isNew: false }
  }
  const device = await prisma.device.create({
    data: {
      userId, fingerprint,
      name: metadata.name,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceType: metadata.deviceType,
      brand: metadata.brand,
      model: metadata.model,
      os: metadata.os,
      browser: metadata.browser,
      trusted: false,
    },
  })
  log.info({ userId, deviceId: device.id }, "New device registered")
  return { deviceId: device.id, isNew: true }
}

export async function revokeDevice(userId: string, deviceId: string): Promise<void> {
  const device = await prisma.device.findFirst({ where: { id: deviceId, userId } })
  if (!device) throw new Error("Appareil introuvable")
  await prisma.device.update({
    where: { id: deviceId },
    data: { trusted: false },
  })
  await revokeAllSessions(userId, undefined, "DEVICE_UNTRUSTED")
  log.warn({ userId, deviceId }, "Device trust revoked")
}
```

### 8.3 API de Gestion des Appareils

```typescript
// src/app/api/auth/devices/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { revokeDevice } from "@/lib/device-fingerprint"
import { rateLimitOrDeny } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const session = await requireAuth()
  const devices = await prisma.device.findMany({
    where: { userId: session.user.id },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true, name: true, deviceType: true,
      brand: true, model: true, os: true,
      browser: true, trusted: true,
      lastSeenAt: true, createdAt: true,
    },
  })
  return NextResponse.json({ devices })
}

export async function DELETE(request: NextRequest) {
  const session = await requireAuth()
  const rateLimit = await rateLimitOrDeny("DEVICE_MUTATION", session.user.id)
  if (rateLimit) return rateLimit
  const body = await request.json()
  const { deviceId } = body
  if (!deviceId) {
    return NextResponse.json(
      { code: "MISSING_DEVICE_ID", message: "ID d'appareil requis" },
      { status: 400 },
    )
  }
  await revokeDevice(session.user.id, deviceId)
  return NextResponse.json({ success: true })
}
```

---

## 9. Rate Limiting

### 9.1 Architecture Multi-Couche

```
+--------------------------------------------------------------+
|                   RATE LIMITING STACK                         |
+--------------------------------------------------------------+
|                                                              |
|  Couche 1: Cloudflare (WAF)                                  |
|  - IP-based: 1000 req/min                                    |
|  - DDoS protection                                           |
|  - Bot management                                            |
+--------------------------------------------------------------+
|                                                              |
|  Couche 2: Better Auth (built-in)                            |
|  - Endpoints specifiques (/sign-in, /sign-up)                |
|  - Window: 60s                                               |
|  - Max: 5 (sign-in), 3 (sign-up/3600s)                      |
+--------------------------------------------------------------+
|                                                              |
|  Couche 3: Application (Redis sliding window)                |
|  - IP + User ID + Endpoint                                   |
|  - ~25 rate limits definis                                   |
|  - Fallback local LRU (si Redis indisponible)                |
+--------------------------------------------------------------+
|                                                              |
|  Couche 4: Business Logic                                    |
|  - Session creation limits                                   |
|  - Device registration limits                                |
|  - Plan-based throttling                                     |
+--------------------------------------------------------------+
```

### 9.2 Implementation Redis (Sliding Window)

```typescript
// src/lib/rate-limit.ts (version complete avec fallback local)
import { redis } from "./redis"
import { logger } from "./logger"

const log = logger.child({ module: "rate-limit" })
const localCache = new Map<string, { timestamp: number; count: number }>()
const LOCAL_CACHE_MAX = 1000

export interface RateLimitConfig {
  window: number
  max: number
  blockDuration?: number
}

export const rateLimits = {
  AUTH_SIGN_IN: { window: 60, max: 5, blockDuration: 300 },
  AUTH_CHECK_LOGIN: { window: 60, max: 10 },
  ONBOARDING_SEND_OTP: { window: 60, max: 3, blockDuration: 600 },
  ONBOARDING_VERIFY_OTP: { window: 60, max: 5, blockDuration: 300 },
  ONBOARDING_KYC: { window: 3600, max: 5 },
  PUSH_SUBSCRIBE: { window: 60, max: 10 },
  SUPPORT_SEND: { window: 3600, max: 5 },
  MESSAGE_SEND: { window: 60, max: 20 },
  DEVICE_MUTATION: { window: 60, max: 10 },
  CHANGE_PASSWORD: { window: 3600, max: 5 },
  CHANGE_EMAIL: { window: 3600, max: 3, blockDuration: 3600 },
  DELETE_ACCOUNT: { window: 3600, max: 2, blockDuration: 3600 },
  ADMIN_MEMBER_MUTATION: { window: 60, max: 10 },
  SELECT_PLAN: { window: 60, max: 5 },
} as const

export type RateLimitName = keyof typeof rateLimits

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
  blocked: boolean
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const rkey = "ratelimit:sw:" + key
    const now = Date.now()
    const windowStart = now - config.window * 1000
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(rkey, 0, windowStart)
    pipeline.zadd(rkey, now.toString(), now + ":" + crypto.randomUUID().slice(0, 8))
    pipeline.zcard(rkey)
    pipeline.expire(rkey, config.window + (config.blockDuration ?? 0))
    const results = await pipeline.exec()
    const count = (results?.[2]?.[1] as number) ?? 0
    const remaining = Math.max(0, config.max - count)
    const blocked = count > config.max && (config.blockDuration ?? 0) > 0
    return {
      allowed: count <= config.max,
      remaining,
      resetIn: blocked ? (config.blockDuration ?? 0) : config.window,
      blocked,
    }
  } catch (error) {
    log.warn({ error, key }, "Redis rate limit failed, using local fallback")
    return localFallback(key, config)
  }
}

function localFallback(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const cached = localCache.get(key)
  if (!cached || (now - cached.timestamp) > config.window * 1000) {
    if (localCache.size >= LOCAL_CACHE_MAX) {
      const oldest = localCache.entries().next().value
      if (oldest) localCache.delete(oldest[0])
    }
    localCache.set(key, { timestamp: now, count: 1 })
    return { allowed: true, remaining: config.max - 1, resetIn: config.window, blocked: false }
  }
  cached.count++
  const remaining = Math.max(0, config.max - cached.count)
  const blocked = cached.count > config.max && (config.blockDuration ?? 0) > 0
  return {
    allowed: cached.count <= config.max,
    remaining,
    resetIn: blocked ? (config.blockDuration ?? 0) : config.window,
    blocked,
  }
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request, prefix: string): Promise<Response | null> => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown"
    const key = prefix + ":" + ip
    const result = await checkRateLimit(key, config)
    if (result.blocked) {
      log.warn({ key, ip, prefix, remaining: result.remaining }, "Rate limit blocked")
      return new Response(JSON.stringify({
        code: "RATE_LIMIT_BLOCKED",
        message: result.blocked
          ? "Trop de tentatives. Compte temporairement bloque."
          : "Trop de requetes. Reessayez plus tard.",
        retryAfter: result.resetIn,
      }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": result.resetIn.toString(),
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.resetIn.toString(),
        },
      })
    }
    return null
  }
}

export async function rateLimitOrDeny(
  name: RateLimitName,
  identifier: string,
): Promise<Response | null> {
  const config = rateLimits[name]
  const result = await checkRateLimit(name + ":" + identifier, config)
  if (!result.allowed) {
    log.warn({ name, identifier, remaining: result.remaining }, "Business rate limit exceeded")
    return new Response(JSON.stringify({
      code: "BUSINESS_RATE_LIMIT",
      message: "Trop de requetes. Reessayez plus tard.",
      retryAfter: result.resetIn,
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": result.resetIn.toString(),
        "X-RateLimit-Limit": config.max.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetIn.toString(),
      },
    })
  }
  return null
}
```

### 9.3 Table des Rate Limits

| Clef | Fenetre | Max | Blocage | Endpoints concernes |
|------|---------|-----|---------|---------------------|
| AUTH_SIGN_IN | 60s | 5 | 5min | POST /api/auth/sign-in |
| AUTH_CHECK_LOGIN | 60s | 10 | - | GET /api/auth/check-login |
| ONBOARDING_SEND_OTP | 60s | 3 | 10min | POST /api/onboarding/send-otp |
| ONBOARDING_VERIFY_OTP | 60s | 5 | 5min | POST /api/onboarding/verify-otp |
| PUSH_SUBSCRIBE | 60s | 10 | - | POST /api/push/subscribe |
| MESSAGE_SEND | 60s | 20 | - | POST /api/messages |
| DEVICE_MUTATION | 60s | 10 | - | DELETE /api/auth/devices |
| CHANGE_PASSWORD | 3600s | 5 | - | POST /api/auth/change-password |
| SELECT_PLAN | 60s | 5 | - | POST /api/public/select-plan |
| DELETE_ACCOUNT | 3600s | 2 | 1h | DELETE /api/account |

---

## 10. Security Events & Audit

### 10.1 Types d'Evenements

```typescript
// src/lib/security-events.ts
export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGIN_NEW_DEVICE = "LOGIN_NEW_DEVICE",
  LOGIN_NEW_IP = "LOGIN_NEW_IP",
  LOGIN_BLOCKED_RATE_LIMIT = "LOGIN_BLOCKED_RATE_LIMIT",
  SESSION_CREATED = "SESSION_CREATED",
  SESSION_REVOKED = "SESSION_REVOKED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_ROTATED = "SESSION_ROTATED",
  SESSION_HIJACK_ATTEMPT = "SESSION_HIJACK_ATTEMPT",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED",
  TWO_FACTOR_VERIFIED = "TWO_FACTOR_VERIFIED",
  TWO_FACTOR_FAILED = "TWO_FACTOR_FAILED",
  TWO_FACTOR_BACKUP_CODE_USED = "TWO_FACTOR_BACKUP_CODE_USED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  EMAIL_CHANGED = "EMAIL_CHANGED",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  ACCOUNT_DELETED = "ACCOUNT_DELETED",
  DEVICE_REGISTERED = "DEVICE_REGISTERED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  CSRF_ATTEMPT = "CSRF_ATTEMPT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export enum SecuritySeverity {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}
```

### 10.2 Chaine d'Integrite (Blockchain-like Audit)

```typescript
// src/lib/audit-chain.ts
import { createHash } from "crypto"
import { prisma } from "./db"
import { logger } from "./logger"

const log = logger.child({ module: "audit-chain" })

export async function recordSecurityEvent(
  event: {
    userId?: string
    type: string
    resourceType: string
    resourceId?: string
    details?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    severity: string
  },
): Promise<void> {
  const lastEntry = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  })
  const previousHash = lastEntry?.hash ?? null
  const content = JSON.stringify({
    userId: event.userId,
    type: event.type,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details,
    ipAddress: event.ipAddress,
    timestamp: new Date().toISOString(),
    previousHash,
  })
  const hash = createHash("sha256").update(content).digest("hex")
  await prisma.auditLog.create({
    data: {
      userId: event.userId,
      action: event.type,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      details: event.details as any,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      severity: event.severity,
      hash,
      previousHash,
      searchText: (event.type + " " + event.resourceType + " " + (event.userId ?? "")).toLowerCase(),
    },
  })
}

export async function verifyAuditChain(
  from: Date,
  to: Date,
): Promise<{ valid: boolean; brokenLinks: number; totalEntries: number }> {
  const entries = await prisma.auditLog.findMany({
    where: { createdAt: { gte: from, lte: to }, hash: { not: null } },
    orderBy: { createdAt: "asc" },
  })
  let brokenLinks = 0
  let previousHash: string | null = null
  for (const entry of entries) {
    if (entry.previousHash !== previousHash) brokenLinks++
    const content = JSON.stringify({
      userId: entry.userId,
      type: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      timestamp: entry.createdAt.toISOString(),
      previousHash: entry.previousHash,
    })
    const expectedHash = createHash("sha256").update(content).digest("hex")
    if (entry.hash !== expectedHash) brokenLinks++
    previousHash = entry.hash ?? null
  }
  const valid = brokenLinks === 0
  if (!valid) log.error({ brokenLinks, totalEntries: entries.length }, "Audit chain integrity compromised")
  return { valid, brokenLinks, totalEntries: entries.length }
}
```

### 10.3 Tableau de Bord d'Audit

```typescript
// src/app/api/admin/audit/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  await requireRole(["SUPER_ADMIN", "ADMIN"])
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)
  const severity = searchParams.get("severity")
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const where: Record<string, unknown> = {}
  if (severity) where.severity = severity
  if (action) where.action = action
  if (userId) where.userId = userId
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }
  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where: where as any }),
  ])
  return NextResponse.json({
    entries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
```

---

## 11. Password Policies

### 11.1 Configuration

```typescript
// src/lib/password-policy.ts
import { createHash, randomBytes } from "crypto"
import { prisma } from "./db"
import { redis } from "./redis"

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  historyCount: number
  maxAgeDays: number
  breachCheckEnabled: boolean
  hashRounds: number
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  historyCount: 5,
  maxAgeDays: 90,
  breachCheckEnabled: true,
  hashRounds: 12,
}

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): { valid: boolean; errors: string[]; score: number } {
  const errors: string[] = []
  let score = 0
  if (password.length < policy.minLength) {
    errors.push("Minimum " + policy.minLength + " caracteres")
  } else {
    score += Math.min(password.length / policy.minLength, 3) * 10
  }
  if (password.length > policy.maxLength) {
    errors.push("Maximum " + policy.maxLength + " caracteres")
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Au moins une lettre majuscule")
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Au moins une lettre minuscule")
  } else if (/[a-z]/.test(password)) {
    score += 10
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Au moins un chiffre")
  } else if (/[0-9]/.test(password)) {
    score += 15
  }
  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Au moins un caractere special")
  } else if (/[^A-Za-z0-9]/.test(password)) {
    score += 20
  }
  if (/(.)\1{2,}/.test(password)) errors.push("Pas de caracteres repetes 3+ fois")
  else score += 10
  if (/^[a-zA-Z]+$/.test(password)) errors.push("Melangez lettres, chiffres et symboles")
  if (/^(?:password|123456|qwerty|azerty)/i.test(password)) {
    errors.push("Mot de passe trop commun")
  } else score += 20
  return { valid: errors.length === 0, errors, score: Math.min(score, 100) }
}

export async function checkBreachedPassword(password: string): Promise<boolean> {
  const hash = createHash("sha1").update(password).digest("hex").toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  const cached = await redis.get("pwned:" + prefix)
  if (cached) {
    return cached.split(",").includes(suffix)
  }
  try {
    const response = await fetch("https://api.pwnedpasswords.com/range/" + prefix,
      { signal: AbortSignal.timeout(3000) },
    )
    if (!response.ok) return false
    const data = await response.text()
    const hashes = data.split("\r\n").map((line) => line.split(":")[0])
    await redis.setex("pwned:" + prefix, 3600, hashes.join(","))
    return hashes.includes(suffix)
  } catch {
    return false
  }
}
```

### 11.2 Hashing (bcrypt)

Better Auth utilise bcrypt avec 12 rounds de salage.

```
Password ---> bcrypt(rounds=12) ---> $2b$12$XXXXXXXXXXXXXXXXXXXXXXXXX...
                                    |    |   |
                                    |    |   +-- Salt (22 chars) + Hash (31 chars)
                                    |    +------ rounds = 12
                                    +----------- Algorithme = $2b$
```

---

## 12. Session Hijacking Protection

### 12.1 Detection d'Anomalies

```typescript
// src/lib/session-anomaly.ts
import { prisma } from "./db"
import { redis } from "./redis"
import { recordSecurityEvent } from "./audit-chain"
import { revokeAllSessions } from "./session-revocation"
import { logger } from "./logger"

const log = logger.child({ module: "session-anomaly" })

export interface AnomalyCheckResult {
  isAnomalous: boolean
  reasons: string[]
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}

export async function detectSessionAnomaly(
  sessionId: string,
  userId: string,
  currentIp: string,
  currentUserAgent: string,
  currentFingerprint: string | null,
): Promise<AnomalyCheckResult> {
  const reasons: string[] = []
  let maxSeverity: AnomalyCheckResult["severity"] = "LOW"
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  })
  if (!session) {
    return { isAnomalous: true, reasons: ["Session introuvable"], severity: "HIGH" }
  }
  if (session.ipAddress && session.ipAddress !== currentIp) {
    reasons.push("IP change: " + session.ipAddress + " -> " + currentIp)
    maxSeverity = "MEDIUM"
  }
  if (session.userAgent && session.userAgent !== currentUserAgent) {
    reasons.push("User-Agent change")
    maxSeverity = "HIGH"
  }
  if (currentFingerprint) {
    const sessionDevice = await prisma.device.findFirst({
      where: { userId, fingerprint: currentFingerprint },
    })
    if (!sessionDevice) {
      reasons.push("Nouvel appareil non reconnu")
      maxSeverity = maxSeverity === "CRITICAL" ? "CRITICAL" : "MEDIUM"
    }
  }
  if (session.lastVerifiedAt) {
    const hoursSinceVerification =
      (Date.now() - session.lastVerifiedAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceVerification < 1 && session.ipAddress !== currentIp) {
      reasons.push("Changement d'IP rapide (< 1h)")
      maxSeverity = "CRITICAL"
    }
  }
  const isAnomalous = reasons.length > 0
  if (isAnomalous) {
    log.warn({ sessionId, userId, reasons, severity: maxSeverity }, "Session anomaly detected")
    await recordSecurityEvent({
      userId,
      type: "SESSION_HIJACK_ATTEMPT",
      resourceType: "session",
      resourceId: sessionId,
      details: { reasons, severity: maxSeverity, currentIp, currentUserAgent },
      ipAddress: currentIp,
      userAgent: currentUserAgent,
      severity: maxSeverity === "CRITICAL" ? "CRITICAL" : "WARN",
    })
    if (maxSeverity === "CRITICAL") {
      await revokeAllSessions(userId, sessionId, "SUSPICIOUS_ACTIVITY")
    }
  }
  return { isAnomalous, reasons, severity: maxSeverity }
}
```

---
## 13. WebSocket Authentication
### 13.1 Architecture
```
  +----------+      +--------------+      +--------------+
  |  Client   |      |  Next.js     |      |  WS Worker   |
  | Socket.IO |      |  (main)      |      |  (port 3001) |
  +-----+-----+      +------+-------+      +------+-------+
        |                   |                     |
        | 1. Login          |                     |
        |------------------>|                     |
        | 2. Set-Cookie     |                     |
        |<------------------|                     |
        |                   |                     |
        | 3. WS Connect     |                     |
        | Cookie: session   |-------------------->|
        |                   |                     |
        |                   |   4. Verify HMAC    |
        |                   |   5. Verify session |
        |                   |   6. Bind WS room   |
        |                   |      (user:userId)  |
        | 7. Connected      |                     |
        |<----------------------------------------|
```
### 13.2 Implementation
```typescript
// workers/ws-auth.ts -- Authentification WebSocket
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "../src/lib/db"
import { redis } from "../src/lib/redis"
import { logger } from "../src/lib/logger"
const log = logger.child({ module: "ws-auth" })
export interface AuthenticatedSocket {
  userId: string
  sessionId: string
  deviceFingerprint: string | null
}
export async function verifySignedCookie(
  cookieValue: string,
  secret: string,
): Promise<string | null> {
  try {
    const decoded = decodeURIComponent(cookieValue)
    const lastDot = decoded.lastIndexOf(".")
    if (lastDot === -1) return null
    const value = decoded.slice(0, lastDot)
    const b64Signature = decoded.slice(lastDot + 1)
    const signature = Buffer.from(b64Signature, "base64")
    const expected = createHmac("sha256", secret).update(value).digest()
    if (signature.length !== expected.length) return null
    if (!timingSafeEqual(signature, expected)) return null
    return value
  } catch {
    return null
  }
}
export function extractSessionToken(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";").map((c) => c.trim())
  const names = [
    cookieName,
    "__Secure-" + cookieName,
    "__Host-" + cookieName,
  ]
  for (const cookie of cookies) {
    const eq = cookie.indexOf("=")
    if (eq === -1) continue
    const name = cookie.slice(0, eq)
    if (names.includes(name)) {
      return cookie.slice(eq + 1)
    }
  }
  return null
}
export async function authenticateSocket(
  cookieHeader: string | undefined,
  clientIp: string,
): Promise<AuthenticatedSocket | null> {
  try {
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) {
      log.error("BETTER_AUTH_SECRET not configured")
      return null
    }
    const cookieValue = extractSessionToken(cookieHeader, "better-auth.session_token")
    if (!cookieValue) {
      log.warn({ ip: clientIp }, "No session cookie found")
      return null
    }
    const payload = await verifySignedCookie(cookieValue, secret)
    if (!payload) {
      log.warn({ ip: clientIp }, "Invalid cookie signature")
      return null
    }
    const sessionToken = payload
    const cachedSession = await redis.get("session:token:" + sessionToken)
    let session
    if (cachedSession) {
      session = JSON.parse(cachedSession)
    } else {
      session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: {
          id: true, userId: true, expiresAt: true,
          deviceFingerprint: true,
          user: { select: { isActive: true } },
        },
      })
      if (session) {
        await redis.setex("session:token:" + sessionToken,
          300, JSON.stringify(session),
        )
      }
    }
    if (!session) {
      log.warn({ ip: clientIp }, "Session not found")
      return null
    }
    if (new Date() > new Date(session.expiresAt)) {
      log.warn({ userId: session.userId }, "Expired session")
      return null
    }
    if (!session.user?.isActive) {
      log.warn({ userId: session.userId }, "Inactive user")
      return null
    }
    log.info({ userId: session.userId, sessionId: session.id, ip: clientIp },
      "WebSocket authenticated")
    return {
      userId: session.userId,
      sessionId: session.id,
      deviceFingerprint: session.deviceFingerprint ?? null,
    }
  } catch (error) {
    log.error({ error, ip: clientIp }, "WebSocket auth error")
    return null
  }
}
```
### 13.3 WebSocket Worker -- Binding de Session
```typescript
// workers/websocket.ts (extrait)
import { Server as SocketIOServer } from "socket.io"
import { authenticateSocket } from "./ws-auth"
import { logger } from "../src/lib/logger"
const log = logger.child({ module: "websocket" })
export function createSocketServer(httpServer: any) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  })
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie
    const clientIp = socket.handshake.address
    const auth = await authenticateSocket(cookieHeader, clientIp)
    if (!auth) {
      return next(new Error("Non authorise"))
    }
    ;(socket as any).data.userId = auth.userId
    ;(socket as any).data.sessionId = auth.sessionId
    ;(socket as any).data.deviceFingerprint = auth.deviceFingerprint
    next()
  })
  io.on("connection", (socket) => {
    const userId = (socket as any).data.userId
    const sessionId = (socket as any).data.sessionId
    socket.join("user:" + userId)
    socket.join("session:" + sessionId)
    log.info({ userId, sessionId, socketId: socket.id }, "Socket connected")
    socket.on("disconnect", (reason) => {
      log.info({ userId, sessionId, reason }, "Socket disconnected")
    })
    socket.on("error", (error) => {
      log.error({ error, userId }, "Socket error")
    })
    socket.on("ping", () => {
      socket.emit("pong")
    })
  })
  return io
}
```
---
## 14. Middleware Security
### 14.1 Middleware Principal
```typescript
// src/middleware.ts -- Version complete avec securite renforcee
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { csrfCheck } from "./lib/csrf"
import { logger } from "./lib/logger"
const log = logger.child({ module: "middleware" })
const PUBLIC_PREFIXES = [
  "/_next", "/api/auth", "/api/public",
  "/api/webhooks", "/api/telegram", "/favicon",
]
const PUBLIC_PATHS = [
  "/login", "/register", "/forgot-password",
  "/reset-password", "/cgu", "/privacy",
  "/cookies", "/risk-disclaimer", "/maintenance",
]
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]
const PROTECTED_PREFIXES = ["/onboarding", "/dashboard", "/admin"]
const SESSION_COOKIES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
  "__Host-better-auth.session_token",
]
function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => SESSION_COOKIES.includes(c.name))
}
function addSecurityHeaders(res: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.telegram.org https://api.resend.com wss://*.signauxx.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
  res.headers.set("Content-Security-Policy", csp)
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return res
}
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = crypto.randomUUID().slice(0, 8).toUpperCase()
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
      pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    const res = NextResponse.next()
    res.headers.set("x-request-id", requestId)
    return addSecurityHeaders(res)
  }
  if (process.env.MAINTENANCE_MODE === "true" &&
      pathname !== "/maintenance" &&
      !pathname.startsWith("/api/webhooks")) {
    const res = NextResponse.redirect(new URL("/maintenance", request.url))
    res.headers.set("x-request-id", requestId)
    return addSecurityHeaders(res)
  }
  if (pathname.startsWith("/api/")) {
    const blocked = csrfCheck(request)
    if (blocked) {
      log.warn({ pathname, requestId, method: request.method }, "CSRF blocked")
      blocked.headers.set("x-request-id", requestId)
      return addSecurityHeaders(blocked)
    }
  }
  const isAuthenticated = hasSession(request)
  if (pathname === "/") {
    const url = isAuthenticated ? "/dashboard" : "/login"
    const res = NextResponse.redirect(new URL(url, request.url))
    res.headers.set("x-request-id", requestId)
    return addSecurityHeaders(res)
  }
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      const res = NextResponse.redirect(new URL("/dashboard", request.url))
      res.headers.set("x-request-id", requestId)
      return addSecurityHeaders(res)
    }
    const res = NextResponse.next()
    res.headers.set("x-request-id", requestId)
    return addSecurityHeaders(res)
  }
  if (PUBLIC_PATHS.includes(pathname)) {
    const res = NextResponse.next()
    res.headers.set("x-request-id", requestId)
    return addSecurityHeaders(res)
  }
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      const res = NextResponse.redirect(loginUrl)
      res.headers.set("x-request-id", requestId)
      return addSecurityHeaders(res)
    }
    const res = NextResponse.next()
    res.headers.set("x-request-id", requestId)
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate")
    return addSecurityHeaders(res)
  }
  const res = NextResponse.next()
  res.headers.set("x-request-id", requestId)
  return addSecurityHeaders(res)
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
```
---
## 15. API Security
### 15.1 CSRF Protection
```typescript
// src/lib/csrf.ts
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]
const CSRF_HEADER = "x-csrf-token"
export function csrfCheck(request: NextRequest): NextResponse | null {
  if (SAFE_METHODS.includes(request.method)) return null
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const allowedOrigins = [appUrl, "https://" + host]
  if (origin && !allowedOrigins.some((o) => origin.startsWith(o))) {
    const isSameOrigin = origin.includes("://" + host)
    if (!isSameOrigin) {
      const csrfToken = request.headers.get(CSRF_HEADER)
      const expectedToken = request.cookies.get("csrf-token")?.value
      if (!csrfToken || csrfToken !== expectedToken) {
        return new NextResponse(JSON.stringify({
          code: "CSRF_DETECTED",
          message: "Requete interrompue : origine non autorisee",
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
    }
  }
  return null
}
export function generateCsrfToken(): string {
  return crypto.randomUUID()
}
```
### 15.2 Headers de Securite par Endpoint
| Route | HSTS | CSP | XFO | Rate Limit |
|-------|------|-----|-----|------------|
| `/api/auth/*` | Oui | Strict | DENY | 5-100 req/min |
| `/api/public/*` | Oui | Relache | DENY | 60 req/min |
| `/api/webhooks/*` | Oui | Min | DENY | 10 req/min |
| `/api/admin/*` | Oui | Strict | DENY | 30 req/min |
| `/api/onboarding/*` | Oui | Strict | DENY | 3-10 req/min |
### 15.3 Validation d'Origine
```typescript
// src/lib/request-validator.ts
import { createHmac } from "crypto"
import { NextRequest } from "next/server"
export function verifyRequestSignature(
  request: NextRequest,
  secret: string,
): boolean {
  const timestamp = request.headers.get("x-request-timestamp")
  const signature = request.headers.get("x-request-signature")
  if (!timestamp || !signature) return false
  const now = Math.floor(Date.now() / 1000)
  const ts = parseInt(timestamp, 10)
  if (Math.abs(now - ts) > 300) return false
  const payload = ts + "." + request.method + "." + request.nextUrl.pathname
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return signature === expectedSignature
}
export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp && process.env.NODE_ENV === "production") return cfIp
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}
```
---
## 16. Database Schema
### 16.1 Modeles Prisma
```prisma
// Modele User etendu
model User {
  id            String    @id @default(uuid()) @db.Uuid
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  // Champs personnalises NBA
  phone             String?
  whatsapp          String?           @map("whatsapp")
  roleId            String            @map("role_id") @db.Uuid
  country           String?
  language          String            @default("fr")
  timezone          String            @default("Europe/Paris") @map("timezone")
  onboardingStatus  OnboardingStatus  @default(REGISTERED) @map("onboarding_status")
  isActive          Boolean           @default(true) @map("is_active")
  suspendedAt       DateTime?         @map("suspended_at")
  metadata          Json?             @db.JsonB
  deletedAt         DateTime?         @map("deleted_at")
  // Champs 2FA
  twoFactorEnabled       Boolean  @default(false) @map("two_factor_enabled")
  twoFactorStrategies    Json?    @default("[]") @map("two_factor_strategies") @db.JsonB
  twoFactorSecret        String?  @map("two_factor_secret")
  sessions            Session[]
  accounts            Account[]
  role                Role     @relation(fields: [roleId], references: [id])
  devices             Device[]
  deviceVerifications DeviceVerification[]
  twoFactorBackupCodes TwoFactorBackupCode[]
  loginAttempts       LoginAttempt[]
  passwordHistory     PasswordHistory[]
  auditLogs           AuditLog[]
  @@index([roleId])
  @@index([isActive])
  @@index([email])
  @@index([deletedAt])
  @@index([twoFactorEnabled])
  @@map("users")
}
model Session {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  token      String   @unique
  expiresAt  DateTime @map("expires_at")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  // Champs etendus
  deviceFingerprint String?   @map("device_fingerprint")
  isBoundToDevice   Boolean   @default(true) @map("is_bound_to_device")
  lastVerifiedAt    DateTime? @map("last_verified_at")
  suspiciousFlags   Json?     @default("[]") @map("suspicious_flags") @db.JsonB
  user User @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([userId, expiresAt])
  @@map("sessions")
}
model Account {
  id                      String    @id @default(uuid()) @db.Uuid
  userId                  String    @map("user_id") @db.Uuid
  accountId               String    @map("account_id")
  providerId              String    @map("provider_id")
  accessToken             String?   @map("access_token")
  refreshToken            String?   @map("refresh_token")
  accessTokenExpiresAt    DateTime? @map("access_token_expires_at")
  scope                   String?
  password                String?
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")
  user User @relation(fields: [userId], references: [id])
  @@unique([providerId, accountId])
  @@index([userId])
  @@map("accounts")
}
model Verification {
  id         String   @id @default(uuid()) @db.Uuid
  identifier String
  value      String
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  @@index([identifier, expiresAt])
  @@map("verifications")
}
// Modeles securite NBA
model Device {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  fingerprint  String   @map("fingerprint")
  name         String?
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  deviceType   String?  @map("device_type")
  brand        String?  @map("brand")
  os           String?  @map("os")
  browser      String?  @map("browser")
  trusted      Boolean  @default(false) @map("trusted")
  trustLevel   String   @default("UNKNOWN") @map("trust_level")
  lastSeenAt   DateTime @default(now()) @map("last_seen_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  user User @relation(fields: [userId], references: [id])
  @@unique([userId, fingerprint])
  @@index([userId])
  @@map("devices")
}
model TwoFactorBackupCode {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  code      String
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")
  user User @relation(fields: [userId], references: [id])
  @@unique([userId, code])
  @@index([userId])
  @@map("two_factor_backup_codes")
}
model LoginAttempt {
  id            String   @id @default(uuid()) @db.Uuid
  email         String
  ipAddress     String?  @map("ip_address")
  userAgent     String?  @map("user_agent")
  status        String   @default("PENDING")
  failureReason String?  @map("failure_reason")
  createdAt     DateTime @default(now()) @map("created_at")
  @@index([email])
  @@index([ipAddress])
  @@index([createdAt])
  @@index([email, createdAt])
  @@map("login_attempts")
}
model PasswordHistory {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  passwordHash  String   @map("password_hash")
  createdAt     DateTime @default(now()) @map("created_at")
  user User @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([userId, createdAt])
  @@map("password_history")
}
model AuditLog {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String?  @map("user_id") @db.Uuid
  action       String
  resourceType String   @map("resource_type")
  resourceId   String?  @map("resource_id") @db.Uuid
  details      Json?    @db.JsonB
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  severity     String   @default("info")
  hash         String?  @unique
  previousHash String?  @map("previous_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  searchText   String?  @map("search_text")
  user User? @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([severity])
  @@map("audit_logs")
}
```
---
## 17. Performance
### 17.1 Strategie de Cache
```
+--------------------------------------------------------------+
|                    CACHE STRATEGY                            |
+--------------------------------------------------------------+
|                                                              |
|  Couche 1: React cache() (serveur, memoire)                  |
|  - Session lookup (getServerSession)                         |
|  - User profile (getUserProfile)                             |
|  - TTL: duree de la requete                                 |
+--------------------------------------------------------------+
|                                                              |
|  Couche 2: Redis cache                                      |
|  - Session data: TTL 7 jours (session:token:{token})         |
|  - Rate limit: TTL variable (ratelimit:sw:{key})             |
|  - Device FP cache: TTL 1 heure (fp:{hash})                  |
|  - Pwned cache: TTL 1 heure (pwned:{prefix})                 |
|  - Token blacklist: TTL 7 jours (blacklist:session:{id})     |
+--------------------------------------------------------------+
|                                                              |
|  Couche 3: Connection Pooling (PostgreSQL/Neon)               |
|  - Prisma connection pool: 10-20 connections                 |
|  - pgBouncer en mode transaction                             |
|  - Prepared statements cachees                               |
+--------------------------------------------------------------+
```
### 17.2 Implementation
```typescript
// Optimisation des performances
import { cache } from "react"
import { prisma } from "./db"
// Session lookup avec React cache() pour deduplication
export const getCachedSession = cache(async (sessionToken: string) => {
  return prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: { select: { id: true, name: true, email: true, roleId: true, isActive: true } },
    },
  })
})
// Connection pool avec Prisma (optimise pour Neon)
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool de 20 connexions max
  // Avec pgBouncer en mode transaction
})
// Pipeline Redis pour operations batch
export async function batchDeleteSessions(sessionIds: string[]): Promise<void> {
  const pipeline = redis.pipeline()
  for (const id of sessionIds) {
    pipeline.del("session:" + id)
    pipeline.del("session:token:" + id)
  }
  await pipeline.exec()
}
// Query optimisation avec select explicite
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true,
      role: { select: { name: true } },
      isActive: true, onboardingStatus: true,
    },
    // Pas de select * - ne recuperer que le necessaire
  })
}
```
---
## 18. Monitoring & Observability
### 18.1 KPIs
| KPI | Seuil OK | Seuil WARN | Seuil CRITICAL | Mesure |
|-----|----------|------------|----------------|--------|
| Taux login success | >95% | <95% | <90% | /api/auth/sign-in |
| Taux rate limit | <5% | <10% | >10% | 429 responses |
| Taux hijacking | 0/jour | >1/jour | >5/jour | SESSION_HIJACK_ATTEMPT |
| Session moyen age | <3 jours | >5 jours | >7 jours | Session.expiresAt |
| Taux 2FA adoption | >50% | <50% | <25% | twoFactorEnabled |
| Taux refresh OAuth | >95% | <95% | <90% | oauth-tokens.ts |
| Redis hit rate | >90% | <90% | <80% | Redis info |
| Temps de verif session | <50ms | <100ms | >200ms | APM |
### 18.2 Sentry Integration
```typescript
// sentry.server.config.ts (deja configure)
import * as Sentry from "@sentry/nextjs"
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  integrations: [
    // Integrations personnalisees pour l'auth
  ],
  beforeSend(event) {
    // Ne pas envoyer les tokens de session a Sentry
    if (event.request?.cookies) {
      delete event.request.cookies["better-auth.session_token"]
      delete event.request.cookies["__Secure-better-auth.session_token"]
    }
    return event
  },
})
// Breadcrumbs personnalises pour l'auth
export function addAuthBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    category: "auth." + category,
    message,
    data: data as any,
    level: "info",
  })
}
```
### 18.3 Dashboard Suggeres
1. **Auth Health Dashboard**: login success rate, rate limit hits, 2FA adoption
2. **Session Dashboard**: active sessions, revocation rate, hijack attempts
3. **Security Dashboard**: audit chain integrity, anomaly detections, CSRF blocks
4. **Redis Dashboard**: cache hit rate, memory usage, command latency
---
## 19. Testing Strategy
### 19.1 Pyramide de Tests
```
                    /\
                   /  \
                  / E2E\
                 /------\
                /  INT   \
               /----------\
              /   UNIT     \
             /--------------\
            /     STATIC     \
           /------------------\
```
| Type | Description | Outils | Couverture cible |
|------|-------------|--------|-----------------|
| Static | TypeScript, ESLint | `tsc --noEmit`, ESLint | 100% |
| Unit | Fonctions pures, validation | Vitest | 90%+ |
| Integration | API routes, DB, Redis | Vitest + Supertest | 80%+ |
| E2E | Flows complets (login, register) | Playwright | 50%+ |
| Security | Pentest, brute force | OWASP ZAP, custom | 100% critiques |
### 19.2 Tests Unitaires
```typescript
// Tests pour la validation de mot de passe
import { describe, it, expect } from "vitest"
import { validatePassword } from "@/lib/password-policy"
describe("validatePassword", () => {
  it("rejette un mot de passe trop court", () => {
    const result = validatePassword("Ab1!")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Minimum 10 caracteres")
  })
  it("rejette sans majuscule", () => {
    const result = validatePassword("abcdefghij1!")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Au moins une lettre majuscule")
  })
  it("accepte un mot de passe valide", () => {
    const result = validatePassword("MyStr0ng!Pass")
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })
})
// Test pour la verification HMAC
describe("verifyCookieSignature", () => {
  it("rejette un cookie falsifie", () => {
    const secret = "test-secret-32-chars-min!!"
    const fakeCookie = "fake.payload.invalidsignature")
    const result = verifyCookieSignature(fakeCookie, secret)
    expect(result.valid).toBe(false)
  })
})
```
### 19.3 Tests d'Integration
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
describe("Rate Limiter Integration", () => {
  it("autorise les premieres requetes", async () => {
    const result = await checkRateLimit("test:user:1", { window: 60, max: 5 })
    expect(result.allowed).toBe(true)
  })
  it("bloque apres le max", async () => {
    const key = "test:user:block:" + Date.now()
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key, { window: 60, max: 5, blockDuration: 10 })
    }
    const result = await checkRateLimit(key, { window: 60, max: 5, blockDuration: 10 })
    expect(result.allowed).toBe(false)
  })
})
```
```typescript
import { test, expect } from "@playwright/test"
test("login flow with valid credentials", async ({ page }) => {
  await page.goto("/login")
  await page.fill('[name="email"]', "test@example.com")
  await page.fill('[name="password"]', "MyStr0ng!Pass")
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/)
})

test("rate limiting on login page", async ({ page }) => {
  // 6 tentatives rapides
  for (let i = 0; i < 6; i++) {
    await page.goto("/login")
    await page.fill('[name="email"]', "test@example.com")
    await page.fill('[name="password"]', "wrong")
    await page.click('button[type="submit"]')
  }
  await expect(page.locator("text=Trop de tentatives")).toBeVisible()
})
```
---
## 20. Implementation Roadmap
### 20.1 Phases
| Phase | Taches | Dependances | Duree | Priorite |
|-------|-------|-------------|-------|----------|
| **P1: Foundation** | Configuration Better Auth, Prisma schema, Cookie securite | Aucune | 1 semaine | Critique |
| **P2: Session** | Session limits, rotation, revocation, concurrent control | P1 | 1 semaine | Haute |
| **P3: 2FA/MFA** | TOTP setup, backup codes, recovery, trusted devices | P1 | 1 semaine | Critique |
| **P4: Device** | Fingerprinting, device registration, trust levels | P2 | 3 jours | Haute |
| **P5: Rate Limiting** | Redis sliding window, fallback local, multi-layer | P1 | 3 jours | Haute |
| **P6: Audit** | Security events, audit chain, integrity verification | P2 | 3 jours | Moyenne |
| **P7: WebSocket** | HMAC cookie auth, session binding, reconnection | P2 | 3 jours | Haute |
| **P8: Hijacking** | Anomaly detection, IP/device binding, auto-revoke | P2,P4 | 4 jours | Critique |
| **P9: Performance** | Cache, connection pool, query optimization | P1-P8 | 3 jours | Moyenne |
| **P10: Tests** | Unit, integration, E2E, security, load tests | P1-P8 | 2 semaines | Haute |
| **P11: Docs** | Finaliser MASTER_AUTH_ARCHITECTURE.md | P1-P10 | 2 jours | Moyenne |
### 20.2 Migration Strategy
```
  Phase P1: Base   Phase P2-P4: Securite   Phase P5-P8: Avance   Phase P9-P11: Optimisation
  +--------+       +-----------+         +------------+         +--------------+
  | Stable |----->| Migration |-------->|  Gradual   |-------->|  Production  |
  | (old)  |       | (new)     |        |  Rollout   |        |  (new)       |
  +--------+       +-----------+         +------------+         +--------------+
       |                 |                      |                      |
       v                 v                      v                      v
  Aucun change    Feature flags            % rollout            100% traffic
```
### 20.3 Rollback Plan
1. **Feature flags** : Chaque fonctionnalite (2FA, device binding, etc.) a un flag
2. **Session dual write** : Ancien et nouveau systeme cohabitent 48h
3. **Kill switch** : `DISABLE_NEW_AUTH=true` pour revenir immediatement
4. **Migration DB** : Prisma migrations avec `--create-only` pour revue manuelle
---
## 21. Appendices
### A. Fichier .env
```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/nba_dev?sslmode=require
# Redis
REDIS_URL=redis://localhost:6379
# Better Auth
BETTER_AUTH_SECRET=your-secret-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
# 2FA
TWO_FACTOR_ISSUER=NBA Platform
# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
# Sentry
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
# Optional: IP geolocation for hijacking detection
IPHUB_API_KEY=
# Token encryption (OAuth)
TOKEN_ENCRYPTION_KEY=
```
### B. Scripts de Migration
```sql
-- Migration: Add 2FA fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_strategies JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
-- Migration: Add session security fields
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS is_bound_to_device BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspicious_flags JSONB DEFAULT '[]';
-- Migration: Create backup codes table
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  code TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code)
);
-- Migration: Create login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'PENDING',
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
-- Migration: Create password history table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
```
### C. Commandes Utiles
```bash
# Generer une clef secrete Better Auth
openssl rand -hex 32
# Generer les clefs VAPID (Web Push)
npx web-push generate-vapid-keys
# Prisma migration
pnpm db:migrate --name add_two_factor
# Tester la configuration auth
pnpm test -- --run src/lib/auth.test.ts
# Lancer les tests de securite
pnpm vitest run -- --reporter=verbose src/lib/security/
```
### D. Modele de Configuration Complet
```typescript
// auth.config.ts -- Configuration exportee pour reutilisation
export const AUTH_CONFIG = {
  session: {
    ttl: 60 * 60 * 24 * 7,
    refreshAge: 60 * 60 * 24,
    cookieName: "better-auth.session_token",
    cookiePrefix: process.env.NODE_ENV === "production" ? "__Secure-" : "",
  },
  password: {
    minLength: 10,
    hashRounds: 12,
    historyCount: 5,
    maxAgeDays: 90,
  },
  rateLimit: {
    defaultWindow: 60,
    defaultMax: 100,
    signInMax: 5,
    signUpMax: 3,
  },
  twoFactor: {
    issuer: "NBA Platform",
    totpDigits: 6,
    totpPeriod: 30,
    backupCodeCount: 8,
  },
  redis: {
    keyPrefix: {"ratelimit": "ratelimit:sw:", "session": "session:", "blacklist": "blacklist:"},
  },
} as const
```
---
*Document genere le 2026-07-22. Derniere mise a jour : v1.0.0*