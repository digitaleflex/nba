# Chaos Engineering Audit Report — NeverBrokeAgain (NBA)

**Date**: 2026-07-21
**Scope**: Full-stack application (Next.js 16, Prisma/PostgreSQL, Redis/Valkey, BullMQ, Resend, WebSocket, Docker)
**Methodology**: Google SRE Handbook, Netflix Chaos Engineering, AWS Well-Architected, CNCF Resilience Patterns

---

## 1. Executive Summary

NeverBrokeAgain shows **deliberate resilience engineering** uncommon for its maturity level. The team has implemented:
- Circuit breakers for all external APIs (Resend, Telegram, WhatsApp)
- Per-subsystem Redis fail-open with 30s cooldown (cache, rate-limit, pubsub, queues)
- Transaction retry with exponential backoff for Prisma
- Dead letter queue for failed BullMQ jobs
- Graceful shutdown handlers in all processes
- Error boundaries at every route group level
- Health check endpoints with multi-layer verification

**However**, critical gaps exist:

| Area | Gap | Severity |
|------|-----|----------|
| Database unavailability | No read-only mode, no user messaging, hard crash | **Critical** |
| Observability | No OpenTelemetry, no metrics endpoint, no distributed tracing | **Critical** |
| Concurrent modification | No optimistic locking, no version fields, last-write-wins | **High** |
| Rate limiting degrades | Fail-open allows unlimited requests when Redis down | **High** |
| WebSocket transport | Polling-only, no true WebSocket transport | **Medium** |
| Offline support | No service worker, no offline-first patterns | **Medium** |
| Circuit breakers | In-memory only, not shared across instances | **Medium** |
| Disk monitoring | No disk usage monitoring or alerts | **Medium** |
| Deployment rollback | No automated rollback strategy in CI/CD | **Medium** |

---

## 2. Chaos Readiness Score: 58/100

| Category | Score |
|----------|-------|
| Frontend Resilience | 62 |
| Backend Resilience | 55 |
| Infrastructure Resilience | 50 |
| API Resilience | 52 |
| Database Resilience | 40 |
| Storage Resilience | 45 |
| Authentication Resilience | 65 |
| Payment Resilience | N/A (not integrated) |
| Notification Resilience | 58 |
| Observability | 35 |
| Security Resilience | 60 |
| UX Under Failure | 40 |

---

## 3. Availability Score: 65/100

- Health checks: ✅ Present at app, WS, Bull Board level
- Auto-restart: ✅ PM2 + Docker restart policies
- Graceful shutdown: ✅ Implemented in app, workers, WS
- Startup dependencies: ✅ Waits for DB + Redis before accepting traffic
- Multi-instance readiness: ❌ Redis adapter present but single-instance config
- No cross-region/zone: ❌ Single region deployment

---

## 4. Reliability Score: 55/100

- Transaction retry: ✅ 3 attempts, exponential backoff
- S3 retry: ✅ 3 attempts
- BullMQ job retry: ✅ Configurable, DLQ after exhaustion
- Email status tracking: ✅ Webhook-driven bounce/complaint handling
- Deduplication: ✅ Svix ID unique constraint for webhook events
- Idempotent signal distribution: ✅ Checks for existing notifications
- No data integrity verification: ❌ No checksums on stored files
- No read replicas: ❌ Single PostgreSQL instance

---

## 5. Resilience Score: 58/100

- Circuit breakers: ✅ 3 external API breakers implemented
- Redis fail-open: ✅ All Redis consumers degrade gracefully
- Plans fallback: ✅ Hardcoded fallback plans
- Email check fail-open: ✅ Allows send when DB unreachable
- Missing DB read-only mode: ❌ Application crashes when DB is down
- Missing graceful degradation UX: ❌ User sees server errors
- Missing cascading failure prevention: ❌ No bulkhead pattern

---

## 6. Auto-Healing Score: 52/100

| Mechanism | Status |
|-----------|--------|
| Retry (DB) | ✅ 3 retries, exponential backoff |
| Retry (S3) | ✅ 3 retries, exponential backoff |
| Retry (BullMQ) | ✅ Configurable per queue |
| Fallback (Redis) | ✅ Noop queues, direct DB, allow all |
| Fallback (plans) | ✅ Hardcoded fallback |
| Circuit Breaker | ✅ 3 external APIs |
| Cache | ✅ Auto-invalidation + fallback to DB |
| Autosave | ❌ Not detected |
| Session Recovery | ❌ No draft recovery on disconnect |
| Background Sync | ❌ No service worker |
| Queue Replay | ✅ DLQ replayable via admin UI |

---

## 7. User Experience Under Failure Score: 40/100

| Scenario | UX Quality |
|----------|-----------|
| Database down | ❌ Generic 500 errors, no explanation |
| Redis down | ⚠️ Silent degradation (no user indication) |
| Email down | ⚠️ Notifications queued but user not informed |
| External API down | ⚠️ Feature silently degrades |
| Network offline | ❌ No offline mode, no sync indicators |
| High latency | ❌ No loading state feedback beyond spinners |
| Concurrent conflict | ❌ Last-write-wins, no conflict UI |
| BullMQ down | ❌ No indication, jobs silently dropped |

---

## 8. Observability Score: 35/100

| Component | Status |
|-----------|--------|
| Structured logging | ✅ Pino JSON logs |
| Error tracking | ✅ Sentry (DSN, PII scrubbing, replay) |
| Health checks | ✅ Multi-layer (DB, WS, circuit breakers) |
| Audit trail | ✅ Immutable hash chain + real-time pub |
| OpenTelemetry | ❌ Not implemented |
| Metrics endpoint | ❌ No Prometheus/metrics endpoint |
| Distributed tracing | ❌ Not implemented |
| Correlation IDs | ✅ x-request-id on all responses |
| Error digest | ✅ error.digest for support correlation |
| Dashboard | ✅ Admin queue/cache/control room |
| Alerts | ❌ No automated alerting integration |
| Log aggregation | ❌ No log shipping to central system |

---

## 9. Tableau des scénarios

### Simulation 1 — PostgreSQL indisponible

| Métrique | Résultat |
|----------|----------|
| Détection | ✅ Health check detects, `SELECT 1` fails |
| Timeout | ✅ Prisma 30s transaction timeout |
| Retry | ✅ `withRetryTransaction` (3 attempts, 1s/2s/4s) |
| Fallback | ❌ **No fallback** — app returns 500 on any query |
| Mode lecture seule | ❌ Not implemented |
| Message utilisateur | ⚠️ `serverError()` returns generic 500 with `errorId` |
| Récupération automatique | ✅ Prisma pool reconnects (pg.Pool handles this) |
| Temps de récupération | ~30s + retry time |
| Données perdues | ❌ Any in-flight writes are lost |
| Impact utilisateur | **CRITICAL** — Full app outage |
| Gravité | **CRITICAL** |

**Recommandation**: Implement read-only mode. When DB is unreachable, serve cached dashboards from Redis. Display "Service en maintenance — vos données sont protégées" banner. Use a health-check-driven toggle to switch between read-only and full modes.

---

### Simulation 2 — Redis indisponible

| Métrique | Résultat |
|----------|----------|
| Cache | ✅ Falls back to direct DB query (30s cooldown) |
| Sessions | ✅ Better Auth sessions stored in PostgreSQL, not Redis |
| Queues | ✅ Creates noop queue that logs warnings |
| Rate limiting | ❌ Fail-open — allows all requests (security concern) |
| Pub/Sub | ✅ Silently drops |
| WebSocket | ⚠️ Socket.IO continues but Redis adapter loses multi-instance sync |
| Temps de récupération | Auto-recovery after 30s cooldown (or when Redis reconnect succeeds) |
| Impact utilisateur | **LOW** — Rate limiting bypass is a security concern |
| Gravité | **MEDIUM** |

**Recommandation**: Implement secondary in-memory rate limiting (token bucket) as fallback. Add Prometheus counter for ratelimit bypass events.

---

### Simulation 3 — BullMQ arrêté

| Métrique | Résultat |
|----------|----------|
| File d'attente | ✅ Jobs persist in Redis (BullMQ stores in Redis lists) |
| Tâches perdues | ❌ Only if container is killed before Redis persistence |
| Retry | ✅ Configurable per job (default 3 attempts, exponential backoff) |
| Dead letter queue | ✅ Moved to `dead-letter` queue after exhaustion |
| Redémarrage | ✅ PM2 auto-restart, Docker restart policy |
| Signal distribution | ❌ Unsent signals remain undelivered until worker restarts |
| Worker single process | ❌ All 3 queue types in same process (no isolation) |
| Temps de récupération | ~10-30s (PM2 restart) |
| Impact utilisateur | **MEDIUM** — Signal delivery delayed, email sending delayed |
| Gravité | **MEDIUM** |

**Recommandation**: Split worker into separate processes per queue type for fault isolation. Add admin alerting when DLQ receives jobs. Implement a dead-letter-page for admin replay with one-click.

---

### Simulation 4 — SMTP (Resend) indisponible

| Métrique | Résultat |
|----------|----------|
| Application continue | ✅ Yes, email is non-blocking |
| Mise en attente | ⚠️ BullMQ queues retry (3 attempts, 5s backoff), then DLQ |
| Réessai | ✅ Circuit breaker: 5 failures → 60s OPEN → HALF_OPEN |
| Message utilisateur | ❌ No user-facing indication |
| Emails critiques | ⚠️ Sent directly (OTP, reset password) — blocks user action |
| Temps de récupération | 60s circuit breaker cooldown + queue retry |
| Impact utilisateur | **MEDIUM** — Password reset/OTP blocked, signal emails delayed |
| Gravité | **MEDIUM** |

**Recommandation**: Add user feedback "L'email sera envoyé dans quelques minutes." for queued emails. Implement fallback SMTP provider for critical emails.

---

### Simulation 5 — API externe indisponible

| API | Circuit Breaker | Retry | Fallback | Mode dégradé |
|-----|-----------------|-------|----------|-------------|
| **Resend** | ✅ 5 failures / 60s | ✅ 3 attempts | ❌ None (critical emails blocked) | ⚠️ Queued |
| **Telegram** | ✅ 5 failures / 60s | ❌ Fire-and-forget | ❌ None | ⚠️ Silent drop |
| **WhatsApp** | ✅ 5 failures / 60s | ❌ Fire-and-forget | ❌ None | ⚠️ Silent drop |
| **Stripe** | N/A | N/A | N/A | Not integrated yet |
| **Cloudinary** | N/A | N/A | N/A | Not used (imgproxy) |
| **imgproxy** | ❌ No circuit breaker | ❌ No retry | ❌ None | ❌ Images broken |
| **MinIO/S3** | ❌ No circuit breaker | ✅ `withS3Retry` 3 attempts | ❌ None | ❌ File uploads/storage fail |
| **Neon/DB** | ❌ No circuit breaker | ✅ `withRetryTransaction` | ❌ None | ❌ Full app crash |

**Impact**: MEDIUM-HIGH
**Gravité**: HIGH for imgproxy/MinIO dependency chain

**Recommandation**: Add circuit breakers for imgproxy and MinIO. Implement image fallback (placeholder images) when imgproxy is down. Add storage provider failover (S3 → local).

---

### Simulation 6 — Docker redémarre

| Métrique | Résultat |
|----------|----------|
| Restart | ✅ `restart: unless-stopped` in compose, PM2 auto-restart |
| Healthcheck | ✅ App: HTTP `/api/public/health` 5s interval, 3 retries, 30s start |
| Reconnexion | ✅ Entrypoint waits for DB + Redis before starting |
| Perte de données | ✅ Docker volumes for storage, Redis, MinIO |
| Temps de reprise | ~30-60s (DB wait + Redis wait + Prisma warmup) |
| Worker healthcheck | ⚠️ `pgrep -f "tsx workers/queue.ts"` — fragile, false positives possible |
| Bull Board healthcheck | ✅ HTTP `/health` endpoint |

**Impact**: LOW (expected behavior in container orchestration)
**Gravité**: LOW

**Recommandation**: Replace worker `pgrep` healthcheck with HTTP endpoint. Add `start_period` of 40s to all healthchecks.

---

### Simulation 7 — Disque saturé

| Métrique | Résultat |
|----------|----------|
| Uploads | ❌ Fail silently or throw unhandled errors |
| Logs | ❌ Pino will fail to write, uncaught |
| Base | ❌ PostgreSQL crashes, Prisma queries fail |
| Cache | ✅ Not disk-based (Redis) |
| Temp | ❌ No temp file management |
| Comportement | ❌ No graceful degradation, cascading failures |
| Monitoring | ❌ No disk usage monitoring |

**Impact**: CRITICAL
**Gravité**: CRITICAL

**Recommandation**: Add disk usage monitoring (Prometheus node_exporter). Implement disk-full detection before uploads. Add log rotation with compression. Use `pino` with `limit` option or external log shipping. Add disk space check in health endpoint.

---

### Simulation 8 — CPU saturé

| Métrique | Résultat |
|----------|----------|
| Latence | ❌ No CPU-aware scheduling |
| Timeouts | ✅ Prisma 30s timeout protects DB |
| UX | ❌ No loading indication beyond spinners |
| Priorisation | ❌ No request priority queuing |
| Dégradation | ❌ None |

**Impact**: MEDIUM-HIGH
**Gravité**: MEDIUM

**Recommandation**: Implement request priority tiers (auth > reads > writes > background). Add PM2 cluster mode (instances: max) to utilize multi-core. Implement CPU monitoring with auto-scaling signals.

---

### Simulation 9 — Mémoire saturée

| Métrique | Résultat |
|----------|----------|
| OOM | ✅ PM2 `max_memory_restart: "1500M"` for Next.js |
| Memory leak | ❌ No leak detection or monitoring |
| GC | ❌ No GC tuning in Node.js |
| Reprise | ✅ PM2 auto-restart on OOM |
| Redis | ⚠️ No `maxmemory` policy explicitly set |
| WebSocket | ⚠️ No per-connection memory limit |

**Impact**: MEDIUM
**Gravité**: MEDIUM

**Recommandation**: Add `--max-old-space-size` to Node.js. Configure Redis `maxmemory-policy allkeys-lru`. Add per-connection memory limits in WebSocket. Implement heap dump on OOM for post-mortem analysis.

---

### Simulation 10 — Connexion réseau interrompue

| Métrique | Résultat |
|----------|----------|
| Frontend | ❌ No offline detection beyond OfflineBanner |
| API | ❌ Requests fail, no retry logic on client |
| WebSocket | ⚠️ Polling transport reconnects automatically |
| Uploads | ❌ No resumable upload, no pause/resume |
| Sync | ❌ No background sync |
| Autosave | ❌ Not detected in codebase |

**Impact**: HIGH
**Gravité**: HIGH

**Recommandation**: Implement service worker for offline support. Add client-side fetch retry with exponential backoff. Implement resumable uploads (tus protocol). Add autosave for form data with localStorage recovery.

---

### Simulation 11 — DNS indisponible

| Métrique | Résultat |
|----------|----------|
| External APIs | ❌ Resend, Telegram, WhatsApp all fail |
| Storage (MinIO) | ❌ S3 operations fail |
| Email webhook | ❌ Resend can't deliver events |
| Redis | ✅ Uses IP-based connection (internal Docker network) |
| Database | ✅ Uses IP/hostname from DATABASE_URL |
| Fallback | ❌ No DNS failover |

**Impact**: HIGH
**Gravité**: HIGH

**Recommandation**: Use IP-based fallback connections for critical services. Implement connection retry with DNS re-resolution. Add DNS health monitoring.

---

### Simulation 12 — Certificat SSL expiré

| Métrique | Résultat |
|----------|----------|
| Détection | ❌ No certificate expiry monitoring |
| Alerte | ❌ None |
| Messages | ❌ Browser shows "NET::ERR_CERT_DATE_INVALID" |
| Continuité | ❌ Complete outage via Traefik HTTPS |

**Impact**: CRITICAL
**Gravité**: CRITICAL

**Recommandation**: Add SSL certificate expiry monitoring (30-day, 14-day, 7-day, 1-day alerts). Use Let's Encrypt with auto-renewal via Traefik. Set up a monitoring URL that checks certificate expiry from external perspective.

---

### Simulation 13 — Timeout API

| Seuil | Comportement | Correctif |
|-------|-------------|-----------|
| 5s | Email sends: ✅ 10s timeout | - |
| 10s | Email sends: ✅ 10s timeout catches this | - |
| 30s | Prisma: ✅ 30s transaction timeout | - |
| 60s | ❌ No API route-level timeout | Add `requestTimeout` middleware |
| Retry | ✅ BullMQ retry, DB retry, S3 retry | - |
| Annulation | ✅ `AbortController` in `withTimeout` | - |
| Feedback | ❌ No client timeout handling | Add axios/fetch timeout config |

**Recommandation**: Add global API route timeout middleware (30s default) with proper 503 response. Add client-side fetch timeout (30s) with retry button. Implement timeout metrics tracking.

---

### Simulation 14 — Latence élevée

| Latence | UX Impact | Correctif |
|---------|-----------|-----------|
| 100ms | ✅ Normal | - |
| 500ms | ✅ Acceptable | - |
| 1s | ⚠️ Perceptible | Add loading skeletons |
| 5s | ❌ User may navigate away | Add progress bar + cancel button |
| 10s | ❌ Risk of timeout | Optimize query, add cache |
| 30s | ❌ Transaction timeout risk | Break into smaller operations |

**Recommandement**: Add per-route latency tracking to Sentry. Implement loading skeletons for all data-fetching components. Add optimistic UI updates for non-critical mutations.

---

### Simulation 15 — Perte Internet utilisateur

| Métrique | Résultat |
|----------|----------|
| Offline detection | ⚠️ `navigator.onLine` check in OfflineBanner |
| Autosave | ❌ Not implemented |
| Cache | ❌ No service worker cache |
| Synchronisation | ❌ No background sync |
| Reprise | ❌ Manual page reload required |

**Impact**: MEDIUM
**Gravité**: MEDIUM

**Recommandation**: Implement service worker with stale-while-revalidate cache strategy. Add IndexedDB queue for failed mutations (background sync). Implement autosave to localStorage with conflict detection on reconnect.

---

### Simulation 16 — Déconnexion brutale

| Métrique | Résultat |
|----------|----------|
| Session | ✅ Better Auth sessions survive (stored in DB) |
| Formulaire | ❌ Unsaved data lost |
| Upload | ❌ Partial upload lost, no resumability |
| Paiement | N/A (manual approval) |
| Workflow | ❌ Multi-step onboarding loses progress |

**Impact**: MEDIUM
**Gravité**: MEDIUM

**Recommandation**: Implement form state persistence in sessionStorage. Add "recover draft" prompt on reconnection. Implement multi-step workflow state persistence (onboarding already partially does this).

---

### Simulation 17 — Conflit concurrent

| Métrique | Résultat |
|----------|----------|
| Résolution | ❌ Last-write-wins |
| Rollback | ❌ No rollback for concurrent edits |
| Fusion | ❌ No merge strategy |
| Message | ❌ No conflict notification |
| Version field | ❌ No `version` column on models |
| Optimistic locking | ❌ Prisma does not use it by default |

**Impact**: HIGH — Data loss risk
**Gravité**: HIGH

**Recommandation**: Implement optimistic concurrency control using Prisma `version` field. Add `updatedAt` comparison before writes. Implement conflict UI showing diff between versions. Add tombstone/audit of overwritten data.

---

### Simulation 18 — Migration Prisma échoue

| Métrique | Résultat |
|----------|----------|
| Rollback | ❌ No automated rollback |
| Logs | ✅ Migration output captured in CI |
| Cohérence | ❌ Partial migration may leave inconsistent schema |
| Données | ❌ Risk of data loss on destructive changes |
| Backup | ✅ Daily B2 backup (scripts/backup.sh) |

**Impact**: CRITICAL
**Gravité**: CRITICAL

**Recommandation**: Run migrations in a transaction (wrap in `prisma migrate deploy --create-db`). Implement `prisma migrate resolve` in rollback script. Add pre-migration DB snapshot. Add CI check that migration can be rolled back.

---

### Simulation 19 — Rollback de déploiement

| Métrique | Résultat |
|----------|----------|
| Déploiement interrompu | ❌ No halfway-deploy detection |
| Rollback | ❌ No automated rollback script |
| Compatibilité | ❌ No schema version check on rollback |
| Base | ❌ Migrations not reversible without manual intervention |
| Cache | ❌ No cache invalidation on rollback |

**Impact**: CRITICAL
**Gravité**: CRITICAL

**Recommandation**: Add deployment version tracking. Implement automated rollback script that reverts code + DB migrations. Invalidate all cache on rollback. Add canary deployment strategy.

---

### Simulation 20 — Panne totale d'un fournisseur

| Fournisseur | Continuité | Fallback | UX |
|-------------|-----------|----------|-----|
| **Cloudinary** | ✅ Not used (imgproxy) | N/A | N/A |
| **Stripe** | ✅ Not integrated | N/A | N/A |
| **SMTP (Resend)** | ⚠️ Queues retry, circuit breaker opens | ❌ No alternative provider | ❌ Silent |
| **Redis** | ✅ Fail-open for cache/queues/rate-limit | ✅ Noop fallback | ❌ Silent |
| **Supabase** | ✅ Not used | N/A | N/A |
| **Neon (DB)** | ❌ Full outage | ❌ No read replica | ❌ App down |
| **MinIO** | ⚠️ Uploads fail, existing files served from /api/files | ❌ No storage migration | ❌ Error on upload |

**Impact**: CRITICAL (Neon), HIGH (Resend, MinIO, Redis)
**Gravité**: CRITICAL

**Recommandation**: Add read replica for PostgreSQL with failover. Implement dual SMTP provider (Resend + SendGrid fallback). Add multi-region MinIO replication. Implement Redis sentinel or cluster mode.

---

## 10. Single Points of Failure

| # | SPOF | Type | Impact | Mitigation |
|---|------|------|--------|------------|
| 1 | **PostgreSQL (Neon)** | Database | Complete app outage | Read replica + connection pooler |
| 2 | **Redis (Valkey)** | Cache/Queue | Rate limit bypass, no realtime, no jobs | Redis sentinel/cluster |
| 3 | **Single app container** | Compute | Complete app outage | Replicas (horizontal scaling) |
| 4 | **Single worker container** | Compute | Delayed signal/email delivery | Worker replicas |
| 5 | **MinIO instance** | Storage | Upload/download failure | Multi-region replication |
| 6 | **imgproxy instance** | Image processing | Broken images in emails/dashboard | Fallback to direct file URLs |
| 7 | **Resend API** | Email | No transactional emails | Secondary SMTP provider |
| 8 | **Telegram API** | Notifications | Telegram silent | Queue + user notification |
| 9 | **WhatsApp API** | Notifications | WhatsApp silent | Queue + user notification |
| 10 | **Single Traefik instance** | Reverse proxy | Full app outage | Traefik replicas |
| 11 | **Single domain** | DNS | Complete service loss | DNS failover + secondary domain |
| 12 | **Docker host** | Infrastructure | Complete service loss | Multi-host orchestration |

---

## 11. Services critiques

### Critique
| Service | Reason |
|---------|--------|
| PostgreSQL (Neon) | All data, all features depend on it |
| Authentication (Better Auth) | Session verification for all protected routes |
| Redis / Valkey | Queues, cache, rate limiting, WebSocket pub/sub |
| Docker host | All containers run on single host |
| Reverse proxy (Traefik) | TLS termination, routing, all traffic |

### Important
| Service | Reason |
|---------|--------|
| MinIO / S3 | File storage for KYC, broker, signals, avatars |
| BullMQ workers | Email delivery, signal distribution, file cleanup |
| WebSocket server | Real-time notifications, messaging, signal delivery |
| Resend (SMTP) | Transactional emails (OTP, password reset, signals) |
| imgproxy | Image optimization for emails and dashboard |

### Secondaire
| Service | Reason |
|---------|--------|
| Telegram bot | Optional notification channel |
| WhatsApp API | Optional notification channel |
| PostHog (analytics) | Optional, non-critical |
| Sentry (error tracking) | Optional, non-critical |
| Bull Board | Admin UI for queue management |
| Backblaze B2 | Daily backups (not real-time) |

---

## 12. Matrice des risques

| Risque | Probabilité | Gravité | Niveau |
|--------|-------------|---------|--------|
| PostgreSQL indisponible | Low | Critical | **Critique** |
| Redis indisponible | Low | High | **Critique** |
| Disque saturé | Medium | Critical | **Critique** |
| Migration échoue | Low | Critical | **Critique** |
| Rollback échoue | Low | Critical | **Critique** |
| Conflit concurrent | High | High | **Critique** |
| DNS indisponible | Low | Critical | **Critique** |
| SSL expiré | Low | Critical | **Critique** |
| Déploiement interrompu | Medium | High | **Élevé** |
| Docker host failure | Low | High | **Élevé** |
| SMTP indisponible | Medium | Medium | **Élevé** |
| API externe down | Medium | Medium | **Élevé** |
| Perte Internet utilisateur | High | Medium | **Élevé** |
| Déconnexion brutale | High | Medium | **Élevé** |
| Latence élevée | Medium | Medium | **Moyen** |
| CPU saturé | Medium | Medium | **Moyen** |
| Mémoire saturée | Medium | Low | **Moyen** |
| Réseau interrompu | Low | High | **Élevé** |
| BullMQ arrêté | Low | Medium | **Moyen** |

---

## 13. Roadmap

### Quick Wins (1-2 weeks)

| # | Action | Effort | Gain | Issue Template |
|---|--------|--------|------|----------------|
| 1 | Add `maxmemory-policy allkeys-lru` to Redis config | 1h | Prevent Redis OOM | `fix/redis-maxmemory-policy` |
| 2 | Replace worker `pgrep` healthcheck with HTTP endpoint | 2h | Reliable worker monitoring | `fix/worker-healthcheck` |
| 3 | Add disk usage check to health endpoint | 4h | Early disk-full detection | `feat/health-disk-check` |
| 4 | Add `--max-old-space-size=4096` to PM2 Node.js args | 1h | Prevent OOM crashes | `fix/node-memory-limit` |
| 5 | Add client-side fetch timeout (30s) with error UI | 8h | Better timeout UX | `feat/fetch-timeout` |
| 6 | Add `X-Request-Timeout: 30` header to API routes | 4h | Server-side request timeout | `feat/api-request-timeout` |
| 7 | Add SSL cert expiry monitoring | 2h | Prevent cert expiration outage | `feat/ssl-monitoring` |
| 8 | Implement form state persistence in sessionStorage | 8h | Prevent data loss on disconnect | `feat/form-autosave` |

### Court terme (30 jours)

| # | Action | Effort | Gain |
|---|--------|--------|------|
| 1 | Implement read-only mode when DB is down | 3w | App survives DB outage |
| 2 | Add secondary in-memory rate limiter (token bucket) | 1w | Rate limiting survives Redis down |
| 3 | Implement optimistic concurrency control (version fields) | 2w | Prevent data loss on concurrent edits |
| 4 | Add Prometheus metrics endpoint + node_exporter | 2w | Foundation for observability |
| 5 | Add Sentry performance monitoring to critical API routes | 1w | Latency tracking |
| 6 | Implement service worker with basic offline page | 2w | Better offline UX |
| 7 | Add automated rollback script for deployments | 2w | Safe deployment rollback |
| 8 | Split worker into separate processes per queue type | 1w | Fault isolation |

### Moyen terme (60 jours)

| # | Action | Effort | Gain |
|---|--------|--------|------|
| 1 | Implement OpenTelemetry instrumentation | 4w | Distributed tracing |
| 2 | Add PostgreSQL read replica with failover | 3w | DB HA |
| 3 | Implement Redis Sentinel/cluster | 3w | Redis HA |
| 4 | Add secondary SMTP provider (SendGrid) | 2w | Email HA |
| 5 | Implement resumable file uploads (tus) | 3w | Robust uploads |
| 6 | Add dashboard circuit breaker status UI | 2w | Admin visibility |
| 7 | Implement database migration rollback automation | 2w | Safe migrations |
| 8 | Add WebSocket transport (not just polling) | 2w | Real-time efficiency |

### Long terme (6-12 mois)

| # | Action | Effort | Gain |
|---|--------|--------|------|
| 1 | Multi-region deployment (Docker Swarm / K8s) | 3m | Full HA |
| 2 | Cross-region MinIO replication | 2m | Storage HA |
| 3 | Automated chaos engineering pipeline (Litmus/Gremlin) | 3m | Continuous resilience |
| 4 | Real-time user-facing degradation dashboard | 2m | Transparency |
| 5 | Predictive auto-scaling based on traffic patterns | 3m | Cost + reliability |

---

## 14. Verdict

```
       Chaos Readiness   ████████████████░░░░░░  58/100  ★★★ Fragile
       Availability      ██████████████████░░░░░  65/100
       Reliability       ██████████████░░░░░░░░░  55/100
       Resilience        ██████████████░░░░░░░░░  58/100
       Auto-Healing      █████████████░░░░░░░░░░  52/100
       UX Under Failure  ██████████░░░░░░░░░░░░░  40/100
       Observability     ████████░░░░░░░░░░░░░░░  35/100
```

## ★★★ Fragile

L'application est **résiliente par conception** mais **fragile en pratique**.

Les bases sont solides :
- Circuit breakers et retry logic bien conçus
- Redis fail-open bien architecturé
- Error boundaries multi-niveaux
- Dead letter queue
- Health checks

Mais les faiblesses critiques sont :
1. **Aucune tolérance à la panne base de données** — l'application s'arrête complètement
2. **Aucune observabilité moderne** — pas d'OpenTelemetry, pas de métriques
3. **Aucune protection contre les conflits concurrents** — perte de données possible
4. **Aucun mode dégradé UX** — l'utilisateur ne comprend pas ce qui se passe
5. **Rate limiting contournable** — fail-open sans fallback secondaire

**Prochaine cible : ★★★★ Très résilient (72+/100)**

Pour y parvenir :
1. Implémenter le mode lecture seule (30j) → +10 points
2. Ajouter OpenTelemetry + Prometheus (60j) → +8 points
3. Version fields + optimistic locking (30j) → +5 points
4. Service worker + offline mode (30j) → +5 points
5. In-memory rate limit fallback (15j) → +3 points

Total estimé : **31/100 points additionnels** → **89/100 — Très résilient**
