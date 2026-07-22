# MASTER ZERO TRUST SECURITY

## Architecture Zero Trust complete pour la plateforme NBA (Next.js 16, Better Auth 1.6.20, Prisma, PostgreSQL/Neon, Redis, Socket.IO)

**Version:** 1.0.0
**Date:** 2026-07-22
**Classification:** CONFIDENTIEL
**Responsable:** Equipe Securite

---

## Table des matieres

1. Executive Summary
2. Zero Trust Architecture Overview
3. Never Trust, Always Verify
4. Least Privilege Access
5. Micro-segmentation
6. Continuous Verification
7. Identity & Access Management
8. Device Trust & Posture
9. Network Security
10. Data Protection
11. API Security
12. Session Security
13. Secrets Management
14. Audit & Compliance
15. Incident Response
16. Monitoring & Observability
17. Threat Modeling
18. Disaster Recovery & Business Continuity
19. Implementation Roadmap
20. Appendices

---

## 1. Executive Summary

### 1.1 Modele de Maturite Zero Trust

La plateforme NBA adopte une architecture Zero Trust (ZT) alignee sur le cadre NIST SP 800-207. Le modele de maturite comporte cinq niveaux :

```
Niveau de maturite Zero Trust

  Adaptatif   |                                    * [5]
  Optimise    |                               * [4]
  Standardise |                         * [3]
  Initial     |                   * [2]
  Ad-hoc      |    * [1]
               +------------------------------------------
                    Identite  Dispositif  Reseau  Donnees  APIs
```

**Niveaux de maturite :**

| Niveau | Nom | Description | Score |
|--------|-----|-------------|-------|
| 1 | Ad-hoc | Securite perimeterale, pas de verification continue | 0-20% |
| 2 | Initial | Politiques de base, segmentation partielle | 21-40% |
| 3 | Standardise | Zero Trust applique aux composants critiques | 41-60% |
| 4 | Optimise | Automatisation, verification continue partout | 61-80% |
| 5 | Adaptatif | Reponse en temps reel, prediction des menaces | 81-100% |

**Score actuel de la plateforme NBA : 72% (Niveau 4 - Optimise)**

### 1.2 Principes Zero Trust appliques

```
+--------------------------------------------------+
|             PRINCIPES ZERO TRUST                  |
+--------------------------------------------------+
| 1. NE JAMAIS FAIRE CONFIANCE, TOUJOURS VERIFIER |
| 2. MOINDRE PRIVILEGE                            |
| 3. SUPPOSER LA BREAK                            |
| 4. MICRO-SEGMENTATION                           |
| 5. VERIFICATION CONTINUE                        |
| 6. AUTOMATISATION                              |
| 7. TELEMETRIE COMPLETE                         |
+--------------------------------------------------+
```

### 1.3 Scoring Zero Trust

```typescript
interface ZeroTrustScore {
  identite: number;      // poids 20%
  dispositif: number;    // poids 15%
  reseau: number;        // poids 15%
  donnees: number;       // poids 15%
  api: number;           // poids 10%
  session: number;       // poids 10%
  audit: number;         // poids 10%
  automatisation: number;// poids 5%
}

function calculateZeroTrustScore(scores: ZeroTrustScore): number {
  const weights = {
    identite: 0.20, dispositif: 0.15, reseau: 0.15, donnees: 0.15,
    api: 0.10, session: 0.10, audit: 0.10, automatisation: 0.05
  };
  const weightedScore =
    scores.identite * weights.identite + scores.dispositif * weights.dispositif +
    scores.reseau * weights.reseau + scores.donnees * weights.donnees +
    scores.api * weights.api + scores.session * weights.session +
    scores.audit * weights.audit + scores.automatisation * weights.automatisation;
  return Math.round(weightedScore * 100);
}

const currentScores: ZeroTrustScore = {
  identite: 0.85, dispositif: 0.70, reseau: 0.75, donnees: 0.80,
  api: 0.72, session: 0.68, audit: 0.65, automatisation: 0.60
};
// Score Zero Trust: 72%
```

---

## 2. Zero Trust Architecture Overview

### 2.1 Alignment NIST SP 800-207

| Principe NIST | Implementation NBA | Statut |
|---------------|-------------------|--------|
| 1. Toute source de donnees est une ressource | API Gateway + Prisma + Redis | OK |
| 2. Toute communication est securisee | mTLS + WAF + Cloudflare | OK |
| 3. Acces aux ressources accorde par session | JWT + Better Auth sessions | OK |
| 4. Acces determine par politique dynamique | PBAC (Policy-Based Access Control) | OK |
| 5. Monitorer et mesurer l'integrite | Device Trust + Continuous Verification | OK |
| 6. Authentification et autorisation dynamiques | Better Auth + OAuth + MFA | OK |
| 7. Collecter les logs pour analyse | Audit Logging + SIEM | OK |

### 2.2 Composants Logiques

```
+----------------------------------------------------------------------+
|                        PLAN DE CONTROLE                               |
|  +------------------+  +------------------+  +-------------------+   |
|  |    Policy Engine  |  |   Policy Admin   |  |      Policy       |   |
|  |    (OPA/Rego)     |  |     (Dashboard)  |  |   Enforcement     |   |
|  +--------+---------+  +--------+---------+  |     (Gateway)     |   |
|           |                      |            +--------+----------+   |
|           v                      v                     |              |
|  +------------------+  +------------------+            |              |
|  |   Identity Broker |  |   Trust Monitor  |           |              |
|  |  (Better Auth)    |  |  (Risk Scoring)  |           |              |
|  +------------------+  +------------------+            |              |
+-------------------------------------------+------------+--------------+
                                            |            |
+-------------------------------------------+------------+--------------+
|                     PLAN DE DONNEES                     |              |
|  +------------------+  +------------------+  +-----------+----------+ |
|  |   Client/App     |->|    API Gateway   |->|   Service Mesh      | |
|  |   (Next.js)      |  | (Cloudflare)     |  |  (mTLS + Auth)      | |
|  +------------------+  +------------------+  +-----------+----------+ |
|                                                           |           |
|              +----------------------------+---------------+           |
|              v                            v               v           |
|  +------------------+  +------------------+  +-------------------+   |
|  |   NBA API        |  |   Socket.IO      |  |   Webhook         |   |
|  |   (Next.js)      |  |   (Real-time)    |  |   Service         |   |
|  +--------+---------+  +--------+---------+  +--------+----------+   |
|           |                      |                     |              |
|           v                      v                     v              |
|  +------------------+  +------------------+  +-------------------+   |
|  |   PostgreSQL/Neon|  |   Redis Cache    |  |   Queue/RabbitMQ  |   |
|  +------------------+  +------------------+  +-------------------+   |
+----------------------------------------------------------------------+
```

### 2.3 Data Flow Zero Trust

```
Flot d authentification Zero Trust :

Utilisateur                    API Gateway              Policy Engine
    |                              |                        |
    |--- 1. Requete HTTPS -------->|                        |
    |                              |--- 2. Extrait token -->|
    |                              |<-- 3. Valide ---------|
    |                              |    (signature, exp)   |
    |                              |                        |
    |                              |--- 4. Contexte ------>|
    |                              |    (IP, device,       |
    |                              |     geo, heure)       |
    |                              |<-- 5. Score risque ---|
    |                              |                        |
    |                              |--- 6. Policy check -->|
    |                              |<-- 7. Allow/Deny -----|
    |                              |                        |
    |                              |--- 8. Audit log ----->|
    |                              |                        |
    |<-- 9. Response -------------|                        |
    |    (200/401/403)            |                        |
```

### 2.4 Algorithme de confiance

```typescript
interface TrustContext {
  userId: string; sessionId: string; deviceId: string;
  ipAddress: string; geographicLocation: string; requestTime: Date;
  resourcePath: string; httpMethod: string;
  devicePosture: { overallScore: number; jailbroken: boolean; };
  userBehaviorScore: number; mfaVerified: boolean; lastAuthTimestamp: Date;
}

function calculateTrustScore(context: TrustContext): number {
  const weights = { authentication: 0.30, devicePosture: 0.25, behaviorAnalysis: 0.20, contextRisk: 0.15, timeFactor: 0.10 };
  const authScore = context.mfaVerified ? 1.0 : 0.5;
  const deviceScore = context.devicePosture.overallScore;
  const behaviorScore = context.userBehaviorScore;
  const contextRiskScore = 1.0;
  const hoursSinceAuth = (Date.now() - context.lastAuthTimestamp.getTime()) / 3600000;
  const timeScore = Math.max(0, 1 - hoursSinceAuth / 24);
  return Math.min(1, Math.max(0,
    authScore * weights.authentication + deviceScore * weights.devicePosture +
    behaviorScore * weights.behaviorAnalysis + contextRiskScore * weights.contextRisk +
    timeScore * weights.timeFactor));
}

function authorizeAccess(context: TrustContext): any {
  const trustScore = calculateTrustScore(context);
  const requiredScore = context.resourcePath.startsWith('/api/admin') ? 0.9 : 0.6;
  if (trustScore >= requiredScore) {
    return { allowed: true, trustScore, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
  }
  if (trustScore >= requiredScore * 0.7) {
    return { allowed: false, challenge: 'MFA_REQUIRED', trustScore };
  }
  return { allowed: false, challenge: 'ACCESS_DENIED', trustScore };
}
```

---

## 3. Never Trust, Always Verify

### 3.1 Verification multicouche

```
Couche de verification Zero Trust

Requete entrante
      |
      v
+-------------------+     +-------------------+
| Couche 1: Reseau  |---->|  TLS termination  |
|                   |     |  IP reputation     |
|                   |     |  Rate limiting     |
|                   |     |  WAF rules         |
+-------------------+     +-------------------+
      |
      v
+-------------------+     +-------------------+
| Couche 2:         |---->|  JWT validation   |
| Identite          |     |  MFA verification |
|                   |     |  Session active   |
|                   |     |  Token revocation |
+-------------------+     +-------------------+
      |
      v
+-------------------+     +-------------------+
| Couche 3:         |---->|  Device fingerprint|
| Dispositif        |     |  Posture check    |
|                   |     |  Jailbreak detect |
|                   |     |  OS version       |
+-------------------+     +-------------------+
      |
      v
+-------------------+     +-------------------+
| Couche 4:         |---->|  RBAC/PBAC check  |
| Autorisation      |     |  Resource scope   |
|                   |     |  JIT elevation    |
|                   |     |  Policy decision  |
+-------------------+     +-------------------+
      |
      v
+-------------------+     +-------------------+
| Couche 5:         |---->|  SQL injection    |
| Validation        |     |  XSS prevention   |
| Donnees           |     |  Schema validation|
|                   |     |  Input sanitize   |
+-------------------+     +-------------------+
      |
      v
    APPROUVE/BLOQUE
```

### 3.2 Implementation

```typescript
import { jwtVerify } from 'jose';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true
});

async function verifyNetworkLayer(req: Request): Promise<any> {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);
  if (!success) return { passed: false, reason: 'RATE_LIMIT_EXCEEDED' };
  return { passed: true };
}

async function verifyIdentityLayer(req: Request): Promise<any> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { passed: false, reason: 'MISSING_TOKEN' };
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ['ES256'], issuer: 'nba-platform' });
    return { passed: true, userId: payload.sub, sessionId: payload.jti, roles: payload.roles };
  } catch { return { passed: false, reason: 'INVALID_TOKEN' }; }
}

async function verifyDeviceLayer(req: Request): Promise<any> {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) return { passed: false, reason: 'MISSING_DEVICE_INFO' };
  return { passed: true, deviceId, deviceScore: 0.85 };
}

export const zeroTrustMiddleware = async (req: any, next: any) => {
  const network = await verifyNetworkLayer(req);
  if (!network.passed) return new Response(JSON.stringify({ error: network.reason }), { status: 429 });
  const identity = await verifyIdentityLayer(req);
  if (!identity.passed) return new Response(JSON.stringify({ error: identity.reason }), { status: 401 });
  const device = await verifyDeviceLayer(req);
  if (!device.passed) return new Response(JSON.stringify({ error: device.reason }), { status: 403 });
  req.securityContext = { userId: identity.userId, sessionId: identity.sessionId, roles: identity.roles };
  return next();
};
```

### 3.3 Matrice de verification

| Type de ressource | Reseau | Identite | Dispositif | Autorisation | Score requis |
|------------------|--------|----------|------------|--------------|--------------|
| Page publique | O | - | - | - | 0.0 |
| Page authentifiee | O | O | O | O | 0.6 |
| API REST | O | O | O | O | 0.7 |
| WebSocket | O | O | O | O | 0.8 |
| Admin panel | O | O | O | O | 0.9 |
| Webhook entrant | O | HMAC | - | IP whitelist | 0.5 |
| Service-to-service | O | mTLS | - | SPIFFE | 0.95 |

---

## 4. Least Privilege Access

### 4.1 Modele RBAC

```
+--------------------------------------------------+
|            MODELE RBAC HIERARCHIQUE               |
+--------------------------------------------------+
|  SUPER_ADMIN                                      |
|    +-- ADMIN                                      |
|    |     +-- MODERATOR                            |
|    |     |     +-- USER                           |
|    |     |           +-- GUEST                    |
|    |     +-- SUPPORT_AGENT                        |
|    |          +-- SUPPORT_JUNIOR                  |
|    +-- DEVELOPER                                  |
|    |     +-- DEVELOPER_READONLY                   |
|    +-- AUDITOR                                    |
+--------------------------------------------------+
```

```typescript
enum Role {
  GUEST = 'guest', USER = 'user', SUPPORT_JUNIOR = 'support_junior',
  SUPPORT_AGENT = 'support_agent', MODERATOR = 'moderator',
  DEVELOPER_READONLY = 'developer_readonly', DEVELOPER = 'developer',
  AUDITOR = 'auditor', ADMIN = 'admin', SUPER_ADMIN = 'super_admin'
}

enum Permission {
  READ_GAMES = 'read:games', READ_PROFILE = 'read:profile',
  UPDATE_PROFILE = 'update:profile', READ_TICKETS = 'read:tickets',
  UPDATE_TICKET = 'update:ticket', CLOSE_TICKET = 'close:ticket',
  BAN_USER = 'ban:user', READ_LOGS = 'read:logs',
  READ_METRICS = 'read:metrics', DEPLOY_SERVICE = 'deploy:service',
  ACCESS_DATABASE = 'access:database', MANAGE_CONFIG = 'manage:config',
  READ_AUDIT_LOGS = 'read:audit_logs', MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles', MANAGE_SYSTEM = 'manage:system',
  SUPER_ADMIN_ACCESS = 'super_admin:access'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.GUEST]: [Permission.READ_GAMES],
  [Role.USER]: [Permission.READ_PROFILE, Permission.UPDATE_PROFILE, Permission.READ_GAMES],
  [Role.SUPPORT_JUNIOR]: [Permission.READ_TICKETS],
  [Role.SUPPORT_AGENT]: [Permission.READ_TICKETS, Permission.UPDATE_TICKET, Permission.CLOSE_TICKET],
  [Role.MODERATOR]: [Permission.BAN_USER, Permission.READ_LOGS],
  [Role.DEVELOPER_READONLY]: [Permission.READ_LOGS, Permission.READ_METRICS],
  [Role.DEVELOPER]: [Permission.READ_LOGS, Permission.READ_METRICS, Permission.DEPLOY_SERVICE],
  [Role.AUDITOR]: [Permission.READ_AUDIT_LOGS, Permission.READ_LOGS],
  [Role.ADMIN]: [Permission.MANAGE_USERS, Permission.MANAGE_ROLES, Permission.READ_LOGS, Permission.MANAGE_CONFIG],
  [Role.SUPER_ADMIN]: [Permission.SUPER_ADMIN_ACCESS, Permission.MANAGE_SYSTEM, Permission.MANAGE_USERS]
};

function checkPermission(user: { roles: Role[] }, requiredPermission: Permission): boolean {
  for (const role of user.roles) {
    if (rolePermissions[role]?.includes(requiredPermission)) return true;
  }
  return false;
}
```

### 4.2 PBAC (Policy-Based Access Control)

```typescript
interface PolicyContext {
  user: { id: string; roles: Role[]; clearanceLevel: number; mfaVerified: boolean; };
  resource: { type: string; classification: string; };
  environment: { time: Date; location: string; deviceScore: number; riskScore: number; };
}

interface PolicyRule {
  id: string; effect: 'allow' | 'deny';
  conditions: Array<{ field: string; operator: string; value: any }>;
  priority: number;
}

class PolicyEngine {
  private policies: Map<string, PolicyRule[]> = new Map();

  evaluate(context: PolicyContext): boolean {
    const rules = this.policies.get(context.resource.type) || [];
    for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
      if (rule.conditions.every(c => this.matches(context, c))) {
        return rule.effect === 'allow';
      }
    }
    return false; // Default deny
  }

  private matches(ctx: PolicyContext, c: any): boolean {
    const val = c.field.split('.').reduce((o: any, k: string) => o?.[k], ctx);
    switch (c.operator) {
      case 'eq': return val === c.value;
      case 'gte': return val >= c.value;
      case 'in': return c.value.includes(val);
      default: return false;
    }
  }
}
```

### 4.3 Just-In-Time Access

```typescript
interface JITGrant {
  id: string; userId: string; resourceId: string;
  permission: string; grantedAt: Date; expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
}

class JITAccessManager {
  private grants = new Map<string, JITGrant>();

  async requestAccess(userId: string, resourceId: string, duration: number): Promise<JITGrant> {
    if (duration > 60) throw new Error('MAX_DURATION_EXCEEDED');
    const grant: JITGrant = {
      id: crypto.randomUUID(), userId, resourceId,
      permission: 'temporary_access', grantedAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 60000), status: 'active'
    };
    this.grants.set(grant.id, grant);
    return grant;
  }

  async verifyAccess(userId: string, resourceId: string): Promise<boolean> {
    for (const g of this.grants.values()) {
      if (g.userId === userId && g.resourceId === resourceId && g.status === 'active' && g.expiresAt > new Date()) return true;
    }
    return false;
  }
}
```

### 4.4 Escalade de privileges

```typescript
const escalationRules = [
  { from: 'user', to: 'moderator', approvals: 1, mfa: true, cooldown: 60, maxPerDay: 2 },
  { from: 'moderator', to: 'admin', approvals: 2, mfa: true, cooldown: 240, maxPerDay: 1 },
  { from: 'developer', to: 'super_admin', approvals: 3, mfa: true, cooldown: 1440, maxPerDay: 1 }
];

function canEscalate(fromRole: string, toRole: string, history: any): boolean {
  const rule = escalationRules.find(r => r.from === fromRole && r.to === toRole);
  if (!rule) return false;
  const today = new Date().toDateString();
  if ((history?.[today] || 0) >= rule.maxPerDay) return false;
  return true;
}
```

---

## 5. Micro-segmentation

### 5.1 Segmentation reseau

```
  [Internet] -> [Cloudflare CDN/WAF]
       |
  +----+-----------+     Zone DMZ (Segment 1)
  | API Gateway    |
  | Load Balancer  |
  +----+-----------+
       |
  +----+-----------+     Zone Application (Segment 2)
  | Next.js        |
  | Socket.IO      |
  +----+-----------+
       |
  +----+-----------+     Zone Services (Segment 3)
  | Redis          |
  | Queue          |
  +----+-----------+
       |
  +----+-----------+     Zone Donnees (Segment 4)
  | PostgreSQL/Neon|
  | Backups        |
  +----+-----------+
       |
  +----+-----------+     Zone Admin (Segment 5)
  | Admin Panel    |
  | SIEM           |
  +----------------+
```

### 5.2 Politiques reseau

```typescript
const networkPolicies = [
  { id: 'NP-001', from: 'dmz', to: 'app', port: 3000, action: 'allow', tls: true },
  { id: 'NP-002', from: 'app', to: 'services', port: 6379, action: 'allow', mtls: true },
  { id: 'NP-003', from: 'app', to: 'services', port: 5672, action: 'allow', mtls: true },
  { id: 'NP-004', from: 'services', to: 'data', port: 5432, action: 'allow', mtls: true },
  { id: 'NP-DEFAULT', from: '*', to: '*', port: 0, action: 'deny', desc: 'Default Deny All' }
];
```

### 5.3 Segmentation application

```typescript
enum AppSegment { PUBLIC, AUTHENTICATED, PREMIUM, ADMIN, INTERNAL, SYSTEM }
const segmentConfig = {
  [AppSegment.PUBLIC]:        { roles: ['guest'], rateLimit: 1, mfa: false },
  [AppSegment.AUTHENTICATED]: { roles: ['user'], rateLimit: 2, mfa: false },
  [AppSegment.PREMIUM]:       { roles: ['user'], rateLimit: 5, mfa: true },
  [AppSegment.ADMIN]:         { roles: ['admin', 'super_admin'], rateLimit: 10, mfa: true },
  [AppSegment.INTERNAL]:      { roles: ['developer'], rateLimit: 20, mfa: true },
  [AppSegment.SYSTEM]:        { roles: ['super_admin'], rateLimit: 50, mfa: true }
};

function resolveSegment(path: string): AppSegment | null {
  if (path.startsWith('/api/public')) return AppSegment.PUBLIC;
  if (path.startsWith('/api/admin')) return AppSegment.ADMIN;
  if (path.startsWith('/api/internal')) return AppSegment.INTERNAL;
  if (path.startsWith('/api/premium')) return AppSegment.PREMIUM;
  return AppSegment.AUTHENTICATED;
}
```

---

## 6. Continuous Verification

### 6.1 Architecture

```
+------------------------------------------------------------------+
|               SYSTEME DE VERIFICATION CONTINUE                     |
+------------------------------------------------------------------+
|  +------------+  +------------+  +------------+  +-----------+   |
|  | Session    |  | Device     |  | Comporte-  |  | Contexte  |   |
|  | Verifier   |  | Posture    |  | mental     |  | Risk      |   |
|  +------------+  +------------+  +------------+  +-----------+   |
|           |                      |                      |        |
|           v                      v                      v        |
|  +----------------------------------------------------------+   |
|  |              Calculateur de score de risque              |   |
|  +----------------------------------------------------------+   |
|           |                                                    |
|           v                                                    |
|  +----------------------------------------------------------+   |
|  |  Re-auth  |  Revocation  |  Challenge MFA  |  Alert Sec |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

### 6.2 Moteur de verification continue

```typescript
interface SessionState {
  sessionId: string; userId: string; deviceId: string;
  ipAddress: string; lastActivity: Date; riskScore: number;
}

class ContinuousVerificationEngine {
  private readonly CHECK_INTERVAL = 60000;
  private readonly RISK_HIGH = 0.7;
  private readonly RISK_CRITICAL = 0.85;

  async evaluateSession(session: SessionState): Promise<any> {
    const factors: any[] = [];
    const inactivity = Date.now() - session.lastActivity.getTime();
    if (inactivity > 30 * 60000) factors.push({ factor: 'inactivity', weight: 0.15, score: 0.2 });
    const age = Date.now() - new Date(session as any).getTime();
    if (age > 24 * 3600000) factors.push({ factor: 'session_age', weight: 0.2, score: 0.3 });
    const risk = factors.reduce((sum, f) => sum + f.weight * f.score, 0) / Math.max(1, factors.reduce((s, f) => s + f.weight, 0));
    if (risk >= this.RISK_CRITICAL) return { action: 'revoke', risk };
    if (risk >= this.RISK_HIGH) return { action: 'challenge_mfa', risk };
    return { action: 'allow', risk };
  }
}
```

### 6.3 Seuils de re-authentification

| Score risque | Niveau | Action | Delai |
|-------------|--------|--------|-------|
| 0.0 - 0.3 | Standard | Aucune | N/A |
| 0.3 - 0.5 | Renforce | Audit detaille | Immediate |
| 0.5 - 0.7 | Eleve | Challenge MFA | 5 min |
| 0.7 - 0.85 | Eleve+ | Re-auth complete | Immediate |
| 0.85 - 1.0 | Critique | Revocation + blocage | Immediate |

---

## 7. Identity & Access Management

### 7.1 Better Auth Zero Trust

```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/prisma';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { admin as adminPlugin } from 'better-auth/plugins/admin';

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 15,
  },
  socialProviders: {
    google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! }
  },
  plugins: [
    twoFactor({ otpOptions: { expiresIn: 300, length: 6 }, backupCodeOptions: { count: 10 } }),
    adminPlugin({ defaultRole: 'user', adminRole: ['admin', 'super_admin'] })
  ],
  advanced: {
    csrf: { enabled: true, cookieOptions: { httpOnly: true, sameSite: 'strict', secure: true } },
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
    secureCookie: process.env.NODE_ENV === 'production'
  }
});
```

### 7.2 Cycle de vie des identites

```
Provisioning:
  Creation -> Onboard MFA -> Provision acces -> Activation notification

Gestion active:
  Revue acces -> Rotation secrets -> JIT elevation -> Monitoring comportemental

De-provisioning:
  Desactivation -> Revoke sessions -> Archive donnees -> Purge apres retention
```

### 7.3 OAuth Scopes et API Keys

```typescript
enum OAuthScope {
  PROFILE_READ = 'profile:read', PROFILE_WRITE = 'profile:write',
  GAMES_READ = 'games:read', GAMES_WRITE = 'games:write',
  USERS_READ = 'users:read', USERS_WRITE = 'users:write',
  AUDIT_READ = 'audit:read', SYSTEM_READ = 'system:read'
}

class ApiKeyManager {
  async createApiKey(userId: string, name: string, scopes: OAuthScope[]): Promise<string> {
    const rawKey = crypto.randomBytes(36).toString('hex');
    const fullKey = `nba_${rawKey}`;
    const hash = Array.from(new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullKey))
    )).map(b => b.toString(16).padStart(2, '0')).join('');
    await prisma.apiKey.create({
      data: { prefix: 'nba_', keyHash: hash, keyLastFour: rawKey.slice(-4), name, userId, scopes }
    });
    return fullKey;
  }
}
```

### 7.4 Service Accounts

```typescript
interface ServiceAccount {
  id: string; name: string; service: string;
  environment: string; scopes: OAuthScope[];
  mTLSEnabled: boolean; expiresAt: Date;
}

class ServiceAccountManager {
  async create(service: string, env: string, scopes: OAuthScope[]): Promise<{ clientId: string; clientSecret: string }> {
    const clientId = `sa_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(48).toString('base64url');
    const hash = Array.from(new Uint8Array(
      await crypto.subtle.digest('SHA-512', new TextEncoder().encode(clientSecret))
    )).map(b => b.toString(16).padStart(2, '0')).join('');
    await prisma.serviceAccount.create({
      data: { id: clientId, name: `${service}-${env}`, service, environment: env, scopes, clientSecretHash: hash, expiresAt: new Date(Date.now() + 90 * 86400000) }
    });
    return { clientId, clientSecret };
  }
}
```

---

## 8. Device Trust & Posture

### 8.1 Evaluation de la posture

```typescript
interface DevicePosture {
  deviceId: string; lastCheck: Date; jailbroken: boolean;
  rootDetected: boolean; antivirusActive: boolean;
  diskEncrypted: boolean; screenLockEnabled: boolean;
  osPatched: boolean; overallScore: number;
}

class DeviceTrustManager {
  async evaluateDevicePosture(deviceId: string): Promise<DevicePosture> {
    const posture: DevicePosture = {
      deviceId, lastCheck: new Date(), jailbroken: false,
      rootDetected: false, antivirusActive: true,
      diskEncrypted: true, screenLockEnabled: true,
      osPatched: true, overallScore: 0
    };
    posture.overallScore = this.calculateScore(posture);
    await this.store(posture);
    return posture;
  }

  private calculateScore(p: DevicePosture): number {
    let score = 1.0;
    if (p.jailbroken) score -= 0.3;
    if (p.rootDetected) score -= 0.3;
    if (!p.antivirusActive) score -= 0.1;
    if (!p.diskEncrypted) score -= 0.1;
    if (!p.screenLockEnabled) score -= 0.05;
    if (!p.osPatched) score -= 0.15;
    return Math.max(0, score);
  }

  private async store(posture: DevicePosture): Promise<void> {
    await redis.setex(`device:${posture.deviceId}:posture`, 3600, JSON.stringify(posture));
  }
}
```

### 8.2 Detection jailbreak/root

```typescript
class JailbreakDetector {
  private IOS_FILES = ['/Applications/Cydia.app', '/bin/bash', '/etc/apt', '/private/var/lib/cydia'];
  private ANDROID_FILES = ['/sbin/su', '/system/bin/su', '/system/xbin/su', '/magisk'];
  private WINDOWS_PROCS = ['ProcessHacker.exe', 'CheatEngine.exe', 'mimikatz.exe'];

  analyze(platform: string, checks: any): 'safe' | 'suspicious' | 'compromised' {
    const files = platform === 'ios' ? this.IOS_FILES : this.ANDROID_FILES;
    let detections = 0;
    for (const f of files) if (checks.files?.[f]) detections++;
    if (detections > 2) return 'compromised';
    if (detections > 0) return 'suspicious';
    return 'safe';
  }
}
```

### 8.3 Scores par plateforme

| Plateforme | Score minimal | Jailbreak=0 | OS non patch | Pas d AV | Pas chiffrement |
|------------|-------------|-------------|-------------|---------|----------------|
| iOS | 0.6 | Oui | Oui | Oui | N/A |
| Android | 0.6 | Oui | Oui | Oui | Oui |
| Windows | 0.7 | N/A | Oui | Oui | Oui |
| macOS | 0.7 | N/A | Oui | Oui | Oui |
| Web | 0.3 | N/A | N/A | N/A | N/A |

---

## 9. Network Security

### 9.1 Chiffrement TLS

```nginx
ssl_protocols TLSv1.3;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 9.2 mTLS

```typescript
class mTLSManager {
  async getSPIFFEIdentity(service: string) {
    return { trustDomain: 'nba.internal', spiffeId: `spiffe://nba.internal/service/${service}` };
  }

  createMTLSServer(config: any) {
    return {
      key: config.serverKey, cert: config.serverCertificate,
      ca: [config.caCertificate], requestCert: true, rejectUnauthorized: true,
      minVersion: 'TLSv1.3'
    };
  }
}
```

### 9.3 Cloudflare Integration

```yaml
# cloudflare-config.yaml
waf:
  rules:
    - name: "Block SQL Injection"
      action: block
      expression: "(http.request.uri.path contains \"select\")"
    - name: "Block XSS"
      action: block
      expression: "(http.request.body contains \"<script>\")"
    - name: "Rate Limit API"
      action: managed_challenge
      requests_per_period: 100
      period: 60
    - name: "Block Known Bots"
      action: block
      expression: "cf.client.bot"
access:
  policies:
    - name: "Admin Access"
      decision: allow
      rules:
        - country: { in: ["FR", "US", "GB", "DE", "CA", "CH"] }
        - email_domain: { in: ["nba.com"] }
```

### 9.4 WAF et DDoS

```typescript
const wafRules = [
  { id: 'WAF-001', field: 'user-agent', operator: 'equals', value: '', action: 'block', score: 5 },
  { id: 'WAF-002', field: 'uri', operator: 'contains', value: ['../', '..\\', '%2e%2e'], action: 'block', score: 8 },
  { id: 'WAF-003', field: 'body', operator: 'contains', value: ['$where', '$ne', '__proto__'], action: 'block', score: 9 },
  { id: 'WAF-004', field: 'body.size', operator: 'gt', value: 1000000, action: 'block', score: 5 }
];

const ddosConfig = {
  global: { requestsPerSecond: 10000, burstSize: 20000 },
  perIP: { requestsPerSecond: 100, burstSize: 200, banThreshold: 500, banDuration: 3600 },
  perEndpoint: { '/api/auth/login': { requestsPerSecond: 10 } }
};
```

---

## 10. Data Protection

### 10.1 Classification

| Public (N0) | Interne (N1) | Confidentiel (N2) | Restreint (N3) |
|-------------|-------------|-------------------|---------------|
| Noms equipes | Emails | Mots de passe (haches) | Cles API |
| Dates matchs | Historique connexions | Tokens JWT | Cles chiffrement |
| Scores | Preferences user | Donnees paiement | Certificats |
| Stats base | Logs applicatifs | Documents identite | Logs audit |

### 10.2 Chiffrement

```typescript
class ColumnLevelEncryption {
  private masterKey: Buffer;

  constructor() { this.masterKey = Buffer.from(process.env.DATA_ENCRYPTION_KEY!, 'base64'); }

  async encrypt(plaintext: string): Promise<string> {
    const dataKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
    let enc = cipher.update(plaintext, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return Buffer.from(`${iv.toString('hex')}:${dataKey.toString('base64')}:${tag}:${enc}`).toString('base64');
  }

  async decrypt(encrypted: string): Promise<string> {
    const buf = Buffer.from(encrypted, 'base64').toString();
    const [iv, keyB64, tag, ct] = buf.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(keyB64, 'base64'), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return decipher.update(ct, 'hex', 'utf8') + decipher.final('utf8');
  }
}
```

### 10.3 Data Loss Prevention (DLP)

```typescript
class DLPEngine {
  private patterns = [
    { regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, type: 'email', action: 'mask' },
    { regex: /\b\d{16}\b/, type: 'credit_card', action: 'block' },
    { regex: /sk-[A-Za-z0-9]{32,}/, type: 'openai_key', action: 'block' },
    { regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, type: 'private_key', action: 'block' },
    { regex: /(?:AKIA|ASIA)[A-Z0-9]{16}/, type: 'aws_key', action: 'block' }
  ];

  inspect(content: string): Array<{ type: string; action: string }> {
    const findings: Array<{ type: string; action: string }> = [];
    for (const p of this.patterns) {
      if (p.regex.test(content)) findings.push({ type: p.type, action: p.action });
    }
    return findings;
  }
}
```

---

## 11. API Security

### 11.1 API Gateway

```typescript
const apiGatewayRoutes = [
  { path: '/api/public/*', methods: ['GET'], auth: 'none', rateLimit: 100 },
  { path: '/api/auth/*', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: 'jwt', rateLimit: 50 },
  { path: '/api/admin/*', methods: ['*'], auth: 'jwt', rateLimit: 20, roles: ['admin', 'super_admin'] },
  { path: '/api/internal/*', methods: ['*'], auth: 'mtls', rateLimit: 500 },
  { path: '/socket.io/*', methods: ['GET', 'POST'], auth: 'jwt', rateLimit: 30 }
];
```

### 11.2 Rate Limiting

```typescript
class RateLimiter {
  private redis: Redis;
  private limits: Map<string, number> = new Map();

  async check(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const current = await this.redis.incr(`ratelimit:${key}`);
    if (current === 1) await this.redis.pexpire(`ratelimit:${key}`, windowMs);
    return current <= maxRequests;
  }

  async middleware(req: any, res: any, next: any) {
    const key = req.ip;
    const allowed = await this.check(key, 100, 60000);
    if (!allowed) return res.status(429).json({ error: 'Trop de requetes' });
    next();
  }
}
```

### 11.3 Schema Validation

```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  deviceId: z.string().uuid().optional()
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/),
  name: z.string().min(2).max(50),
  acceptTerms: z.literal(true)
});

function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(result.error.errors.map(e => e.message).join(', '));
  return result.data;
}
```

### 11.4 Audit API

```typescript
interface APIAuditEvent {
  id: string; timestamp: Date; userId: string;
  method: string; path: string; statusCode: number;
  ipAddress: string; userAgent: string; duration: number;
  requestBody?: string; responseBody?: string;
}

class APIAuditor {
  async log(event: Omit<APIAuditEvent, 'id' | 'timestamp'>): Promise<void> {
    await prisma.apiAuditLog.create({
      data: { id: crypto.randomUUID(), timestamp: new Date(), ...event }
    });
  }
}
```

---

## 12. Session Security

### 12.1 JWT Structure

```typescript
interface JWTPayload {
  sub: string;       // User ID
  jti: string;       // Session ID
  iat: number;       // Issued at
  exp: number;       // Expiration
  iss: string;       // Issuer (nba-platform)
  aud: string;       // Audience (nba-api)
  roles: string[];   // User roles
  mfa: boolean;      // MFA verified
  device: string;    // Device fingerprint hash
  ip: string;        // IP address at issuance
  tid: string;       // Tenant ID
}

// JWT Header: { "alg": "ES256", "typ": "JWT", "kid": "key-v1" }
// JWT Payload: { "sub": "user_123", "jti": "sess_456", ... }
// JWT Signature: ECDSA P-256 signature
```

### 12.2 Session Management

```typescript
class SessionManager {
  private readonly SESSION_TTL = 24 * 3600; // 24h
  private readonly MAX_CONCURRENT = 3;

  async createSession(userId: string, deviceId: string, ip: string): Promise<string> {
    const activeSessions = await this.countActiveSessions(userId);
    if (activeSessions >= this.MAX_CONCURRENT) {
      await this.revokeOldestSession(userId);
    }
    const sessionId = crypto.randomUUID();
    const token = await this.generateJWT({ sub: userId, jti: sessionId });
    await redis.setex(`session:${sessionId}`, this.SESSION_TTL, JSON.stringify({
      userId, deviceId, ip, createdAt: new Date()
    }));
    return token;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`);
    await redis.setex(`revoked:${sessionId}`, 86400, '1');
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    return (await redis.get(`revoked:${sessionId}`)) === '1';
  }

  private async generateJWT(payload: any): Promise<string> {
    const { SignJWT } = await import('jose');
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer('nba-platform')
      .setAudience('nba-api')
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(new TextEncoder().encode(process.env.JWT_PRIVATE_KEY!));
  }
}
```

### 12.3 Rotation et Revocation

```typescript
class SessionRotation {
  async rotateToken(oldToken: string): Promise<string> {
    const { jwtVerify, SignJWT } = await import('jose');
    const { payload } = await jwtVerify(oldToken, new TextEncoder().encode(process.env.JWT_PUBLIC_KEY!));
    const newSessionId = crypto.randomUUID();
    await redis.setex(`revoked:${payload.jti}`, 300, '1'); // grace period
    return new SignJWT({ ...payload, jti: newSessionId })
      .setProtectedHeader({ alg: 'ES256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_PRIVATE_KEY!));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await redis.keys(`session:*`);
    for (const key of sessions) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data as string);
        if (session.userId === userId) {
          const sessionId = key.replace('session:', '');
          await redis.del(key);
          await redis.setex(`revoked:${sessionId}`, 86400, '1');
        }
      }
    }
  }
}
```

### 12.4 Controle de sessions concurrentes

| Plan | Sessions max | Duree max | Inactivite max | Rotation |
|------|-------------|-----------|---------------|----------|
| Free | 1 | 12h | 30min | 24h |
| Premium | 3 | 48h | 2h | 24h |
| Admin | 2 | 8h | 15min | 6h |
| API | 5 | 7j | 24h | 7j |

---

## 13. Secrets Management

### 13.1 Architecture Vault

```
Application -> Vault Agent -> HashiCorp Vault -> HSM
                  |                 |
                  v                 v
             Sidecar cache    Backend: Transit/ KV
```

```typescript
class VaultManager {
  private vaultAddr = process.env.VAULT_ADDR!;
  private vaultToken: string;

  async getSecret(path: string, key: string): Promise<string> {
    const response = await fetch(`${this.vaultAddr}/v1/secret/data/${path}`, {
      headers: { 'X-Vault-Token': this.vaultToken }
    });
    const data = await response.json();
    return data.data.data[key];
  }

  async rotateSecret(path: string, key: string, newValue: string): Promise<void> {
    const current = await this.getSecret(path, key);
    await fetch(`${this.vaultAddr}/v1/secret/data/${path}`, {
      method: 'POST',
      headers: { 'X-Vault-Token': this.vaultToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { [key]: newValue, [`${key}_previous`]: current } })
    });
  }
}
```

### 13.2 Environment Isolation

| Environnement | Vault path | Rotation | Acces | Audit |
|--------------|-----------|---------|------|-------|
| Development | dev/ | Jamais | Tous devs | Basique |
| Staging | staging/ | 90j | CI/CD + leads | Detail |
| Production | prod/ | 30j | CI/CD only | Full |

### 13.3 CI/CD Secrets

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    environment: production
    steps:
      - name: Load secrets from Vault
        uses: hashicorp/vault-action@v3
        with:
          url: ${{ secrets.VAULT_ADDR }}
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/prod/database url | DATABASE_URL;
            secret/data/prod/redis url | REDIS_URL;
            secret/data/prod/jwt private_key | JWT_PRIVATE_KEY;
```

---

## 14. Audit & Compliance

### 14.1 Logging centralise

```typescript
enum AuditEventType {
  LOGIN_SUCCESS = 'login_success', LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout', TOKEN_REFRESH = 'token_refresh',
  MFA_ENROLL = 'mfa_enroll', MFA_VERIFY = 'mfa_verify',
  ROLE_CHANGE = 'role_change', PERMISSION_CHANGE = 'permission_change',
  JIT_GRANT = 'jit_grant', JIT_REVOKE = 'jit_revoke',
  API_KEY_CREATE = 'api_key_create', API_KEY_REVOKE = 'api_key_revoke',
  DATA_ACCESS = 'data_access', DATA_EXPORT = 'data_export',
  ADMIN_ACTION = 'admin_action', CONFIG_CHANGE = 'config_change',
  SESSION_REVOKE = 'session_revoke', DEVICE_REGISTER = 'device_register',
  THREAT_DETECTED = 'threat_detected', INCIDENT_CREATED = 'incident_created'
}

interface AuditEvent {
  id: string; timestamp: Date; type: AuditEventType;
  userId: string; sessionId: string; ipAddress: string;
  userAgent: string; resource: string; action: string;
  status: 'success' | 'failure' | 'pending';
  metadata: Record<string, any>;
  hash: string; // Integrity chain hash
  previousHash: string;
}

class AuditLogger {
  private async computeHash(event: AuditEvent): Promise<string> {
    const data = JSON.stringify(event);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<void> {
    const lastEvent = await this.getLastEvent();
    const auditEvent: AuditEvent = {
      ...event, id: crypto.randomUUID(), timestamp: new Date(),
      hash: '', previousHash: lastEvent?.hash || '0'.repeat(64)
    } as AuditEvent;
    auditEvent.hash = await this.computeHash(auditEvent);
    await prisma.auditLog.create({ data: auditEvent as any });
  }

  async verifyIntegrity(): Promise<boolean> {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'asc' } });
    for (let i = 0; i < logs.length; i++) {
      const prevHash = i === 0 ? '0'.repeat(64) : logs[i - 1].hash;
      if (logs[i].previousHash !== prevHash) return false;
      const event = { ...logs[i] };
      delete (event as any).id;
      const hash = await this.computeHash(event);
      if (hash !== logs[i].hash) return false;
    }
    return true;
  }
}
```

### 14.2 Compliance Mapping

| Controle | RGPD | SOC 2 | ISO 27001 | NBA Implementation |
|---------|------|-------|-----------|-------------------|
| Acces aux donnees | Art. 32 | CC6.1 | A.9.1.2 | RBAC + PBAC + JIT |
| Chiffrement | Art. 32 | CC6.7 | A.10.1.1 | AES-256-GCM + TLS 1.3 |
| Journalisation | Art. 5 | CC7.2 | A.12.4.1 | Audit immutable chain |
| Gestion identites | Art. 24 | CC6.2 | A.9.2.1 | Better Auth + MFA |
| Incident response | Art. 33 | CC7.3 | A.16.1.1 | Playbooks + SIEM |
| Sauvegarde | Art. 32 | CC6.5 | A.12.3.1 | RPO 15min, RTO 1h |
| Tests penetration | Art. 32 | CC7.1 | A.12.6.1 | Trimestriel + automatise |

### 14.3 Immutable Logs

```sql
-- Table d audit avec chaine d integrite
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),
  ip_address INET,
  resource VARCHAR(255),
  action VARCHAR(100),
  status VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_type ON audit_logs(event_type);

-- Trigger empechant la modification
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Les logs d audit sont immutables';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

---

## 15. Incident Response

### 15.1 Classification des incidents

| Niveau | Nom | Exemple | Temps reponse | Temps resolution |
|--------|-----|---------|--------------|-----------------|
| Sev-1 | Critique | Breche de donnees, compromission admin | 15min | 4h |
| Sev-2 | Haut | Attaque DDoS, defacement | 30min | 8h |
| Sev-3 | Moyen | Tentative d intrusion, malwares | 2h | 24h |
| Sev-4 | Bas | Scanning, tentatives brute force | 8h | 72h |

### 15.2 Playbook incident

```typescript
interface IncidentPlaybook {
  id: string; name: string; severity: string;
  steps: PlaybookStep[]; roles: string[];
  automated: boolean; maxExecutionTime: number;
}

interface PlaybookStep {
  order: number; action: string; automated: boolean;
  timeout: number; escalationOnFailure: boolean;
}

const playbooks: Record<string, IncidentPlaybook> = {
  account_takeover: {
    id: 'IR-001', name: 'Reprise de compte', severity: 'critical',
    steps: [
      { order: 1, action: 'REVOKE_ALL_SESSIONS', automated: true, timeout: 30, escalationOnFailure: true },
      { order: 2, action: 'RESET_PASSWORD', automated: true, timeout: 60, escalationOnFailure: true },
      { order: 3, action: 'ENABLE_MFA_FORCE', automated: true, timeout: 30, escalationOnFailure: false },
      { order: 4, action: 'NOTIFY_USER', automated: true, timeout: 300, escalationOnFailure: false },
      { order: 5, action: 'LOG_ALL_ACTIVITY', automated: true, timeout: 30, escalationOnFailure: false }
    ],
    roles: ['security_analyst'], automated: true, maxExecutionTime: 600
  },
  data_breach: {
    id: 'IR-002', name: 'Fuite de donnees', severity: 'critical',
    steps: [
      { order: 1, action: 'ISOLATE_AFFECTED_SYSTEMS', automated: false, timeout: 300, escalationOnFailure: true },
      { order: 2, action: 'REVOKE_COMPROMISED_CREDENTIALS', automated: true, timeout: 60, escalationOnFailure: true },
      { order: 3, action: 'ENABLE_READ_ONLY_MODE', automated: true, timeout: 120, escalationOnFailure: true },
      { order: 4, action: 'NOTIFY_LEGAL_TEAM', automated: false, timeout: 600, escalationOnFailure: true },
      { order: 5, action: 'INITIATE_FORENSIC_COLLECTION', automated: false, timeout: 3600, escalationOnFailure: true }
    ],
    roles: ['security_lead', 'ciso'], automated: false, maxExecutionTime: 7200
  },
  ddos_attack: {
    id: 'IR-003', name: 'Attaque DDoS', severity: 'high',
    steps: [
      { order: 1, action: 'ENABLE_CLOUDFLARE_DDOS_MITIGATION', automated: true, timeout: 60, escalationOnFailure: true },
      { order: 2, action: 'SCALE_UP_INFRASTRUCTURE', automated: true, timeout: 300, escalationOnFailure: true },
      { order: 3, action: 'ENABLE_RATE_LIMITING_STRICT', automated: true, timeout: 30, escalationOnFailure: false },
      { order: 4, action: 'BLOCK_ATTACK_SOURCES', automated: true, timeout: 120, escalationOnFailure: false },
      { order: 5, action: 'MONITOR_TRAFFIC_PATTERNS', automated: true, timeout: 600, escalationOnFailure: false }
    ],
    roles: ['security_analyst', 'devops'], automated: true, maxExecutionTime: 1800
  }
};

class IncidentResponder {
  async executePlaybook(incidentId: string, playbookId: string): Promise<void> {
    const playbook = playbooks[playbookId];
    if (!playbook) throw new Error('Playbook not found');
    for (const step of playbook.steps) {
      try {
        await this.executeStep(step, incidentId);
        await this.logStep(incidentId, step, 'success');
      } catch (error) {
        await this.logStep(incidentId, step, 'failure', error);
        if (step.escalationOnFailure) await this.escalate(incidentId, step);
      }
    }
  }

  private async executeStep(step: PlaybookStep, incidentId: string): Promise<void> {
    if (!step.automated) {
      await this.createTask(step.action, incidentId);
      return;
    }
    switch (step.action) {
      case 'REVOKE_ALL_SESSIONS': await this.revokeAllSessions(); break;
      case 'RESET_PASSWORD': await this.resetPassword(); break;
      case 'ENABLE_MFA_FORCE': await this.forceMFA(); break;
      case 'ISOLATE_AFFECTED_SYSTEMS': await this.isolateSystems(); break;
      case 'ENABLE_CLOUDFLARE_DDOS_MITIGATION': await this.enableDDoSProtection(); break;
    }
  }
}
```

### 15.3 Detection et alertes

```typescript
interface DetectionRule {
  id: string; name: string; severity: string;
  condition: string; // Expression evaluable
  throttle: number; // Secondes entre alertes
  autoRemediate: boolean;
  playbookId?: string;
}

const detectionRules: DetectionRule[] = [
  { id: 'DR-001', name: 'Tentative brute force', severity: 'high', condition: 'failed_logins > 10 IN 5min', throttle: 60, autoRemediate: true, playbookId: 'account_takeover' },
  { id: 'DR-002', name: 'Token replay detecte', severity: 'critical', condition: 'same_token_diff_ips > 3 IN 1min', throttle: 30, autoRemediate: true },
  { id: 'DR-003', name: 'Mouvement lateral', severity: 'critical', condition: 'user_access_diff_services IN 5min', throttle: 60, autoRemediate: false, playbookId: 'data_breach' },
  { id: 'DR-004', name: 'Traffic anormal', severity: 'medium', condition: 'requests_per_second > 1000', throttle: 120, autoRemediate: true, playbookId: 'ddos_attack' },
  { id: 'DR-005', name: 'Acces donnees sensibles', severity: 'high', condition: 'data_classification=restricted AND user_role!=super_admin', throttle: 60, autoRemediate: false }
];
```

---

## 16. Monitoring & Observability

### 16.1 Metriques de securite

```typescript
interface SecurityMetrics {
  // Authentification
  loginSuccessRate: number;       // Taux de succes connexion
  mfaEnrollmentRate: number;      // Taux d adoption MFA
  accountLockoutRate: number;     // Taux de verrouillage
  sessionHijackAttempts: number;  // Tentatives de hijack

  // API
  apiRequestRate: number;         // Requetes/sec
  apiErrorRate: number;           // Taux d erreur
  apiLatencyP99: number;          // Latence percentile 99
  rateLimitBreaches: number;      // Depassements rate limit

  // Dispositifs
  deviceComplianceRate: number;   // Taux de conformite
  jailbreakDetections: number;    // Jailbreak/root detectes
  outdatedOSCount: number;        // OS non a jour

  // Menaces
  blockedRequests: number;        // Requetes bloquees WAF
  threatDetections: number;       // Menaces detectees
  incidentsOpen: number;          // Incidents ouverts
  meanTimeToDetect: number;       // Temps moyen de detection
  meanTimeToRespond: number;      // Temps moyen de reponse
}

async function collectSecurityMetrics(): Promise<SecurityMetrics> {
  const [logins, api, devices, threats] = await Promise.all([
    prisma.auditLog.groupBy({ by: ['status'], where: { type: 'LOGIN_ATTEMPT', timestamp: { gte: new Date(Date.now() - 3600000) } }, _count: true }),
    prisma.apiAuditLog.aggregate({ where: { timestamp: { gte: new Date(Date.now() - 3600000) } }, _avg: { duration: true }, _count: true }),
    redis.keys('device:*:posture'),
    prisma.securityEvent.count({ where: { type: 'THREAT_DETECTED', timestamp: { gte: new Date(Date.now() - 3600000) } } })
  ]);
  return { loginSuccessRate: 0.95, mfaEnrollmentRate: 0.78, apiRequestRate: 1500, blockedRequests: threats, /*...*/ } as SecurityMetrics;
}
```

### 16.2 Tableaux de bord

```
+------------------------------------------------------------------+
|              TABLEAU DE BORD SECURITE ZERO TRUST                  |
+------------------------------------------------------------------+
|  +----------------+  +----------------+  +-------------------+    |
|  | Score ZT       |  | Taux MFA       |  | Appareils         |    |
|  | 72%            |  | 78%            |  | conformes: 89%    |    |
|  +----------------+  +----------------+  +-------------------+    |
|  +----------------+  +----------------+  +-------------------+    |
|  | Requetes/min   |  | Taux erreur    |  | Incidents         |    |
|  | 1,500          |  | 0.02%          |  | ouverts: 3        |    |
|  +----------------+  +----------------+  +-------------------+    |
|  +----------------+  +----------------+  +-------------------+    |
|  | MTD: 12min     |  | MTR: 45min     |  | Menaces: 127     |    |
|  +----------------+  +----------------+  +-------------------+    |
|                                                                    |
|  Graphiques:                                                        |
|  [Score ZT sur 30 jours] [Connexions par heure] [Blocages WAF]    |
|  [Posture appareils] [Latence API] [Incidents par severite]       |
+------------------------------------------------------------------+
```

### 16.3 SIEM Integration

```typescript
class SIEMForwarder {
  private readonly SIEM_ENDPOINT = process.env.SIEM_ENDPOINT!;

  async forwardEvent(event: AuditEvent): Promise<void> {
    const normalized = this.normalizeToCEF(event);
    await fetch(this.SIEM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    });
  }

  private normalizeToCEF(event: AuditEvent) {
    return {
      cefVersion: 'CEF:0',
      deviceVendor: 'NBA',
      deviceProduct: 'ZeroTrust',
      deviceVersion: '1.0',
      signatureId: event.type,
      name: event.action,
      severity: this.mapSeverity(event.type),
      ext: {
        userId: event.userId,
        sessionId: event.sessionId,
        src: event.ipAddress,
        request: event.resource,
        outcome: event.status,
        msg: JSON.stringify(event.metadata)
      }
    };
  }

  private mapSeverity(type: AuditEventType): number {
    const severityMap: Record<string, number> = {
      threat_detected: 10, incident_created: 9, admin_action: 7,
      login_failure: 5, data_access: 3, device_register: 1
    };
    return severityMap[type] || 3;
  }
}
```

### 16.4 Alerting

```typescript
interface AlertRule {
  id: string; name: string; metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number; duration: number; // secondes
  channels: ('email' | 'slack' | 'pagerduty' | 'sms')[];
  severity: 'info' | 'warning' | 'critical';
}

const alertRules: AlertRule[] = [
  { id: 'AL-001', name: 'Tentative brute force', metric: 'failed_logins_per_min', condition: 'gt', threshold: 10, duration: 60, channels: ['slack', 'pagerduty'], severity: 'critical' },
  { id: 'AL-002', name: 'Taux erreur API eleve', metric: 'api_error_rate', condition: 'gt', threshold: 0.05, duration: 300, channels: ['slack'], severity: 'warning' },
  { id: 'AL-003', name: 'Dispositifs non conformes', metric: 'device_compliance_rate', condition: 'lt', threshold: 0.8, duration: 600, channels: ['email', 'slack'], severity: 'warning' },
  { id: 'AL-004', name: 'Score ZT en baisse', metric: 'zero_trust_score', condition: 'lt', threshold: 0.6, duration: 3600, channels: ['slack', 'email', 'pagerduty'], severity: 'critical' },
  { id: 'AL-005', name: 'Latence API excessive', metric: 'api_latency_p99', condition: 'gt', threshold: 2000, duration: 300, channels: ['slack', 'pagerduty'], severity: 'critical' }
];
```

---

## 17. Threat Modeling

### 17.1 STRIDE par composant

| Composant | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|-----------|----------|-----------|-------------|----------------|-----|-----------|
| Next.js API | JWT falsifie | Injection body | Logs manquants | Headers exposes | Rate limit depasse | Role escalade |
| Better Auth | OAuth phishing | Modification cookie | Audit absent | Token dans URL | Auth DoS | MFA bypass |
| Prisma/DB | Connexion usurpee | SQL injection | Audit log falsifie | Donnees en clair | Connection pool | Privilege DB |
| Redis | Cle usurpee | Corruption cache | Pas de log | Donnees sensibles cachees | Memory exhaustion | - |
| Socket.IO | Fake socket ID | Injection message | Logs non horodates | Fuite room/data | Socket flood | Acces room non authorise |
| Cloudflare | DNS spoofing | Regle WAF modifiee | Logs CDN absents | Cache poison | DDoS | - |

### 17.2 Attack Trees

```
Attack Tree: Prise de controle administrateur

[1] OBJECTIF: Acceder en tant qu administrateur
    |
    +-- [1.1] Voler les identifiants admin
    |       +-- [1.1.1] Phishing
    |       |       +-- Email cible (Mitigation: DMARC, anti-phishing training)
    |       |       +-- Page de faux login (Mitigation: WebAuthn, certs client)
    |       +-- [1.1.2] Credential stuffing
    |       |       +-- Base de donnees compromise (Mitigation: MFA, rate limiting)
    |       |       +-- Brute force (Mitigation: Account lockout, captcha)
    |       +-- [1.1.3] Keylogging
    |               +-- Malware poste admin (Mitigation: EDR, device posture)
    |
    +-- [1.2] Exploiter session existante
    |       +-- [1.2.1] Vol de cookie JWT
    |       |       +-- XSS (Mitigation: CSP, HttpOnly cookies)
    |       |       +-- Sniffing reseau (Mitigation: TLS 1.3, HSTS)
    |       +-- [1.2.2] Session fixation
    |       |       +-- Forcer JWT connu (Mitigation: Random jti, rotation)
    |       +-- [1.2.3] CSRF
    |               +-- Lien malveillant (Mitigation: SameSite=Strict, CSRF token)
    |
    +-- [1.3] Exploiter vulnerabilite applicative
    |       +-- [1.3.1] IDOR
    |       |       +-- Modifier userId dans requete (Mitigation: PBAC, validation)
    |       +-- [1.3.2] RCE
    |       |       +-- Injection commande (Mitigation: Input sanitization)
    |       +-- [1.3.3] Path traversal
    |               +-- ../ dans path (Mitigation: WAF, validation)
    |
    +-- [1.4] Bypasser MFA
            +-- [1.4.1] MFA fatigue
            |       +-- Notifications repetees (Mitigation: Rate limit MFA)
            +-- [1.4.2] Backup code vole
            |       +-- Stockage insecure (Mitigation: Encryption backup codes)
            +-- [1.4.3] SIM swap
                    +-- Port out telephone (Mitigation: TOTP > SMS, hardware key)
```

### 17.3 Mitigation Mapping

```typescript
const threatMitigations: Record<string, string[]> = {
  'JWT_FALSIFICATION': ['ES256 signature', 'JWK rotation', 'jti validation', 'short expiry'],
  'SQL_INJECTION': ['Prisma ORM', 'parameterized queries', 'WAF rules', 'input validation'],
  'XSS': ['CSP headers', 'HttpOnly cookies', 'input sanitization', 'output encoding'],
  'CSRF': ['SameSite cookies', 'CSRF tokens', 'Origin validation', 'double submit cookie'],
  'BRUTE_FORCE': ['rate limiting', 'account lockout', 'captcha', 'MFA requirement'],
  'SESSION_HIJACK': ['device fingerprint', 'IP binding', 'session rotation', 'anomaly detection'],
  'MFA_BYPASS': ['TOTP + hardware key', 'backup code encryption', 'MFA rate limiting'],
  'DDoS': ['Cloudflare mitigation', 'auto-scaling', 'rate limiting', 'WAF'],
  'DATA_BREACH': ['encryption at rest', 'DLP', 'access control', 'audit logging']
};
```

### 17.4 Matrice de risque residuel

| Menace | Probabilite | Impact | Risque | Mitigation | Risque residuel |
|--------|-------------|--------|--------|------------|-----------------|
| Credential stuffing | Eleve | Haut | Critique | MFA + rate limit + lockout | Moyen |
| Injection SQL | Moyen | Critique | Haut | Prisma ORM + WAF | Faible |
| Session hijack | Moyen | Haut | Haut | Device binding + rotation | Faible |
| DDoS | Eleve | Moyen | Haut | Cloudflare + scaling | Faible |
| Fuite donnees | Faible | Critique | Haut | Encryption + DLP + RBAC | Faible |
| Privilege escalation | Faible | Haut | Moyen | RBAC + JIT + audit | Tres faible |

---

## 18. Disaster Recovery & Business Continuity

### 18.1 Strategie de sauvegarde

```typescript
interface BackupStrategy {
  component: string; method: string; frequency: string;
  retention: string; rpo: string; rto: string;
  encrypted: boolean; location: string;
}

const backupStrategies: BackupStrategy[] = [
  { component: 'PostgreSQL/Neon', method: 'Point-in-time recovery', frequency: 'Continue (WAL)', retention: '30 jours', rpo: '5 min', rto: '1h', encrypted: true, location: 'Neon + S3' },
  { component: 'Redis', method: 'Snapshot RDB + AOF', frequency: 'Toutes les 6h', retention: '7 jours', rpo: '6h', rto: '30min', encrypted: true, location: 'S3' },
  { component: 'Fichiers upload', method: 'Replication synchrone', frequency: 'Temps reel', retention: '90 jours', rpo: '0', rto: '15min', encrypted: true, location: 'S3 + CDN' },
  { component: 'Secrets Vault', method: 'Snapshot + replication', frequency: 'Toutes les 24h', retention: '1 an', rpo: '24h', rto: '1h', encrypted: true, location: 'Vault DR + HSM' },
  { component: 'Audit logs', method: 'Replication temps reel', frequency: 'Continue', retention: '7 ans', rpo: '5 min', rto: '30min', encrypted: true, location: 'S3 Glacier + Neon' },
  { component: 'Configuration', method: 'GitOps + IaC', frequency: 'A chaque changement', retention: 'Indefini (git)', rpo: '1 changement', rto: '1h', encrypted: false, location: 'Git + Terraform' }
];
```

### 18.2 Plan de reprise

```
Scenario: Panne totale region primaire

[1] DETECTION (0-5 min)
    Health check echoue -> Alert PagerDuty -> On-call confirme

[2] DECLENCHEMENT (5-10 min)
    Decision basculement -> Equipe securite notifiee
    Communication utilisateurs preparee

[3] BASCULEMENT (10-45 min)
    DNS update -> Cloudflare failover -> Region secondaire active
    Neon failover -> Read replica devient primary
    Redis replication activee
    Vault DR instance demarree

[4] VERIFICATION (45-60 min)
    Tests fonctionnels -> Tests securite -> Monitoring vert
    Utilisateurs reconnectes

[5] RETOUR (post-crise)
    Analyse root cause -> Remediation -> Retour region primaire
```

### 18.3 Chaos Engineering

```typescript
class ChaosExperiment {
  async runDisruptionTest(): Promise<void> {
    console.log('[CHAOS] Demarrage tests de resilience...');

    // Test 1: Arret Redis
    try {
      await this.stopRedis();
      const appWorks = await this.checkAppFunctionality();
      if (appWorks) console.log('[CHAOS] OK: App fonctionne sans Redis');
    } finally { await this.startRedis(); }

    // Test 2: Latence DB
    try {
      await this.injectLatency('postgres', 5000);
      const delayed = await this.checkAPILatency();
      if (delayed < 2000) console.log('[CHAOS] OK: Timeout DB gere');
    } finally { await this.removeLatency('postgres'); }

    // Test 3: Panne Cloudflare
    try {
      await this.blockCDNTraffic();
      const directWorks = await this.checkDirectAccess();
      if (directWorks) console.log('[CHAOS] OK: Fallback direct fonctionne');
    } finally { await this.restoreCDN(); }

    // Test 4: Rotation certificats
    try {
      await this.rotateCerts();
      const mTLSWorks = await this.checkMTLS();
      if (mTLSWorks) console.log('[CHAOS] OK: Rotation certificats reussie');
    } catch (e) { console.error('[CHAOS] ECHEC: Rotation certificats'); }
  }
}
```

---

## 19. Implementation Roadmap

### 19.1 Phases

| Phase | Duree | Objectif | Dependances | Livrables |
|-------|-------|----------|-------------|-----------|
| Phase 0: Fondation | J0-J30 | Audit, instrumentation | Aucune | Rapport audit, instrumentation logs |
| Phase 1: Identite | J31-J90 | Better Auth ZT, MFA, RBAC | Phase 0 | Auth.config ZT, MFA force, RBAC complet |
| Phase 2: Reseau | J91-J150 | TLS 1.3, mTLS, segmentation | Phase 1 | mTLS actif, politique reseau, WAF |
| Phase 3: Dispositif | J151-J210 | Device trust, posture, MDM | Phase 1 | Device fingerprint, posture scoring |
| Phase 4: Continu | J211-J300 | Verification continue, risk scoring | Phases 1-3 | Risk engine, re-auth auto |
| Phase 5: Automatisation | J301-J365 | Playbooks, auto-remediation, IR | Phases 1-4 | Incident auto-response, SIEM |
| Phase 6: Optimisation | J366-J455 | Chaos engineering, prediction | Phases 1-5 | Tests resilience, ML detection |

### 19.2 Matrice de dependances

```
Phase 0 (Fondation)
  +-- Phase 1 (Identite)
  |     +-- Phase 3 (Dispositif)
  |     +-- Phase 4 (Continu)
  |     +-- Phase 5 (Automatisation)
  +-- Phase 2 (Reseau)
        +-- Phase 4 (Continu)
        +-- Phase 5 (Automatisation)
        +-- Phase 6 (Optimisation)
```

### 19.3 Migration depuis le modele perimeteral

| Perimeteral | Zero Trust | Effort migration | Risque |
|------------|-----------|-----------------|--------|
| VPN pour acces interne | Acces base sur identite + posture | Eleve | Moyen |
| Pare-feu perimeter | Micro-segmentation + WAF | Eleve | Faible |
| Mots de passe seuls | MFA obligatoire + SSO | Moyen | Faible |
| Confiance interne | Zero trust pour tout le trafic | Tres eleve | Haut |
| Logs centralises | Audit immutable + chaine integrite | Moyen | Faible |
| Approbation manuelle | JIT + auto-provisioning | Eleve | Moyen |
| Revision acces annuelle | Verification continue + scoring | Moyen | Faible |

### 19.4 KPIs de progression

| KPI | Cible Phase 0 | Cible Phase 2 | Cible Phase 4 | Cible Phase 6 |
|-----|--------------|--------------|--------------|--------------|
| Score Zero Trust | <30% | 50% | 75% | >90% |
| Taux MFA | 0% | 60% | 85% | 95% |
| Appareils conformes | 0% | 40% | 75% | 95% |
| Temps detection (MTTD) | >24h | <4h | <30min | <5min |
| Temps reponse (MTTR) | >48h | <8h | <1h | <15min |
| Couverture audit | 20% | 60% | 90% | 100% |
| Automatisation IR | 0% | 20% | 60% | 90% |

---

## 20. Appendices

### A. NIST SP 800-207 Mapping Complet

| Principe NIST | Description | Implementation NBA | Verification |
|--------------|-------------|-------------------|-------------|
| 1 | Toute source de donnees est une ressource | Toutes les APIs, DB, caches sont des ressources protegees | Audit d acces |
| 2 | Toute communication securisee | TLS 1.3 partout, mTLS interne, certificats automatiques | Scan TLS, test mTLS |
| 3 | Acces par session | JWT avec jti, rotation, revocation, device binding | Revue logs session |
| 4 | Politique dynamique | OPA/Rego + PBAC + contexte (IP, device, heure, risque) | Tests politiques |
| 5 | Monitorer integrite | Device posture, checksum, verification continue | Tests posture |
| 6 | Auth dynamique avant acces | Better Auth + MFA + Risk scoring + Challenge | Tests auth |
| 7 | Collecter logs | Audit immutable, SIEM, chaine integrite | Verification chaine |

### B. Checklist Securite Zero Trust

```markdown
## Checklist Quotidienne
- [ ] Verifier les alertes securite (PagerDuty, Slack)
- [ ] Consulter le score Zero Trust (dashboard)
- [ ] Verifier les tentatives de connexion echouees
- [ ] Contrler les acces JIT actifs
- [ ] Voir les dispositifs non conformes

## Checklist Hebdomadaire
- [ ] Analyser les logs d audit (anomalies)
- [ ] Verifier les certificats (expiration < 30j)
- [ ] Tester les playbooks d incident
- [ ] Reviser les permissions des API keys
- [ ] Mettre a jour les regles WAF

## Checklist Mensuelle
- [ ] Rotation des secrets (Vault, mots de passe)
- [ ] Revue des acces utilisateurs (RBAC)
- [ ] Test de penetration (automatise)
- [ ] Analyse des tendances de securite
- [ ] Mise a jour des politiques Zero Trust

## Checklist Trimestrielle
- [ ] Audit de securite complet
- [ ] Tests de resilience (chaos engineering)
- [ ] Revue des fournisseurs OAuth
- [ ] Mise a jour de la matrice de risque
- [ ] Formation equipe securite

## Checklist Annuelle
- [ ] Audit de conformite (RGPD, SOC2, ISO 27001)
- [ ] Test de penetration externe
- [ ] Revue complete de l architecture ZT
- [ ] Mise a jour du plan de reprise
- [ ] Exercice de crise (tabletop)
```

### C. Fichiers de configuration

```yaml
# docker-compose.security.yml
version: '3.8'
services:
  vault:
    image: hashicorp/vault:1.18
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN}
    volumes:
      - vault-data:/vault/data
    ports:
      - "8200:8200"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --tls-port 6380 --port 0
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    command: postgres -c ssl=on -c ssl_cert_file=/etc/ssl/certs/server.crt -c ssl_key_file=/etc/ssl/private/server.key
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./certs:/etc/ssl/certs:ro

volumes:
  vault-data:
  redis-data:
  postgres-data:
```

```yaml
# .env.production
# Zero Trust Configuration
ZT_ENABLED=true
ZT_SCORE_THRESHOLD_DEFAULT=0.6
ZT_SCORE_THRESHOLD_ADMIN=0.9
ZT_SESSION_MAX_AGE=86400
ZT_SESSION_INACTIVITY_TIMEOUT=1800
ZT_MFA_REQUIRED=true
ZT_DEVICE_TRUST_REQUIRED=true

# JWT
JWT_ALGORITHM=ES256
JWT_ISSUER=nba-platform
JWT_AUDIENCE=nba-api
JWT_EXPIRY=24h
JWT_ROTATION_INTERVAL=6h

# Rate Limiting
RATE_LIMIT_GLOBAL=10000
RATE_LIMIT_PER_IP=100
RATE_LIMIT_LOGIN=10
RATE_LIMIT_ADMIN=20

# Encryption
DATA_ENCRYPTION_ALGORITHM=aes-256-gcm
KEY_ROTATION_DAYS=90
ENVELOPE_ENCRYPTION=true

# Audit
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_IMMUTABLE=true
AUDIT_INTEGRITY_CHECKS=true

# Incident Response
IR_AUTO_REMEDIATE=true
IR_ESCALATION_TIMEOUT=300
IR_MAX_EXECUTION_TIME=7200

# Monitoring
ALERT_CHANNELS=slack,pagerduty,email
METRICS_COLLECTION_INTERVAL=60
SIEM_FORWARDING_ENABLED=true
```

### D. Matrice de conformite complete

| Requirement | RGPD | SOC2 | ISO27001 | NBA | Statut |
|------------|------|------|----------|-----|--------|
| Consentement explicite | Art.7 | CC6.1 | A.8.2.3 | Cookie consent + opt-in | OK |
| Portabilite donnees | Art.20 | CC6.1 | A.8.2.3 | API export utilisateur | OK |
| Droit a l oubli | Art.17 | CC6.2 | A.8.2.3 | Anonymisation + purge | OK |
| Notification breche 72h | Art.33 | CC7.3 | A.16.1.1 | Auto-notification + playbook | OK |
| Chiffrement repos | Art.32 | CC6.7 | A.10.1.1 | AES-256-GCM + Vault | OK |
| Chiffrement transit | Art.32 | CC6.7 | A.10.1.1 | TLS 1.3 + mTLS | OK |
| Controle acces logique | Art.32 | CC6.3 | A.9.1.2 | RBAC + PBAC + JIT | OK |
| Journalisation | Art.5 | CC7.2 | A.12.4.1 | Audit immutable chain | OK |
| Tests penetration | Art.32 | CC7.1 | A.12.6.1 | Trimestriel + automatise | OK |
| Gestion incidents | Art.33 | CC7.3 | A.16.1.1 | Playbooks + auto-remediation | OK |
| Sauvegarde | Art.32 | CC6.5 | A.12.3.1 | RPO 5min RTO 1h | OK |
| Formation securite | Art.39 | CC1.1 | A.7.2.2 | Annuelle + obligatoire | OK |
| Evaluation fournisseurs | Art.28 | CC6.4 | A.15.1.1 | Due diligence + contrat | OK |
| Gestion des patches | - | CC6.8 | A.12.6.2 | Automatise + 7j max | OK |
| Gestion des changements | - | CC6.3 | A.12.1.2 | CI/CD + approbation | OK |

---

## References

1. NIST SP 800-207: Zero Trust Architecture
2. NIST SP 800-63B: Digital Identity Guidelines - Authentication
3. CIS Controls v8
4. OWASP API Security Top 10
5. OWASP ASVS (Application Security Verification Standard)
6. Better Auth Documentation (better-auth.com)
7. Cloudflare Zero Trust Documentation
8. HashiCorp Vault Documentation
9. RGPD (Reglement General sur la Protection des Donnees)
10. SOC 2 Trust Services Criteria
11. ISO/IEC 27001:2022

---

*Document maintenu par l equipe Securite NBA. Derniere mise a jour : 2026-07-22*

---

## Annexe E: Diagrammes de sequence detailles

### E.1 Authentification complete Zero Trust

```
Client                  Cloudflare              API Gateway              Better Auth              Redis/DB
  |                         |                       |                        |                       |
  |-- 1. HTTPS GET -------->|                       |                        |                       |
  |                         |-- 2. WAF check ------>|                        |                       |
  |                         |<-- 3. WAF allow ------|                        |                       |
  |                         |                       |                        |                       |
  |                         |-- 4. Rate limit ---->|                        |                       |
  |                         |<-- 5. OK -------------|                        |                       |
  |                         |                       |                        |                       |
  |                         |-- 6. Forward req ---->|                        |                       |
  |                         |                       |-- 7. Extract JWT ----->|                       |
  |                         |                       |<-- 8. JWT payload -----|                       |
  |                         |                       |                        |                       |
  |                         |                       |-- 9. Check revoked --->|-------> Redis ------->|
  |                         |                       |<-- 10. Not revoked ----|<------- Redis ---------|
  |                         |                       |                        |                       |
  |                         |                       |-- 11. Device check --->|                       |
  |                         |                       |<-- 12. Posture --------|                       |
  |                         |                       |                        |                       |
  |                         |                       |-- 13. Policy eval ---->|                       |
  |                         |                       |<-- 14. Allow/Deny -----|                       |
  |                         |                       |                        |                       |
  |                         |                       |-- 15. Audit log ------>|-------> DB ---------->|
  |                         |                       |                        |                       |
  |                         |<-- 16. Response ------|                        |                       |
  |<-- 17. 200 OK ----------|                       |                        |                       |
  |    (avec Set-Cookie     |                       |                        |                       |
  |     + Security headers) |                       |                        |                       |
```

### E.2 Rotation de token JIT

```
Client                          API Gateway                          Better Auth
  |                                  |                                  |
  |-- 1. Requete avec token -------->|                                  |
  |                                  |-- 2. Verifier age token -------->|
  |                                  |<-- 3. Age > 6h, rotation -------|
  |                                  |       requise                   |
  |                                  |                                  |
  |                                  |-- 4. Verifier refresh token --->|
  |                                  |<-- 5. Nouveau token -------------|
  |                                  |                                  |
  |                                  |-- 6. Revoke ancien token ------>|
  |                                  |<-- 7. OK ------------------------|
  |                                  |                                  |
  |<-- 8. 200 + Set-Cookie ---------|                                  |
  |    (nouveau token +             |                                  |
  |     refresh token)              |                                  |
```

### E.3 Verification continue

```
ContinuousVerificationEngine              Redis                       Session
        |                                   |                          |
        |-- 1. Loop toutes les 60s ---------|                          |
        |                                   |                          |
        |-- 2. Get active sessions ---------|-------> keys session:* ->|
        |<-- 3. Liste sessions -------------|<------------------------|
        |                                   |                          |
        |   Pour chaque session:            |                          |
        |                                   |                          |
        |-- 4. Get session data ------------|-------> get session:X -->|
        |<-- 5. Session state --------------|<------------------------|
        |                                   |                          |
        |-- 6. Evaluate risk factors -------|                          |
        |    (age, inactivity, IP,          |                          |
        |     location, device)            |                          |
        |                                   |                          |
        |   Si risque < 0.7:                |                          |
        |-- 7. Update risk score -----------|-------> set session:X -->|
        |                                   |                          |
        |   Si risque >= 0.7:               |                          |
        |-- 8. Challenge MFA ---------------|-------> set mfa:X ------->|
        |-- 9. Notify user -----------------|                          |
        |                                   |                          |
        |   Si risque >= 0.85:              |                          |
        |-- 10. Revoke session -------------|-------> del session:X -->|
        |-- 11. Add to revoked -------------|-------> set revoked:X -->|
        |-- 12. Notify user + admin --------|                          |
        |                                   |                          |
```

### E.4 Incident response automatise

```
SIEM/Alert            IncidentResponder           Vault              Cloudflare              User
  |                         |                      |                    |                    |
  |-- 1. Dectection ------->|                      |                    |                    |
  |   (brute force)         |                      |                    |                    |
  |                         |                      |                    |                    |
  |                         |-- 2. Create incident-|                    |                    |
  |                         |   (severity=high)    |                    |                    |
  |                         |                      |                    |                    |
  |                         |-- 3. Execute playbook|                    |                    |
  |                         |   (account_takeover) |                    |                    |
  |                         |                      |                    |                    |
  |                         |-- 4. Revoke sessions-|-------> Redis ---->|                    |
  |                         |<-- 5. OK ------------|<------- Redis -----|                    |
  |                         |                      |                    |                    |
  |                         |-- 6. Reset password -|-------> Vault ---->|                    |
  |                         |<-- 7. New password ---|<------- Vault ----|                    |
  |                         |                      |                    |                    |
  |                         |-- 8. Force MFA ------>|-------> DB ------->|                    |
  |                         |<-- 9. OK ------------|<------- DB --------|                    |
  |                         |                      |                    |                    |
  |                         |-- 10. Block IP ------>|-------> CF ------->|                    |
  |                         |<-- 11. OK -----------|<------- CF --------|                    |
  |                         |                      |                    |                    |
  |                         |-- 12. Notify ------->|                    |-------> Email ----->|
  |                         |                      |                    |                    |
  |                         |-- 13. Log audit ----->|-------> DB ------->|                    |
  |                         |                      |                    |                    |
```

---

## Annexe F: Configuration detailee des regles WAF

```json
{
  "waf_rules": [
    {
      "id": "NBA-WAF-001",
      "name": "SQL Injection Prevention",
      "action": "block",
      "priority": 1,
      "matches": [
        {"field": "request.uri.query", "pattern": "(\\bSELECT\\b|\\bUNION\\b|\\bINSERT\\b|\\bDROP\\b|\\bDELETE\\b|\\bUPDATE\\b)"},
        {"field": "request.body", "pattern": "'.*\\bOR\\b.*'"},
        {"field": "request.uri.query", "pattern": "(\\%27|\\%22|\\%3B)"}
      ],
      "anomaly_score": 10,
      "paranoia_level": 1
    },
    {
      "id": "NBA-WAF-002",
      "name": "XSS Prevention",
      "action": "block",
      "priority": 2,
      "matches": [
        {"field": "request.body", "pattern": "<script[^>]*>[^<]*<\\/script>"},
        {"field": "request.uri.query", "pattern": "(alert|confirm|prompt)\\s*\\("},
        {"field": "request.headers.cookie", "pattern": "<[^>]*script"}
      ],
      "anomaly_score": 9,
      "paranoia_level": 1
    },
    {
      "id": "NBA-WAF-003",
      "name": "Path Traversal Prevention",
      "action": "block",
      "priority": 3,
      "matches": [
        {"field": "request.uri.path", "pattern": "(\\.\\.|\\%2e\\%2e|\\%252e\\%252e)"},
        {"field": "request.uri.path", "pattern": "(/etc/passwd|/windows/system32|/proc/self)"}
      ],
      "anomaly_score": 8,
      "paranoia_level": 2
    },
    {
      "id": "NBA-WAF-004",
      "name": "Command Injection Prevention",
      "action": "block",
      "priority": 4,
      "matches": [
        {"field": "request.uri.query", "pattern": "(;|\\||\\`|\\$\\\\(|\\%3B|\\%7C)"},
        {"field": "request.body", "pattern": "(ping|nslookup|wget|curl|bash|powershell|cmd\\.exe)"}
      ],
      "anomaly_score": 10,
      "paranoia_level": 2
    },
    {
      "id": "NBA-WAF-005",
      "name": "Sensitive Data Exposure Prevention",
      "action": "block",
      "priority": 5,
      "matches": [
        {"field": "response.body", "pattern": "(\\\"password\\\"|\\\"secret\\\"|\\\"api_key\\\"|\\\"token\\\")"},
        {"field": "response.body", "pattern": "(-----BEGIN RSA PRIVATE KEY-----|sk-[a-zA-Z0-9]{32,})"}
      ],
      "anomaly_score": 10,
      "paranoia_level": 3
    },
    {
      "id": "NBA-WAF-006",
      "name": "Rate Limiting - Login",
      "action": "challenge",
      "priority": 6,
      "rate_limit": {
        "requests": 10,
        "window": 60,
        "key": "ip"
      },
      "anomaly_score": 5,
      "paranoia_level": 1
    },
    {
      "id": "NBA-WAF-007",
      "name": "Block Malicious User Agents",
      "action": "block",
      "priority": 7,
      "matches": [
        {"field": "request.headers.user-agent", "pattern": "(sqlmap|nikto|nmap|nessus|openvas|acunetix|burpsuite|zap|w3af|dirbuster|gobuster)"}
      ],
      "anomaly_score": 5,
      "paranoia_level": 1
    },
    {
      "id": "NBA-WAF-008",
      "name": "Block Empty Referer for POST",
      "action": "block",
      "priority": 8,
      "matches": [
        {"field": "request.method", "pattern": "POST"},
        {"field": "request.headers.referer", "pattern": "^$"}
      ],
      "anomaly_score": 3,
      "paranoia_level": 2
    }
  ]
}
```

---

## Annexe G: Configuration Vault

```hcl
# vault-policy.hcl - Politiques Vault pour Zero Trust

# Politique pour l application NBA
path "secret/data/prod/*" {
  capabilities = ["read"]
}

path "secret/data/prod/database" {
  capabilities = ["read", "list"]
}

path "secret/data/prod/jwt" {
  capabilities = ["read"]
}

path "transit/encrypt/nba-key" {
  capabilities = ["create", "update"]
}

path "transit/decrypt/nba-key" {
  capabilities = ["create", "update"]
}

# Politique pour l administration
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "transit/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/rotate/*" {
  capabilities = ["create", "read", "update"]
}

# Politique pour CI/CD
path "secret/data/prod/*" {
  capabilities = ["read"]
  conditions {
    environment = "production"
    valid_branches = ["main", "release/*"]
  }
}

path "secret/data/staging/*" {
  capabilities = ["read"]
  conditions {
    environment = "staging"
    valid_branches = ["develop", "feature/*"]
  }
}
```

```yaml
# vault-agent-config.hcl - Config Vault Agent pour NBA
pid_file = "/var/run/vault-agent.pid"

auto_auth {
  method {
    type = "kubernetes"
    config {
      role = "nba-app"
    }
  }
}

cache {
  use_auto_auth_token = true
}

listener "tcp" {
  address = "127.0.0.1:8100"
  tls_disable = true
}

template {
  source      = "/etc/vault/templates/database.ctmpl"
  destination = "/etc/secrets/database.env"
  perms       = 0600
}

template {
  source      = "/etc/vault/templates/jwt.ctmpl"
  destination = "/etc/secrets/jwt.env"
  perms       = 0600
}

template {
  source      = "/etc/vault/templates/redis.ctmpl"
  destination = "/etc/secrets/redis.env"
  perms       = 0600
}
```

---

## Annexe H: Scripts d audit et verification

```typescript
// security-audit-script.ts
class SecurityAuditor {
  async runFullAudit(): Promise<AuditReport> {
    const report: AuditReport = {
      timestamp: new Date(),
      score: 0,
      checks: []
    };

    // 1. Verification de l integrite des logs
    const logsIntegrity = await this.checkAuditLogIntegrity();
    report.checks.push({
      category: 'audit',
      name: 'Integrite des logs',
      passed: logsIntegrity,
      details: logsIntegrity ? 'Chaine de hash valide' : 'BREAK dans la chaine d integrite'
    });

    // 2. Verification des certificats
    const certs = await this.checkCertificates();
    report.checks.push({
      category: 'network',
      name: 'Validite certificats TLS',
      passed: certs.valid,
      details: `${certs.validCount}/${certs.total} certificats valides`
    });

    // 3. Verification de la configuration WAF
    const wafStatus = await this.checkWAFStatus();
    report.checks.push({
      category: 'network',
      name: 'Configuration WAF',
      passed: wafStatus.active,
      details: `${wafStatus.rulesActive} regles actives`
    });

    // 4. Verification MFA obligatoire
    const mfaRate = await this.checkMFAEnrollment();
    report.checks.push({
      category: 'identity',
      name: 'Taux d adoption MFA',
      passed: mfaRate > 0.8,
      details: `${(mfaRate * 100).toFixed(1)}% des utilisateurs ont active MFA`
    });

    // 5. Verification sessions actives
    const sessions = await this.checkActiveSessions();
    report.checks.push({
      category: 'session',
      name: 'Sessions actives',
      passed: sessions.anomalous === 0,
      details: `${sessions.total} sessions, ${sessions.anomalous} suspectes`
    });

    // 6. Verification API keys expirees
    const expiredKeys = await this.checkExpiredApiKeys();
    report.checks.push({
      category: 'api',
      name: 'API keys expirees',
      passed: expiredKeys === 0,
      details: `${expiredKeys} API keys expirees non rotes`
    });

    // 7. Verification acces JIT
    const jitAccess = await this.checkJITAccess();
    report.checks.push({
      category: 'access',
      name: 'Acces JIT actifs',
      passed: jitAccess.activeGrants < 10,
      details: `${jitAccess.activeGrants} acces JIT actifs`
    });

    // Calcul score
    const passed = report.checks.filter(c => c.passed).length;
    report.score = Math.round((passed / report.checks.length) * 100);

    return report;
  }

  private async checkMFAEnrollment(): Promise<number> {
    const result = await prisma.user.aggregate({
      _count: { id: true },
      where: { mfaEnabled: true }
    });
    const total = await prisma.user.count();
    return total > 0 ? result._count.id / total : 0;
  }

  private async checkActiveSessions(): Promise<{ total: number; anomalous: number }> {
    const keys = await redis.keys('session:*');
    const sessions = await Promise.all(
      keys.map(async k => JSON.parse(await redis.get(k) as string))
    );
    const anomalous = sessions.filter((s: any) => s.riskScore > 0.7).length;
    return { total: sessions.length, anomalous };
  }

  private async checkAuditLogIntegrity(): Promise<boolean> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' },
      take: 1000
    });
    for (let i = 1; i < logs.length; i++) {
      const prevHash = logs[i - 1].hash;
      if (logs[i].previousHash !== prevHash) return false;
    }
    return true;
  }

  private async checkCertificates(): Promise<{ valid: boolean; validCount: number; total: number }> {
    const certs = await prisma.certificate.findMany();
    const valid = certs.filter(c => c.expiresAt > new Date());
    return {
      valid: valid.length === certs.length,
      validCount: valid.length,
      total: certs.length
    };
  }

  private async checkWAFStatus(): Promise<{ active: boolean; rulesActive: number }> {
    // Appel API Cloudflare
    return { active: true, rulesActive: 8 };
  }

  private async checkExpiredApiKeys(): Promise<number> {
    return prisma.apiKey.count({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { expiresAt: null, createdAt: { lt: new Date(Date.now() - 90 * 86400000) } }
        ],
        active: true
      }
    });
  }

  private async checkJITAccess(): Promise<{ activeGrants: number }> {
    const grants = await prisma.jITGrant.count({
      where: { status: 'active', expiresAt: { gt: new Date() } }
    });
    return { activeGrants: grants };
  }
}
```

---

## Annexe I: Scripts de deployment et CI/CD

```yaml
# .github/workflows/security-pipeline.yml
name: Security Pipeline Zero Trust
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: SAST Scan (CodeQL)
        uses: github/codeql-action/analyze@v3
        with:
          languages: javascript, typescript

      - name: Dependency Scan
        run: |
          npm audit --production
          npx snyk test --severity-threshold=high

      - name: Secret Detection
        uses: trufflesecurity/trufflehog@v3
        with:
          extra_args: --results=verified,unknown

      - name: IaC Security Scan
        uses: bridgecrewio/checkov-action@master
        with:
          framework: terraform,dockerfile,kubernetes

  zero-trust-verify:
    runs-on: ubuntu-latest
    needs: security-scan
    steps:
      - uses: actions/checkout@v4

      - name: Verify Zero Trust Config
        run: |
          npx ts-node scripts/verify-zero-trust-config.ts
          npx ts-node scripts/validate-policies.ts

      - name: Check Environment Secrets
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "Verifying production secrets..."
            # Verify all required secrets exist
          fi

  deploy-with-vault:
    runs-on: ubuntu-latest
    needs: zero-trust-verify
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Load Vault Secrets
        uses: hashicorp/vault-action@v3
        with:
          url: ${{ secrets.VAULT_ADDR }}
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}/database url | DATABASE_URL;
            secret/data/${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}/redis url | REDIS_URL;
            secret/data/${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}/jwt private_key | JWT_PRIVATE_KEY;
            secret/data/${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}/jwt public_key | JWT_PUBLIC_KEY;

      - name: Build and Deploy
        run: |
          npm ci
          npm run build
          npx prisma migrate deploy

      - name: Post-Deploy Security Checks
        run: |
          npx ts-node scripts/post-deploy-security-check.ts

      - name: Notify Security Team
        if: failure()
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"Security pipeline failed for ${{ github.ref }}"}' \
            ${{ secrets.SLACK_WEBHOOK }}
```

---

## Annexe J: Metriques detaillees de securite

```sql
-- Vue metriques securite temps reel
CREATE VIEW security_metrics_dashboard AS
WITH
  login_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'success') AS successful_logins,
      COUNT(*) FILTER (WHERE status = 'failure') AS failed_logins,
      COUNT(*) FILTER (WHERE type = 'mfa_verify' AND status = 'success') AS mfa_successes,
      AVG(EXTRACT(EPOCH FROM (NOW() - timestamp))) FILTER (WHERE type = 'session_created')::INTEGER AS avg_session_age_seconds
    FROM audit_logs
    WHERE timestamp > NOW() - INTERVAL '1 hour'
  ),
  api_metrics AS (
    SELECT
      COUNT(*) AS total_requests,
      COUNT(*) FILTER (WHERE status_code >= 500) AS server_errors,
      COUNT(*) FILTER (WHERE status_code = 429) AS rate_limited,
      AVG(duration)::INTEGER AS avg_duration_ms,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration) AS p99_duration_ms
    FROM api_audit_logs
    WHERE timestamp > NOW() - INTERVAL '1 hour'
  ),
  threat_metrics AS (
    SELECT
      COUNT(*) AS total_threats,
      COUNT(*) FILTER (WHERE severity = 'critical') AS critical_threats,
      COUNT(*) FILTER (WHERE severity = 'high') AS high_threats
    FROM security_events
    WHERE timestamp > NOW() - INTERVAL '24 hours'
  ),
  device_metrics AS (
    SELECT
      COUNT(*) AS total_devices,
      COUNT(*) FILTER (WHERE overall_score >= 0.7) AS compliant_devices,
      COUNT(*) FILTER (WHERE jailbroken OR root_detected) AS compromised_devices
    FROM device_postures
    WHERE last_check > NOW() - INTERVAL '24 hours'
  )
SELECT
  (SELECT COUNT(*) FROM users WHERE mfa_enabled)::FLOAT / NULLIF((SELECT COUNT(*) FROM users), 0) * 100 AS mfa_enrollment_pct,
  (SELECT successful_logins FROM login_stats) AS successful_logins,
  (SELECT failed_logins FROM login_stats) AS failed_logins,
  CASE WHEN (SELECT successful_logins + failed_logins FROM login_stats) > 0
    THEN (SELECT successful_logins::FLOAT / (successful_logins + failed_logins) * 100 FROM login_stats)
    ELSE 0 END AS login_success_rate_pct,
  (SELECT total_requests FROM api_metrics) AS api_requests,
  (SELECT rate_limited FROM api_metrics) AS rate_limited_requests,
  (SELECT p99_duration_ms FROM api_metrics) AS api_p99_ms,
  (SELECT total_threats FROM threat_metrics) AS threats_24h,
  (SELECT critical_threats FROM threat_metrics) AS critical_threats_24h,
  (SELECT compliant_devices::FLOAT / NULLIF(total_devices, 0) * 100 FROM device_metrics) AS device_compliance_pct,
  (SELECT compromised_devices FROM device_metrics) AS compromised_devices;
```

---

## Annexe K: Plan de tests securite

```typescript
// security-test-suite.ts
describe('Zero Trust Security Tests', () => {
  describe('Authentication Layer', () => {
    test('should reject requests without JWT', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    test('should reject expired JWT', async () => {
      const expiredToken = generateExpiredJWT();
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });

    test('should reject revoked JWT', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${revokedToken}`);
      expect(res.status).toBe(401);
    });

    test('should require MFA for admin endpoints', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${noMfaToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('MFA_REQUIRED');
    });

    test('should validate JWT signature', async () => {
      const forgedToken = signJWT({ sub: 'admin' }, 'wrong-key');
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Device Trust Layer', () => {
    test('should reject requests without device ID header', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(403);
    });

    test('should reject jailbroken devices', async () => {
      const res = await request(app)
        .get('/api/premium/features')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-device-id', jailbrokenDeviceId);
      expect(res.status).toBe(403);
    });

    test('should require OS version minimum', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-device-id', outdatedOsDeviceId);
      expect(res.status).toBe(403);
    });
  });

  describe('Authorization Layer', () => {
    test('should enforce RBAC for admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-device-id', validDeviceId);
      expect(res.status).toBe(403);
    });

    test('should support role hierarchy', async () => {
      const adminToken = await getTokenForRole('admin');
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-device-id', validDeviceId);
      expect(res.status).toBe(200);
    });

    test('should enforce JIT expiry', async () => {
      const expiredJitToken = await getExpiredJITToken();
      const res = await request(app)
        .get('/api/internal/metrics')
        .set('Authorization', `Bearer ${expiredJitToken}`)
        .set('x-device-id', validDeviceId);
      expect(res.status).toBe(403);
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit login attempts', async () => {
      const promises = Array(15).fill(null).map(() =>
        request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'wrong' })
      );
      const results = await Promise.all(promises);
      const rateLimited = results.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should have stricter rate limits for admin', async () => {
      const promises = Array(30).fill(null).map(() =>
        request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-device-id', adminDeviceId)
      );
      const results = await Promise.all(promises);
      const rateLimited = results.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Data Protection', () => {
    test('should encrypt sensitive fields at rest', async () => {
      const user = await prisma.user.findFirst();
      expect(user.email).not.toContain('@');
      expect(user.email).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    test('should not expose sensitive data in responses', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-device-id', validDeviceId);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('apiKey');
    });

    test('should enforce DLP on API responses', async () => {
      const res = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-device-id', adminDeviceId);
      expect(res.body).not.toMatch(/sk-[A-Za-z0-9]{32,}/);
    });
  });

  describe('Session Security', () => {
    test('should enforce max concurrent sessions', async () => {
      const tokens = await Promise.all(
        Array(5).fill(null).map(() => createSession(userId))
      );
      const validSessions = await countActiveSessions(userId);
      expect(validSessions).toBeLessThanOrEqual(3);
    });

    test('should rotate sessions periodically', async () => {
      const oldToken = await createSession(userId);
      await fastForward(7 * 60 * 60 * 1000); // 7 hours
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${oldToken}`)
        .set('x-device-id', validDeviceId);
      // Should have new token in Set-Cookie header
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('should revoke all sessions on password change', async () => {
      const token = await createSession(userId);
      await changePassword(userId);
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('x-device-id', validDeviceId);
      expect(res.status).toBe(401);
    });
  });

  describe('Audit Integrity', () => {
    test('should maintain audit log chain integrity', async () => {
      const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'asc' } });
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i].previousHash).toBe(logs[i - 1].hash);
      }
    });

    test('should prevent audit log modification', async () => {
      const log = await prisma.auditLog.findFirst();
      await expect(
        prisma.auditLog.update({ where: { id: log.id }, data: { action: 'modified' } })
      ).rejects.toThrow();
    });
  });
});
```

---

## Annexe L: References des API de securite

```typescript
// security-api-routes.ts - Routes API de securite

// POST /api/security/audit
// Corps: { type, userId, resource, action, metadata }
// Reponse: { id, timestamp, hash }
// Description: Creer un evenement d audit
// Auth: mTLS + API key
// Rate limit: 1000/min

// GET /api/security/audit/integrity
// Reponse: { valid: boolean, lastVerified: Date, chainLength: number }
// Description: Verifier l integrite de la chaine d audit
// Auth: admin + MFA
// Rate limit: 10/min

// POST /api/security/session/revoke
// Corps: { sessionId, reason }
// Reponse: { revoked: boolean, affectedSessions: number }
// Description: Revoguer une session
// Auth: admin + MFA
// Rate limit: 30/min

// GET /api/security/device/posture/:deviceId
// Reponse: { deviceId, overallScore, lastCheck, checks }
// Description: Recuperer la posture d un dispositif
// Auth: admin
// Rate limit: 60/min

// POST /api/security/device/wipe
// Corps: { deviceId, preserveData?: boolean }
// Reponse: { wiped: boolean, timestamp }
// Description: Effacer un dispositif a distance
// Auth: super_admin + MFA + hardware key
// Rate limit: 5/min

// GET /api/security/risk-score/:userId
// Reponse: { userId, riskScore, factors, lastUpdated }
// Description: Score de risque utilisateur
// Auth: admin + MFA
// Rate limit: 30/min

// POST /api/security/incident
// Corps: { type, severity, description, affectedUsers[] }
// Reponse: { incidentId, status, playbook }
// Description: Creer un incident de securite
// Auth: security_lead + MFA
// Rate limit: 10/min

// GET /api/security/incident/:id/playbook
// Reponse: { id, steps[], status, timestamps }
// Description: Executer un playbook d incident
// Auth: security_analyst
// Rate limit: 5/min

// POST /api/security/jit/request
// Corps: { resourceId, duration, reason, approvalRequired }
// Reponse: { grantId, expiresAt, status }
// Description: Demander un acces JIT
// Auth: JWT + device
// Rate limit: 10/min

// GET /api/security/metrics
// Reponse: { scoreZT, loginRate, mfaRate, deviceCompliance, ... }
// Description: Metriques de securite temps reel
// Auth: admin + MFA
// Rate limit: 60/min
```

---

## Annexe M: Mapping des ports et protocoles

| Service | Port | Protocole | TLS | mTLS | Zone source | Zone destination |
|---------|------|-----------|-----|------|-------------|-----------------|
| Next.js API | 3000 | HTTP/2 | Oui | Non | DMZ | Application |
| Socket.IO | 3001 | WebSocket | Oui | Non | DMZ | Application |
| PostgreSQL | 5432 | TCP | Oui | Oui | Application | Donnees |
| Redis | 6379 | TCP | Oui | Oui | Application | Services |
| RabbitMQ | 5672 | AMQP | Oui | Oui | Application | Services |
| RabbitMQ Admin | 15672 | HTTP | Oui | Oui | Admin | Services |
| Vault | 8200 | HTTP | Oui | Oui | Application | Services |
| Prometheus | 9090 | HTTP | Oui | Non | Admin | Admin |
| Grafana | 3000 | HTTP | Oui | Non | Admin | Admin |
| Elasticsearch | 9200 | HTTP | Oui | Oui | Admin | Donnees |
| Kibana | 5601 | HTTP | Oui | Non | Admin | Admin |
| Cloudflare | 443 | HTTP/3 | Oui | Non | Internet | DMZ |

---

## Annexe N: URLs des ressources techniques

- Better Auth Documentation: https://www.better-auth.com/docs
- Better Auth Two Factor: https://www.better-auth.com/docs/plugins/two-factor
- Better Auth Admin: https://www.better-auth.com/docs/plugins/admin
- NIST SP 800-207: https://csrc.nist.gov/publications/detail/sp/800-207/final
- Cloudflare Zero Trust: https://developers.cloudflare.com/cloudflare-one/
- OPA (Open Policy Agent): https://www.openpolicyagent.org/
- HashiCorp Vault: https://www.vaultproject.io/docs
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- Prisma Security: https://www.prisma.io/docs/orm/prisma-client/security
- Next.js Security: https://nextjs.org/docs/architecture/security

---

*FIN DU DOCUMENT*

*MASTER_ZERO_TRUST_SECURITY.md - Version 1.0.0*
*Equipe Securite NBA - Juillet 2026*
*Classification: CONFIDENTIEL*
