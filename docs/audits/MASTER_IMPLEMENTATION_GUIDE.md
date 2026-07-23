# Guide d'Implementation Securise — MASTER_IMPLEMENTATION_GUIDE.md

> **Guide d'Execution** — Version 1.0.0  
> **Classification** : Interne — Confidentiel  
> **Derniere mise a jour** : 2026-07-22  
> **Documents requis** : `MASTER_SECURITY_REQUIREMENTS.md`, `MASTER_SECURITY_ARCHITECTURE.md`, `MASTER_AUTH_ARCHITECTURE.md`, `MASTER_FRAUD_ENGINE.md`, `MASTER_ZERO_TRUST_SECURITY.md`

---

## Table des Matieres

1. [Structure du Projet](#1-structure-du-projet)
2. [Phases de Developpement](#2-phases-de-developpement)
3. [Phase 1: Fondation Securite (J0-J14)](#3-phase-1-fondation-securite-j0-j14)
4. [Phase 2: Sessions & Appareils (J15-J30)](#4-phase-2-sessions--appareils-j15-j30)
5. [Phase 3: 2FA/MFA & Rate Limiting (J31-J45)](#5-phase-3-2famfa--rate-limiting-j31-j45)
6. [Phase 4: Anti-Fraude & Risk Scoring (J46-J70)](#6-phase-4-anti-fraude--risk-scoring-j46-j70)
7. [Phase 5: Monitoring & Observabilite (J71-J85)](#7-phase-5-monitoring--observabilite-j71-j85)
8. [Phase 6: Tests & Securite (J86-J100)](#8-phase-6-tests--securite-j86-j100)
9. [Phase 7: Conformite & Documentation (J101-J120)](#9-phase-7-conformite--documentation-j101-j120)
10. [Arbre de Dependances](#10-arbre-de-dependances)
11. [Checklist de Securite par Composant](#11-checklist-de-securite-par-composant)
12. [Procedures de Deploiement Securise](#12-procedures-de-deploiement-securise)

---

## 1. Structure du Projet

### 1.1 Arborescence des Composants de Securite

```
src/
  lib/
    auth.ts                       # Configuration Better Auth (centrale)
    auth-utils.ts                 # Utilitaires d'auth (requireAuth, requireRole)
    auth-client.ts                # Client auth cote navigateur
    rate-limit.ts                 # Rate limiting multi-couche (Redis + fallback local)
    csrf.ts                       # Protection CSRF
    db.ts                         # Instance Prisma
    redis.ts                      # Instance Redis (ioredis)
    logger.ts                     # Logger Pino
    cache.ts                      # Cache utilities
    circuit-breaker.ts            # Circuit breaker pour appels externes
    queue.ts                      # BullMQ queue client
    email.ts                      # Envoi emails (Resend)
    session-limits.ts             # Limites de sessions par plan
    session-rotation.ts           # Rotation de session
    session-revocation.ts         # Revocation de session
    session-concurrent.ts         # Controle de sessions concurrentes
    session-anomaly.ts            # Detection d'anomalies de session
    cookie-verify.ts              # Verification de signature cookie
    password-policy.ts            # Politique de mot de passe
    two-factor.ts                 # Gestion 2FA
    backup-codes.ts               # Gestion des codes de backup
    device-fingerprint.ts         # Fingerprinting appareil
    account-linking.ts            # Linking comptes OAuth
    oauth-tokens.ts               # Gestion tokens OAuth
    security-events.ts            # Types d'evenements de securite
    audit-chain.ts                # Chaine d'audit infalsifiable
    request-validator.ts          # Validation des requetes
    ua-parser.ts                  # Parse User-Agent

    security/
      risk-engine.ts              # Moteur de risque sync
      ip-reputation.ts            # Reputation IP (MaxMind)
      impossible-travel.ts        # Detection impossible travel
      device-fingerprint.ts       # Fingerprinting client-side
      security-event-bus.ts       # Bus d'evenements de securite
      security-notification-service.ts  # Notifications de securite
      session-manager.ts          # Gestionnaire de sessions

    audit/
      types.ts                    # Types d'audit
      actions.ts                  # Actions auditees
      integrity.ts                # Verification d'integrite chaine
      labels.ts                   # Labels d'audit
      renderers.ts                # Rendu des logs

    services/
      moderation.ts               # Moderation (email bannis)
      notifications.ts            # Notifications (email, push, Telegram)
      recovery.ts                 # Compte recovery
      user-deletion.ts            # Suppression de compte (soft delete)
      device.ts                   # Gestion des appareils (CRUD)
      push.ts                     # Web Push notifications
      access.ts                   # Gestion des acces

  middleware.ts                   # Middleware Next.js (securite + routage)

workers/
  websocket.ts                    # WebSocket worker (Socket.IO)
  ws-auth.ts                      # Auth WebSocket (HMAC cookie)
  ws-prisma.ts                    # Prisma pour WebSocket worker
  queue.ts                        # BullMQ worker (jobs asynchrones)
  bull-board.ts                   # Dashboard BullMQ

prisma/
  schema.prisma                   # Schema Prisma (tous les modeles)
  migrations/                     # Migrations Prisma
```

---

## 2. Phases de Developpement

### 2.1 Vue d'Ensemble

```
Phase 1: Fondation      [J0-J14]   Configuration de base, auth, headers, CSP
Phase 2: Sessions       [J15-J30]  Session management, device trust, hijacking
Phase 3: 2FA & Rate     [J31-J45]  MFA, rate limiting avance, password policy
Phase 4: Anti-Fraude    [J46-J70]  Risk scoring, ML, abuse detection
Phase 5: Monitoring     [J71-J85]  Observability, alerting, dashboards
Phase 6: Tests          [J86-J100] Tests de securite, pentest, fuzzing
Phase 7: Conformite     [J101-J120] Documentation, audit, conformite
```

### 2.2 Dependances Entre Phases

```
Phase 1 (Fondation)
    |
    +-----> Phase 2 (Sessions) ------> Phase 4 (Anti-Fraude)
    |                                      |
    +-----> Phase 3 (2FA) --------------->+
    |
    +-----> Phase 5 (Monitoring) <---------+
    |
    +-----> Phase 6 (Tests) <--------------+
    |
    +-----> Phase 7 (Conformite) <---------+
```

---

## 3. Phase 1: Fondation Securite (J0-J14)

### 3.1 Better Auth — Configuration Initiale

**Objectif** : Mettre en place Better Auth avec securite maximale.

**Fichiers** :
- `src/lib/auth.ts` — Configuration centrale
- `src/lib/auth-utils.ts` — Utilitaires (requireAuth, requireRole)
- `src/lib/auth-client.ts` — Client cote navigateur

**Ordre d'implementation** :

```
J0-J1: auth.ts (config de base)
  - database: prismaAdapter
  - trustedOrigins
  - emailAndPassword (min 10 chars)
  - password policy (bcrypt rounds=12)
  - session (expiresIn: 7j, updateAge: 24h)
  - advanced (cookiePrefix: __Secure-)
  - plugins: nextCookies()

J2-J3: databaseHooks
  - user.create.before: email banni, purge soft delete
  - user.create.after: welcome email
  - session.create.before: limite sessions concurrentes
  - session.create.after: cache Redis

J4: auth-utils.ts
  - requireAuth() -> redirection si non auth
  - requireRole(roles) -> 403 si pas le bon role
  - getCurrentSession() -> session actuelle
```

**Migration Prisma** :
```bash
pnpm db:migrate --name add_user_fields
pnpm db:migrate --name add_session_security
```

**Redis** :
- `session:{id}` — TTL 7 jours
- `blacklist:session:{id}` — TTL 7 jours

**Tests** :
- `src/lib/auth.test.ts` — Configuration, plugins
- `src/middleware.test.ts` — Routes protegees

**Monitoring** :
- Logger: creation de session, echecs

---

### 3.2 Middleware Securise

**Objectif** : Securiser toutes les reponses avec headers et routage.

**Fichiers** :
- `src/middleware.ts` — Middleware principal
- `src/lib/csrf.ts` — Protection CSRF

**Ordre d'implementation** :

```
J5-J6: middleware.ts
  - Routes publiques (PUBLIC_PREFIXES, PUBLIC_PATHS)
  - Routes protegees (PROTECTED_PREFIXES)
  - Mode maintenance
  - Redirection / -> /dashboard ou /login
  - Cache-Control: no-store pour pages protegees

J7-J8: Headers de securite
  - Content-Security-Policy
  - Strict-Transport-Security (HSTS)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy
  - Permissions-Policy

J9: CSRF protection
  - Verification Origin/Referer
  - Token CSRF pour requetes cross-origin
  - SAFE_METHODS: GET, HEAD, OPTIONS
```

**Tests** :
- Tests unitaires headers de securite
- Tests integration CSRF

---

### 3.3 Rate Limiting Fondation

**Objectif** : Rate limiting multi-couche pour toutes les API.

**Fichiers** :
- `src/lib/rate-limit.ts` — Rate limiting Redis + fallback local
- `src/redis.ts` — Instance Redis

**Ordre d'implementation** :

```
J10: Redis sliding window
  - checkRateLimit(key, config)
  - Pipeline Redis (zremrangebyscore, zadd, zcard)
  - Headers X-RateLimit-Limit, Remaining, Reset

J11: Fallback local LRU
  - Map<T> avec 1000 entrees max
  - Fallback si Redis indisponible

J12: Rate limits par endpoint
  - AUTH_SIGN_IN: 5 req/60s
  - AUTH_SIGN_UP: 3 req/3600s
  - ONBOARDING_SEND_OTP: 3 req/60s
  - API generique: 100 req/60s
  - rateLimitMiddleware() et rateLimitOrDeny()
```

**Redis** :
- `ratelimit:sw:{key}` — Sorted Set, TTL configurable

**Tests** :
- `src/lib/rate-limit.test.ts` — Seuils, fallback, headers
- Tests integration avec Redis

---

### 3.4 Logger & Audit

**Objectif** : Logger structure et chaine d'audit.

**Fichiers** :
- `src/lib/logger.ts` — Logger Pino
- `src/lib/audit/types.ts` — Types d'audit
- `src/lib/audit/actions.ts` — Actions auditees
- `src/lib/audit/integrity.ts` — Chaine infalsifiable

**Ordre d'implementation** :

```
J13: Logger Pino
  - Format structure (timestamp, level, module, requestId)
  - Redaction automatique des donnees sensibles
  - Rotation des logs (PM2)

J14: Audit chain
  - recordSecurityEvent() avec hash chain
  - verifyAuditChain() pour verification periodique
  - Evenements initiaux: LOGIN_SUCCESS, LOGIN_FAILED,
    SESSION_CREATED, SESSION_REVOKED
```

**Migration Prisma** :
```bash
pnpm db:migrate --name add_audit_log
```

**Tests** :
- Tests chaine d'audit (integrite, hash)
- Tests logger (redaction donnees sensibles)

---

## 4. Phase 2: Sessions & Appareils (J15-J30)

### 4.1 Session Management Avance

**Objectif** : Sessions securisees avec binding, rotation, revocation.

**Fichiers** :
- `src/lib/session-limits.ts` — Limites par plan
- `src/lib/session-rotation.ts` — Rotation de session
- `src/lib/session-revocation.ts` — Revocation de session
- `src/lib/session-concurrent.ts` — Sessions concurrentes
- `src/lib/session-anomaly.ts` — Detection d'anomalies

**Ordre d'implementation** :

```
J15-J16: Session limits
  - PLAN_LIMITS (FREE:1, STANDARD:3, PRO:5, VIP:5, ADMIN:5, SUPER_ADMIN:10)
  - Session TTL par plan
  - Idle timeout par plan
  - Device binding requirement par plan

J17-J18: Session rotation
  - Nouveau token + blacklist ancien
  - Redis blacklist TTL: 7 jours
  - Rotation automatique toutes les 24h
  - Verification blacklist avant chaque acces

J19-J20: Session revocation
  - Revocation individuelle (revokeSession)
  - Revocation masse (revokeAllSessions)
  - Raisons de revocation (USER_LOGOUT, ADMIN_REVOKE, etc.)
  - Audit log + Redis blacklist

J21: Sessions concurrentes
  - enforceSessionLimit() — evict plus ancienne
  - checkSessionLimit() — verifier avant creation
  - DatabaseHooks integration
```

**Redis** :
- `session:{id}` — TTL 7 jours
- `blacklist:session:{id}` — TTL 7 jours
- `session:token:{token}` — TTL 5 min

**Tests** :
- Tests unitaires chaque fonction
- Tests integration (creation, rotation, revocation)
- Tests limites par plan

---

### 4.2 Device Trust & Fingerprinting

**Objectif** : Identifier et evaluer la confiance des appareils.

**Fichiers** :
- `src/lib/device-fingerprint.ts` — Fingerprint + gestion appareils
- `src/lib/security/device-fingerprint.ts` — Client-side collector
- `src/app/api/auth/devices/route.ts` — API de gestion

**Ordre d'implementation** :

```
J22-J23: Device register
  - registerDevice() avec fingerprint unique
  - Device trust levels (UNKNOWN, PENDING, VERIFIED, TRUSTED, SUSPICIOUS, BLOCKED)
  - LastSeenAt tracking
  - Device metadata (OS, browser, type)

J24-J25: Client-side fingerprint
  - collectFingerprintComponents() — navigateur
  - Canvas fingerprint
  - WebGL fingerprint
  - Font fingerprint
  - Audio fingerprint
  - Compute hash SHA-256

J26: API devices
  - GET /api/auth/devices — Liste des appareils
  - DELETE /api/auth/devices — Revocation appareil
  - Rate limiting: 10 req/min
```

**Migration Prisma** :
```bash
pnpm db:migrate --name add_device_model
```

**Redis** :
- `fp:{hash}` — Fingerprint cache, TTL 1h

**Tests** :
- Tests fingerprinting (consistance, unicite)
- Tests API devices
- Tests trust levels

---

### 4.3 Session Hijacking Protection

**Objectif** : Detecter et prevenir le vol de session.

**Fichiers** :
- `src/lib/session-anomaly.ts` — Detection anomalies

**Ordre d'implementation** :

```
J27-J28: Anomaly detection
  - IP change detection
  - User-Agent change detection
  - Device change detection
  - Rapid IP change (< 1h)

J29-J30: Actions
  - MEDIUM: audit + notification
  - HIGH: challenge 2FA
  - CRITICAL: revocation session + alerte admin
  - recordSecurityEvent() systematique
```

**Tests** :
- Tests detection (IP change, UA change)
- Tests actions (MEDIUM, HIGH, CRITICAL)
- Tests notification utilisateur

---

## 5. Phase 3: 2FA/MFA & Rate Limiting (J31-J45)

### 5.1 Two-Factor Authentication

**Objectif** : 2FA avec TOTP + Email OTP + Backup codes.

**Fichiers** :
- `src/lib/auth.ts` — Plugin twoFactor
- `src/lib/two-factor.ts` — Gestion 2FA
- `src/lib/backup-codes.ts` — Codes de backup
- `src/app/api/auth/2fa/*` — API endpoints

**Ordre d'implementation** :

```
J31-J32: Plugin twoFactor
  - Configuration (issuer, TOTP options, backup codes)
  - Strategies: TOTP + Email OTP
  - Skip verification for trusted devices
  - Trusted device cookie (30 jours)

J33-J34: TOTP Setup
  - setupTOTP() — generer secret + QR code
  - verifyAndEnableTOTP() — verifier code + activer
  - verifyTwoFactorCode() — verifier pendant login

J35: Backup codes
  - generateBackupCodes() — 8 codes
  - useBackupCode() — usage unique
  - Regeneration par l'utilisateur
  - Hash SHA-256 en base

J36-J37: Email OTP
  - sendOTPEmail() — envoyer code
  - verifyOTP() — verifier code
  - Rate limiting: 5 tentatives/5min

J38: Trusted devices
  - Cookie truste (30 jours)
  - Skip 2FA pour appareils connus
  - Revocation si appareil devient suspect
```

**Migration Prisma** :
```bash
pnpm db:migrate --name add_2fa_fields
pnpm db:migrate --name add_backup_codes
```

**Tests** :
- Tests setup TOTP
- Tests backup codes (generation, usage, regeneration)
- Tests trusted devices
- Tests rate limiting 2FA

---

### 5.2 Rate Limiting Avance

**Objectif** : Rate limiting multi-couche complet.

**Fichiers** :
- `src/lib/rate-limit.ts` — Extension des rate limits

**Ordre d'implementation** :

```
J39-J40: Rate limits business
  - DEVICE_MUTATION: 10 req/60s
  - CHANGE_PASSWORD: 5 req/3600s
  - CHANGE_EMAIL: 3 req/3600s, block 1h
  - DELETE_ACCOUNT: 2 req/3600s, block 1h
  - ADMIN operations: 10 req/60s

J41: Rate limit headers
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
  - Retry-After (si bloque)
  - Messages d'erreur localises
```

---

### 5.3 Password Policy Renforcee

**Objectif** : Politique de mot de passe conforme NIST.

**Fichiers** :
- `src/lib/password-policy.ts` — Validation et verification

**Ordre d'implementation** :

```
J42-J43: Password validation
  - validatePassword() — 10 regles
  - Password strength score (0-100)
  - Erreurs detailles

J44-J45: Breach check
  - checkBreachedPassword() — HIBP API
  - Cache Redis (1h)
  - Fallback silencieux si API indisponible
  - Password history (5 derniers)
  - Password max age (90 jours)
```

**Migration Prisma** :
```bash
pnpm db:migrate --name add_password_history
```

**Tests** :
- Tests validation (tous les cas)
- Tests breach check (mock API)
- Tests history

---

## 6. Phase 4: Anti-Fraude & Risk Scoring (J46-J70)

### 6.1 Sync Risk Engine

**Objectif** : Moteur de risque temps reel (< 100ms).

**Fichiers** :
- `src/lib/security/risk-engine.ts` — SyncRiskEngine
- `src/lib/security/device-fingerprint.ts` — Device trust

**Ordre d'implementation** :

```
J46-J47: SyncRiskEngine base
  - Rate limit factor (0-30)
  - Session limit factor (0-20)
  - Device trust factor (0-30)
  - 2FA factor (0-20)
  - IP reputation cache (0-25)
  - Calcul score total + decision

J48: Seuils dynamiques
  - Ajustement par plan
  - Ajustement horaire (nocturne)
  - Ajustement volume traffic
```

**Redis** :
- `ratelimit:{ip}:{email}` — Sorted Set, 60s
- `iprep:{ip}` — Cache, 1h

**Tests** :
- Tests scoring (chaque facteur)
- Tests seuils (ALLOW, FLAG, CHALLENGE, BLOCK)
- Tests performance (< 100ms)

---

### 6.2 IP Reputation

**Objectif** : Evaluer la reputation des IPs.

**Fichiers** :
- `src/lib/security/ip-reputation.ts` — IPReputationService

**Ordre d'implementation** :

```
J49-J50: IP reputation
  - MaxMind GeoIP2 database
  - Detection VPN, TOR, Proxy, Datacenter
  - Cache Redis (1h)
  - Risk score par IP
  - Country risk scoring
```

**Redis** :
- `iprep:{ip}` — 1h

**Tests** :
- Tests evaluation IP (VPN, TOR, etc.)
- Tests cache
- Tests performance

---

### 6.3 Impossible Travel Detection

**Objectif** : Detecter les connexions impossibles (geo).

**Fichiers** :
- `src/lib/security/impossible-travel.ts` — Geo detection

**Ordre d'implementation** :

```
J51-J52: Geo detection
  - Haversine distance calculation
  - Impossible travel (8000km en 1h)
  - Session location tracking
  - Alertes sur anomalie
```

**Tests** :
- Tests haversine
- Tests detection impossible travel

---

### 6.4 Async Risk Engine

**Objectif** : Analyse de risque post-connexion.

**Fichiers** :
- `workers/queue.ts` — BullMQ worker
- `src/lib/security/risk-engine.ts` — AsyncRiskWorker

**Ordre d'implementation** :

```
J53-J55: BullMQ infrastructure
  - Queue: risk:async
  - Worker pool (4 concurrents)
  - Dead letter queue (3 retries max)
  - Backoff exponentiel

J56-J58: Async processors
  - IP reputation complete (MaxMind)
  - Geo distance / impossible travel
  - Login velocity (Redis)
  - Behavioral pattern matching
  - ML inference (ONNX) — si modele disponible

J59: Post-processing
  - Update session riskScore
  - Create SecurityEvent si HIGH/CRITICAL
  - Alertes (Slack, PagerDuty)
```

**Redis** :
- `velocity:{userId}` — 3600s
- `risk:async:{sessionId}` — 86400s

**Tests** :
- Tests queue BullMQ
- Tests chaque processor
- Tests performance (< 5s)

---

### 6.5 Abuse Detection

**Objectif** : Detecter les abus (credential stuffing, brute force, etc.).

**Fichiers** :
- `src/lib/security/security-event-bus.ts` — Detection orchestrator
- `src/lib/security/*.ts` — Detecteurs specialises

**Ordre d'implementation** :

```
J60-J62: Credential Stuffing Detector
  - 50+ tentatives/min -> BLOCK
  - 20+ -> CHALLENGE
  - 10+ -> FLAG

J63-J65: Brute Force Detector
  - 100 tentatives/5min -> BLOCK
  - 60+ -> BLOCK
  - 30+ -> CHALLENGE
  - Tracks IP + user

J66-J67: Account Enumeration
  - Detection par timing
  - Detection par email valide/invalide
  - Rate limiting specifique

J68-J70: API Abuse & Scraping
  - Rate limiting par endpoint
  - Pattern detection (requetes automatisees)
  - Block IP + alertes
```

**Redis** :
- `cs:ip:{ip}` — 120s
- `cs:email:{email}` — 120s
- `bf:ip:{ip}` — 300s
- `bf:user:{email}` — 300s
- `enum:{ip}` — 600s

**Tests** :
- Tests chaque detecteur
- Tests orchestrateur
- Tests performance

---

## 7. Phase 5: Monitoring & Observabilite (J71-J85)

### 7.1 Security Events Taxonomy

**Objectif** : Implementer la taxonomie complete des evenements.

**Fichiers** :
- `src/lib/security-events.ts` — Types et enum
- `src/lib/audit-chain.ts` — Recording

**Ordre d'implementation** :

```
J71-J72: Security event types
  - LOGIN_SUCCESS, LOGIN_FAILED
  - SESSION_CREATED, SESSION_REVOKED, SESSION_HIJACK_ATTEMPT
  - TWO_FACTOR_ENABLED, TWO_FACTOR_DISABLED
  - PASSWORD_CHANGED, EMAIL_CHANGED
  - ACCOUNT_SUSPENDED, ACCOUNT_DELETED
  - HIGH_RISK_SYNC, HIGH_RISK_ASYNC
  - CREDENTIAL_STUFFING, BRUTE_FORCE
  - API_ABUSE, SCRAPING_DETECTED

J73-J74: Event recording
  - recordSecurityEvent() — audit chain
  - Structured metadata
  - Severite (INFO, WARN, ERROR, CRITICAL)
```

---

### 7.2 Alerting

**Objectif** : Alertes temps reel sur les evenements critiques.

**Fichiers** :
- `src/lib/security/security-notification-service.ts`

**Ordre d'implementation** :

```
J75-J76: Alert channels
  - Email (admin notifications)
  - Slack webhook
  - PagerDuty (CRITICAL uniquement)
  - Notifications in-app

J77-J78: Alert rules
  - > 5% login failure rate
  - > 1 hijacking attempt/hour
  - > 10 blocked IPs/hour
  - Any CRITICAL severity event
  - Rate limit > 90% capacity
```

---

### 7.3 Dashboards

**Objectif** : Visibilite sur la securite.

**Sources** : Prometheus metrics, Loki logs, Sentry

**Ordre d'implementation** :

```
J79-J81: Metrics
  - Login success/failure rate
  - Active sessions
  - Rate limit hits
  - 2FA adoption rate
  - Risk score distribution
  - Abuse detection counts

J82-J83: Dashboards
  - Auth Health (login rate, 2FA adoption)
  - Security Events (by type, severity)
  - Session Management (active, revoked)
  - Abuse Detection (by type)

J84-J85: Sentry configuration
  - Breadcrumbs personnalises (auth)
  - Redaction donnees sensibles
  - Performance monitoring
```

---

## 8. Phase 6: Tests & Securite (J86-J100)

### 8.1 Tests Unitaires & Integration

**Objectif** : Couverture de tests maximale.

**Fichiers** :
- `src/lib/**/*.test.ts` — Tests unitaires
- `src/app/**/*.test.ts` — Tests integration

**Priorite** :

```
J86-J88: Tests securite critiques
  - Password validation (tous les cas)
  - Cookie verification (HMAC)
  - Rate limiting (seuils, fallback)
  - Session management (creation, rotation, revocation)
  - 2FA (setup, verification, backup codes)

J89-J91: Tests integration
  - Login flow (success + failure)
  - Register flow
  - Password reset
  - Device management
  - WebSocket auth

J92-J93: Tests E2E (Playwright)
  - Parcours complet authentifie
  - Tentatives de connexion echouees
  - Rate limiting visible
  - 2FA setup + utilisation
```

---

### 8.2 Tests de Securite

**Objectif** : Valider la resistance aux attaques.

**Ordre d'implementation** :

```
J94-J95: Tests automatises
  - Brute force simulation
  - Credential stuffing simulation
  - Session hijacking simulation
  - CSRF attempts
  - Injection attempts (SQL, XSS)

J96-J97: Fuzzing
  - API endpoints (corps, params, headers)
  - WebSocket messages
  - File uploads

J98-J100: Penetration test
  - OWASP ZAP / Burp Suite scan
  - Manual pentest (equipe securite)
  - Remediation des findings
```

---

## 9. Phase 7: Conformite & Documentation (J101-J120)

### 9.1 Securite des Donnees

**Objectif** : Assurer la conformite RGPD/SOC 2.

**Ordre d'implementation** :

```
J101-J103: Chiffrement tokens OAuth
  - TOKEN_ENCRYPTION_KEY (AES-256-GCM)
  - Chiffrement accessToken/refreshToken en base
  - Dechiffrement a la volee

J104-J106: Retention & purge
  - Sessions expirees -> purge 90 jours
  - Login attempts -> 90 jours
  - Security events -> 1 an
  - Audit logs -> 5 ans
  - Cron de purge automatise
```

---

### 9.2 Documentation & Runbooks

**Ordre d'implementation** :

```
J107-J110: Runbooks de securite
  - Compte compromis
  - Fuite de donnees
  - DDoS
  - Fraude detectee
  - Incident Redis / PostgreSQL

J111-J113: Documentation
  - Architecture de securite (ce document)
  - Exigences de securite
  - Procedures de developpement
  - Guide de deploiement

J114-J115: Formation equipe
  - Secure coding training
  - OWASP Top 10 awareness
  - Procedures incident response
```

---

### 9.3 Conformite Continue

**Ordre d'implementation** :

```
J116-J117: Audit preparation
  - SOC 2 readiness assessment
  - RGPD compliance checklist
  - DPA avec sous-traitants
  - Registre des traitements

J118-J120: Automatisation
  - Dependabot / Renovate
  - npm audit CI
  - Trivy scan Docker
  - SAST (SonarQube / Semgrep)
  - Verification periodique chaine d'audit
```

---

## 10. Arbre de Dependances

### 10.1 Dependances Entre Fichiers

```
auth.ts
  +-- plugins: twoFactor(), admin(), nextCookies()
  +-- databaseHooks: session.create.before, session.create.after
  |       |
  |       +-- sessionLimits.ts
  |       +-- sessionConcurrent.ts
  |
  +-- emailAndPassword hooks
          |
          +-- passwordPolicy.ts
          +-- email.ts

session-rotation.ts
  +-- redis.ts
  +-- audit-chain.ts

session-revocation.ts
  +-- redis.ts
  +-- audit-chain.ts

device-fingerprint.ts
  +-- db.ts
  +-- redis.ts

rate-limit.ts
  +-- redis.ts (sliding window)
  +-- fallback local (LRU Map)

csrf.ts
  +-- (standalone, no dependencies)

security/risk-engine.ts
  +-- redis.ts
  +-- db.ts
  +-- security/ip-reputation.ts
  +-- security/device-fingerprint.ts

security/security-event-bus.ts
  +-- db.ts
  +-- audit-chain.ts
  +-- security-notification-service.ts
```

### 10.2 Dependances Prisma

```
User
  +-- Session (has many)
  +-- Account (has many)
  +-- Device (has many)
  +-- DeviceVerification (has many)
  +-- TwoFactorBackupCode (has many)
  +-- LoginAttempt (has many)
  +-- PasswordHistory (has many)
  +-- AuditLog (has many)
  +-- Role (belongs to)

Session
  +-- User (belongs to)

Device
  +-- User (belongs to)

AuditLog
  +-- User (belongs to, optional)
```

---

## 11. Checklist de Securite par Composant

### 11.1 Check pre-commit

```
[_] Lint: ESLint passe
[_] Typecheck: tsc --noEmit passe
[_] Tests: vitest run passe
[_] npm audit: pas de CRITICAL non resolues
[_] Pas de secrets hardcodes
[_] Pas de console.log
[_] Types explicites (pas de any)
[_] Zod validation pour les nouvelles API
[_] Rate limiting configure pour les nouvelles routes
```

### 11.2 Check pre-deploiement

```
[_] Migrations Prisma revues et testees en staging
[_] Feature flags actives (DISABLE_NEW_AUTH, etc.)
[_] Variables d'environnement configurees
[_] Secrets rotates si > 90 jours
[_] Certificats TLS valides
[_] Backups OK
[_] Tests de securite passes
[_] Headers de securite verifies (securityheaders.com)
[_] CSP valide (pas de blocages)
[_] Monitoring configure (Sentry, alertes)
```

### 11.3 Check post-deploiement

```
[_] Health check OK
[_] Auth flow fonctionnel (login, register, 2FA)
[_] WebSocket connecte
[_] Rate limiting fonctionnel
[_] Sessions crees + cache Redis
[_] Logs d'audit generes
[_] Metriques remontees
[_] Alertes non declenchees (ou validees)
```

---

## 12. Procedures de Deploiement Securise

### 12.1 Deploiement Standard

```bash
# 1. Preparer la release
git checkout main && git pull
# Verifier les migrations
pnpm db:generate
# Build
pnpm build
# Verifier le build
pnpm lint && pnpm typecheck && pnpm test

# 2. Deploiement Docker
docker compose build --no-cache app
docker compose push app

# 3. Migration DB (si applicable)
pnpm db:migrate --name nom_migration --create-only
# Verifier manuellement le SQL genere
# Executer en staging d'abord

# 4. Deploiement production
docker compose pull app
docker compose up -d --force-recreate app

# 5. Verification post-deploiement
curl -f https://access.signauxx.com/api/public/health
# Verifier les logs: docker compose logs app --tail=50
# Verifier Sentry: pas de nouvelles erreurs
```

### 12.2 Rollback

```bash
# Si probleme detecte:
# 1. Feature flag (si disponible)
docker compose exec app env DISABLE_NEW_AUTH=true

# 2. Rollback Docker
docker compose pull app:previous-tag
docker compose up -d --force-recreate app

# 3. Rollback DB migration (si necessaire)
pnpm db:migrate --name revert_nom_migration
```

### 12.3 Deploiement d'Urgence (Security Patch)

```bash
# 1. Branch hotfix depuis main
git checkout main -b hotfix/security-CVE-XXXX

# 2. Fix + tests
# ... corrections ...
pnpm test && pnpm lint

# 3. Commit + merge direct (exception procedure)
git commit -m "fix: correction vulnerabilite CVE-XXXX"
git checkout main && git merge hotfix/security-CVE-XXXX

# 4. Deploiement immediat
docker compose build --no-cache app
docker compose up -d --force-recreate app

# 5. Post-mortem (sous 24h)
```

---

> **Fin du document MASTER_IMPLEMENTATION_GUIDE.md**  
> **Version 1.0.0 — 2026-07-22**  
> **Prochaine revision : mensuelle**  
> **Documents relies** : `MASTER_SECURITY_REQUIREMENTS.md`, `MASTER_SECURITY_ARCHITECTURE.md`, `MASTER_AUTH_ARCHITECTURE.md`, `MASTER_FRAUD_ENGINE.md`
