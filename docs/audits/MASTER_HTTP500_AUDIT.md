# MASTER_HTTP500_AUDIT.md

> Version : 1.0
>
> Projet : NeverBrokeAgain
>
> Type : Audit global de robustesse — erreurs HTTP 500, exceptions non gérées, crashs
>
> Date : 2026-07-19
>
> Équipe : Principal Architect, Staff Backend, Principal Frontend, SRE, DevSecOps, DB Architect, Next.js/Prisma/PostgreSQL/Docker Experts, QA

---

# SCORE GLOBAL DE STABILITÉ : 62/100 — 🟡 Production avec réserves

| Domaine | Score | Niveau |
|---|---|---|
| Routes API | 6/10 | 🟡 Correct |
| Frontend / React | 6/10 | 🟡 Correct |
| Workers / BullMQ / WS | 5/10 | 🟠 Prototype |
| Scripts / Cron | 5/10 | 🟠 Prototype |
| Infrastructure / DB / Prisma | 5/10 | 🟠 Prototype |
| Gestion d'erreurs centralisée | 5/10 | 🟠 Prototype |
| **MOYENNE** | **5.4/10** | **🟡 Production avec réserves** |

---

# NOMBRE DE RISQUES DÉTECTÉS

| Gravité | Count |
|---|---|
| Critique | 4 |
| Élevé | 18 |
| Moyen | 26 |
| Faible | 19 |
| **Total** | **67** |

---

# 1. CAUSES POTENTIELLES D'ERREUR 500 (synthèse)

> Chaque entrée : Module · Localisation · Cause · Scénario · Probabilité · Impact · Gravité · Correctif · Priorité

## 1.1 CRITIQUES

### C1 — `handleAuthError` masque toutes les erreurs Prisma en 500 générique
- **Module** : `src/lib/auth-utils.ts:77-98` (+ ~30 routes qui l'utilisent)
- **Cause** : `handleAuthError` ne traite que `AuthError` et `ValidationError`. Toute `PrismaClientKnownRequestError` (P2025/P2002/P2003), `PrismaClientValidationError`, ou `Error` générique devient un 500 opaque. Pas de mapping métier (404/409/400).
- **Scénario** : n'importe quelle requête DB échoue → 500 au lieu d'un code approprié ; impossible de monitorer la cause.
- **Probabilité** : Très élevée (touches toutes les routes) · **Impact** : Élevé · **Gravité** : Critique
- **Correctif** : ajouter `if (error instanceof Prisma.PrismaClientKnownRequestError)` → P2025→404, P2002→409, P2003→400, `PrismaClientValidationError`→400, avec `console.error(error.code, error.meta)`.
- **Priorité** : P0

### C2 — Pas de timeout ni pool config sur Prisma (requêtes qui pendent)
- **Module** : `src/lib/db.ts:8`
- **Cause** : `new PrismaPg({ connectionString: process.env.DATABASE_URL! })` sans `max`, `connectionTimeoutMillis`, `idleTimeoutMillis`. `DATABASE_URL` sans `pool_timeout`/`statement_timeout`.
- **Scénario** : latence Neon + pic de trafic → pool saturé → toutes les requêtes pendent → healthcheck fail → 503 en cascade.
- **Probabilité** : Moyenne · **Impact** : Critique · **Gravité** : Critique
- **Correctif** : `new PrismaPg({ connectionString, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 })` + `?pool_timeout=10&statement_timeout=15000` dans `DATABASE_URL`.
- **Priorité** : P0

### C3 — `RESEND_API_KEY` manquant → 500 sur OTP / reset password en prod
- **Module** : `src/lib/email.ts` (`getResend` throw si clé absente ; `sendEmail` rethrow)
- **Cause** : si `RESEND_API_KEY` absent en prod, `sendEmail` lève → remonte en 500 dans `onboarding/verify-otp`, `change-password`, `change-email`.
- **Scénario** : variable oubliée au déploiement → aucun email critique ne fonctionne, 500 systématique.
- **Probabilité** : Faible · **Impact** : Critique (auth bloquée) · **Gravité** : Critique
- **Correctif** : fail-closed clair + log + alerte ; ne jamais laisser un 500 silencieux sur l'auth.
- **Priorité** : P0

### C4 — `REDIS_URL` non validée au boot → crash worker/app
- **Module** : `docker-entrypoint.sh`, `docker-entrypoint-worker.sh`, `workers/queue.ts`
- **Cause** : seule `DATABASE_URL` est vérifiée. `REDIS_URL` vide → BullMQ/ioredis échoue au démarrage → crash loop du worker (files jamais consommées).
- **Scénario** : `.env` incomplet sur VPS2 → worker en crash restart → signaux/notifications/KYC en retard.
- **Probabilité** : Faible · **Impact** : Critique · **Gravité** : Critique
- **Correctif** : ajouter guard `if [ -z "$REDIS_URL" ]` dans les deux entrypoints.
- **Priorité** : P0

## 1.2 ÉLEVÉS (sélection des plus impactants)

### E1 — `useSearchParams` sans `<Suspense>` → build error / 500 prod
- **Module** : `src/app/(dashboard)/dashboard/layout.tsx` (AppShell, Sidebar, MobileBottomNav, MobileMenu), `admin/audit/page.tsx`, `dashboard/journal/page.tsx`
- **Cause** : `useSearchParams()` utilisé hors Suspense → Next.js renvoie une erreur de prérendu en production.
- **Scénario** : build de prod ou navigation → 500 / page blanche.
- **Gravité** : Élevé · **Correctif** : envelopper les composants utilisant `useSearchParams` dans `<Suspense>`. · **P1**

### E2 — Server Components avec `prisma` sans try/catch → 500 page entière
- **Module** : `admin/layout.tsx`, `dashboard/layout.tsx`, `dashboard/signals/[id]`, `dashboard/signals/page`, `admin/tracker`
- **Cause** : rendu serveur fait des requêtes DB directes ; une erreur DB = 500 de toute la page (pas d'error boundary métier).
- **Scénario** : DB indisponible transitoirement → toutes ces pages 500.
- **Gravité** : Élevé · **Correctif** : wrap des appels DB dans try/catch + `error.tsx` par section. · **P1**

### E3 — Erreurs Prisma P2025 → 500 au lieu de 404 ( nombreuses routes admin )
- **Module** : `admin/kyc/[id]`, `admin/broker/[id]`, `admin/members` PUT, `admin/access-requests/[id]` (`findUniqueOrThrow`), `admin/security/sessions/[id]`, `onboarding/verify-otp`
- **Cause** : update/delete sans guard d'existence → P2025 → 500 (via C1).
- **Gravité** : Élevé · **Correctif** : `findUnique` + 404, ou corriger C1. · **P1**

### E4 — `new Error("Signal introuvable")` (générique) → 500 au lieu de 404
- **Module** : `modules/signals/services/*` (get-signals, create/update/publish/duplicate-signal)
- **Cause** : ces services lèvent `Error` générique non `AuthError` → captés par `handleAuthError` → 500.
- **Scénario** : admin ouvre stats/versions/delivery d'un signal soft-deleted.
- **Gravité** : Élevé · **Correctif** : lever `AuthError("…", 404)`. · **P1**

### E5 — `throw error` dans le catch → 500 non contrôlé + fuite possible
- **Module** : `onboarding/profile/route.ts:43`, `public/select-plan/route.ts:106`
- **Cause** : re-throw de toute exception non AuthError/ValidationError → 500 brut Next.js.
- **Gravité** : Élevé · **Correctif** : `return handleAuthError(error)`. · **P1**

### E6 — `execSync("crontab -l")` en environnement serverless
- **Module** : `admin/crons/route.ts:64`
- **Cause** : commande absente sur hébergement conteneurisé → exception → 500 systématique.
- **Gravité** : Élevé · **Correctif** : try/catch interne → `jobs: []`, ou lire depuis BullMQ. · **P1**

### E7 — Fuite de stack trace / message brut au client
- **Module** : `admin/operations/route.ts:170`, `admin/security/route.ts:66`, `admin/settings/route.ts:89`
- **Cause** : `return NextResponse.json({ error: error.message }, { status: 500 })` expose le message Prisma brut.
- **Gravité** : Élevé · **Correctif** : `serverError(error, "route")` (déjà importé ailleurs). · **P1**

### E8 — Workers BullMQ sans `attempts`/`backoff`/DLQ → perte définitive de jobs
- **Module** : `workers/queue.ts` (file-cleanup, notification-delivery, signal-distribution)
- **Cause** : aucun retry configuré ; un job qui throw est marqué failed une fois, jamais rejoué.
- **Scénario** : panne DB transitoire pendant `distributeSignal` → membres ne reçoivent jamais le signal.
- **Gravité** : Élevé · **Correctif** : `attempts: 3, backoff: { type: "exponential", delay: 5000 }` + DLQ. · **P1**

### E9 — N+1 DB dans `sendEmail` (1 SELECT par email)
- **Module** : `src/lib/email.ts:1000-1012`
- **Cause** : requête DB pour chaque email dans une campagne → saturation pool sur 1000+ users.
- **Gravité** : Élevé · **Correctif** : pré-charger la map email→emailStatus une fois. · **P1**

### E10 — Job de distribution long > `lockDuration` → doublons + relance concurrente
- **Module** : `src/lib/services/signal-distribution.ts`
- **Cause** : envoi séquentiel sur gros audience > 30s (lockDuration défaut) → BullMQ relance → doublons Telegram/WhatsApp/email.
- **Gravité** : Élevé · **Correctif** : augmenter `lockDuration`, paralléliser par batch, rendre idempotent. · **P1**

### E11 — `telegram.ts` fetch sans timeout → blocage du job de distribution
- **Module** : `src/lib/services/telegram.ts:8-13`
- **Cause** : `fetch` sans `AbortSignal` → pend indéfiniment si API Telegram ne répond pas.
- **Gravité** : Élevé · **Correctif** : `AbortSignal.timeout(5000)` + `res.ok` check. · **P1**

### E12 — Scripts backfill : `while(true)` sans garde → boucle infinie
- **Module** : `scripts/backfill-audit-integrity.ts:53`, `backfill-audit-search.ts:41`
- **Cause** : boucle sans limite d'itérations ; si `update` échoue silencieusement → boucle infinie qui nappe la DB.
- **Gravité** : Élevé · **Correctif** : `MAX_ITERATIONS` + try/catch + break. · **P1**

### E13 — `email-stuck-pending.ts` sans pagination → OOM du cron
- **Module** : `scripts/email-stuck-pending.ts:43-62`
- **Cause** : `findMany` sans `take` sur des millions de PENDING → tout en mémoire ; `updateMany` avec tableau géant.
- **Gravité** : Élevé · **Correctif** : paginer `take:1000` + curseur. · **P1**

### E14 — Race condition : double session active (journal)
- **Module** : `src/app/api/dashboard/journal/sessions/route.ts:52-62`
- **Cause** : `findFirst` puis `create` sans transaction → 2 POST concurrents → 2 sessions actives.
- **Gravité** : Élevé · **Correctif** : `$transaction` + `upsert` conditionnel ou contrainte unique partielle. · **P1**

### E15 — Race condition : `updateDisciplineStreak` → P2002 silencieux
- **Module** : `src/lib/services/journal-discipline.ts` + `trades/route.ts`, `reflections/route.ts`
- **Cause** : findUnique+create sans verrou → double create → P2002 swallowé par `.catch` → streak perdu.
- **Gravité** : Élevé · **Correctif** : `upsert` dans une transaction. · **P1**

### E16 — `requireRole`/`requirePermission` : `user.role` null → TypeError 500
- **Module** : `src/lib/auth-utils.ts:42, 69`
- **Cause** : accès `user.role.name` / `user.role.permissions` sans guard si rôle null.
- **Gravité** : Élevé · **Correctif** : `if (!user?.role) throw AuthError(..., 403)`. · **P1**

### E17 — `requireAuth` : `session.user` non gardé → TypeError 500
- **Module** : `src/lib/auth-utils.ts:16-18`
- **Cause** : session partiellement désérialisée → `session.user.id` → TypeError.
- **Gravité** : Élevé · **Correctif** : `if (!session?.user) throw AuthError(..., 401)`. · **P1**

### E18 — Validation Zod `reflections` : `date` non validée → Invalid Date → 500
- **Module** : `src/app/api/dashboard/journal/reflections/route.ts:11,45`
- **Cause** : `date: z.string()` sans format → `new Date("abc")` invalide → upsert corrompu → 500.
- **Gravité** : Élevé · **Correctif** : `z.string().datetime()` + refine. · **P1**

### E19 — `profile` PUT payload vide → `update` data vide → 500
- **Module** : `src/app/api/dashboard/profile/route.ts:43` + `src/lib/validations`
- **Cause** : tous les champs optional → `{}` → `prisma.user.update({ data: {} })` → `PrismaClientValidationError` → 500.
- **Gravité** : Élevé · **Correctif** : reject payload vide (`.refine`) + gérer `PrismaClientValidationError` dans C1. · **P1**

### E20 — `admin/tracker` : N+1 prisma dans boucle → timeout/500
- **Module** : `src/app/(admin)/admin/tracker/page.tsx:139-160`
- **Cause** : `for (const signal of signals)` avec `findMany` à l'intérieur → N requêtes.
- **Gravité** : Élevé · **Correctif** : agréger en 1 requête groupBy. · **P1**

### E21 — Double healthcheck incohérent (Dockerfile vs compose)
- **Module** : `Dockerfile:85-86` + `compose.yml:42-47`
- **Cause** : deux healthchecks → faux positif "healthy" alors que l'app est down → Traefik route vers 502/500.
- **Gravité** : Élevé · **Correctif** : ne garder que le healthcheck HTTP compose. · **P1**

### E22 — Pas d'attente Redis prêt au boot
- **Module** : `docker-entrypoint.sh`, `docker-entrypoint-worker.sh`
- **Cause** : `pg_isready` pour la DB seulement ; Redis pas prêt → worker crash loop.
- **Gravité** : Élevé · **Correctif** : boucle `redis-cli -u "$REDIS_URL" ping`. · **P1**

## 1.3 MOYENS (résumé)

| # | Module · Localisation | Cause | Correctif | Prio |
|---|---|---|---|---|
| M1 | `workers/queue.ts:9-20` | worker zombie si Redis down (pas de noop comme `src/lib/queue.ts`) | noop/circuit-breaker + healthcheck | P2 |
| M2 | `workers/websocket.ts:133` | subscribe non ré-abonnés après coupure Redis | `await` + handler `ready` | P2 |
| M3 | `workers/bull-board.ts:21` | `DATABASE_URL!` non validé → 500 sur chaque auth au boot | valider au boot | P2 |
| M4 | `src/lib/queue.ts:41` | circuit breaker global partagé → noop silencieux sur 3 files | alerte + log structuré | P2 |
| M5 | `src/lib/redis-pubsub.ts:53` | reconnexion Pub/Sub aveugle après `markUnavailable` | recréer la connexion | P2 |
| M6 | `src/lib/services/signal-distribution.ts` | `imageCache` Map jamais purgée → fuite mémoire OOM | LRU/TTL | P2 |
| M7 | `src/lib/services/signal-distribution.ts:152` | filtre Prisma `not`+`notIn` douteux | scinder en `AND` | P2 |
| M8 | `src/lib/services/notifications.ts:196` | `$transaction` + `queue.add` → delivery orpheline | inverser l'ordre / DLQ | P2 |
| M9 | `trades/route.ts` POST | `signalId` FK non vérifié → P2003 → 500 | vérifier existence / gérer P2003 | P2 |
| M10 | `trades/[id]/route.ts` PUT | frais recalculés à 0 si non fournis ; `spread:0` ignoré | merger l'ancien trade | P2 |
| M11 | ~15 routes API | `await req.json()` sans `.catch(()=>({}))` → 500 sur body vide | `.catch(()=>({}))` | P2 |
| M12 | `admin/signals/templates/route.ts` etc. | `schema.parse()` (non safeParse) → ZodError → 500 | `validateOrThrow` | P2 |
| M13 | `dashboard/signals/[id]/archive|favorite` | findUnique+create non atomique → P2002 | `upsert` | P2 |
| M14 | `scripts/*` (S2) | `process.exit(0)` avant `await logAuditEvent` → audit perdu | `await` puis exit | P2 |
| M15 | `scripts/keep-alive.ts` | écrase `process.env` global + jamais de exit (daemon) | isoler env / exit en cron | P2 |
| M16 | `scripts/register-telegram-webhook.ts` | `main()` sans `.catch` → UnhandledRejection crash | `.catch().finally(exit)` | P2 |
| M17 | `webhooks/resend/route.ts:28` | secret manquant → 500 (Resend retry) | 200/503 + alerte | P2 |
| M18 | `dashboard/messages/attachment` | erreur storage 400 (devrait 500) + message brut | distinguer validation/stockage | P2 |
| M19 | `admin/signals/upload` | pas de validation magic-bytes (validateUpload) | appeler `validateUpload` | P2 |
| M20 | `next.config.ts` | pas de `keepAliveTimeout`/`bodySizeLimit` | configurer timeouts | P2 |
| M21 | `docker-entrypoint-worker.sh:20` | `prisma generate` runtime swallowé → client stale | builder dans l'image | P2 |
| M22 | entrypoints | `BETTER_AUTH_SECRET` non validé (longueur) | guard ≥32 chars | P2 |
| M23 | `stats/route.ts` | `profitFactor` peut être `Infinity` → `null` | retourner `null` explicite | P3 |
| M24 | `checkPsychology`/`notify` | fire-and-forget non transactionnel, alertes perdues | job BullMQ + retry | P2 |
| M25 | `sessions/[id]` POST | résumé calculé sur snapshot périmé | calcul après update | P3 |
| M26 | `export-data/route.ts` | `logAuditEvent` fire-and-forget après return | `await` | P3 |

## 1.4 FAIBLES (résumé)

Notifications push/telegram/whatsapp fire-and-forget sans métrique (M10 notifications.ts), `isInQuietHours` format non validé (notifications.ts), `editMessage` `senderName:""` (donnée fausse), `files/[...path]` accès fichier, `control-room/analytics` redis inline OK, `healthcheck.ts` fetch sans timeout, `cleanup-email-events` boucle while sans garde, `cleanup-push` clés bidons, `test-env.ts`/`test-suite.sh` sans catch, `check_db.ts` exit 0 même si DB down, `.env.example` incomplet (`REDIS_PASSWORD`, `MINIO_*`, `SENTRY_*`), `setup-vps2.sh` curl|sh, MinIO/imgproxy ports exposés, `docker-entrypoint.sh` exit code masqué, `stats-dashboard` accès `riskMetrics.*` sans guard, `useDetectTimezone` effet mineur.

---

# 2. PLAN DE CORRECTION

## Quick Wins (P0/P1 — < 1 jour, fort impact)

| # | Action | Impact |
|---|---|---|
| Q1 | Corriger `handleAuthError` (mapping Prisma P2025/P2002/P2003/Validation → 400/404/409) | 🔴→✅ Résout ~50% des 500 (C1, E3, E4, E19) |
| Q2 | Timeouts + pool Prisma (`db.ts`) | 🔴→✅ Empêche la saturation cascadé (C2) |
| Q3 | `if [ -z "$REDIS_URL" ]` dans les entrypoints | 🔴→✅ Évite crash worker (C4) |
| Q4 | `RESEND_API_KEY` fail-closed + alerte | 🔴→✅ Auth jamais 500 silencieux (C3) |
| Q5 | `requireAuth/requireRole/requirePermission` guards `session?.user`/`user?.role` | 🔴→✅ Évite TypeErrors (E16, E17) |
| Q6 | `throw error` → `handleAuthError` (onboarding/profile, select-plan) | 🔴→✅ (E5) |
| Q7 | `useSearchParams` dans `<Suspense>` | 🔴→✅ Build/500 prod (E1) |
| Q8 | `req.json().catch(()=>({}))` sur ~15 routes | 🔴→✅ (M11) |

## Court terme (P2 — 1-3 jours)

- Workers BullMQ : `attempts`/`backoff`/DLQ (E8), noop/healthcheck (M1), Pub/Sub reconnect (M5)
- Distribution signaux : timeout fetch (E11), parallélisation + lockDuration (E10), LRU cache (M6)
- Cron scripts : pagination (E13), garde boucle (E12), `await` audit (M14), `.catch` (M16)
- Race conditions journal : `upsert` sessions (E14) + discipline (E15)
- Validation : `reflections.date` datetime (E18), Zod safeParse (M12), upsert archive/favorite (M13)
- Infra : healthcheck unique (E21), wait Redis (E22), `keepAliveTimeout` (M20), `BETTER_AUTH_SECRET` guard (M22)

## Moyen terme (P3 — 1-2 semaines)

- Server Components DB : error boundaries par section (E2)
- `notify`/`checkPsychology` dans BullMQ (M24)
- N+1 tracker admin (E20), email N+1 (E9)
- Magic-bytes upload (M19), webhook 503 (M17)

## Long terme (P4)

- Circuit breaker par file (M4), monitoring/alerting sur DLQ, tests de robustesse automatisés (100 users, DB down, Redis down simulations).

---

# 3. ROBUSTESSE GLOBALE : B

Le système est fonctionnel mais **pas prêt pour une production sans réserves**. La gestion d'erreurs centralisée est insuffisante (un seul helper `handleAuthError` qui ne connaît pas Prisma), les workers manquent de retry, et plusieurs Server Components/route handlers peuvent planter en 500 sur une erreur DB transitoire ou un payload mal formé.

---

# 4. VERDICT

🟡 **Production avec réserves** — Correctifs obligatoires avant tout déploiement en charge :

1. **P0** : `handleAuthError` (mapping Prisma), timeouts/pool Prisma, validation `REDIS_URL` + `RESEND_API_KEY` au boot.
2. **P1** : `useSearchParams`/Suspense, guards auth, `throw error`→`handleAuthError`, retry BullMQ, race conditions journal.

Sans ces correctifs, une erreur DB transitoire ou un pic de trafic peut générer des 500 en cascade et des crashs de workers.

---

*Audit réalisé le 19 juillet 2026 par l'équipe multidisciplinaire (Principal Architect, Staff Backend, Principal Frontend, SRE, DevSecOps, DB Architect, Next.js/Prisma/PostgreSQL/Docker Experts, QA).*
