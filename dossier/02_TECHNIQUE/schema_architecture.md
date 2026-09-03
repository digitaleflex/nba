# 🏗️ Schéma d'architecture — SignauxX

> **Documentation visuelle** des flux de données et de l'infrastructure.
> À destination des repreneurs, auditeurs, et nouveaux développeurs.

---

## 🌐 Architecture globale (Production)

```
                    ┌──────────────────────────┐
                    │     UTILISATEURS         │
                    │  (membres + admins)      │
                    └─────────┬────────────────┘
                              │
                              │ HTTPS (TLS 1.3)
                              │
                    ┌─────────▼────────────────┐
                    │  CLOUDFLARE              │
                    │  • DNS                   │
                    │  • CDN                   │
                    │  • DDoS protection       │
                    └─────────┬────────────────┘
                              │
                              │ HTTP/HTTPS
                              │
                    ┌─────────▼────────────────┐
                    │  TRAEFIK (reverse proxy) │
                    │  • TLS termination       │
                    │  • Rate limiting L7      │
                    │  • Host-based routing    │
                    │  signauxx.com            │
                    │  access.signauxx.com     │
                    └─────┬───────────────┬────┘
                          │               │
                          │               │
                          ▼               ▼
                ┌─────────────────┐  ┌──────────────────┐
                │  VPS1 (Hetzner) │  │  Bull-Board UI   │
                │                 │  │  (admin queue    │
                │  Next.js 16     │  │   monitoring)    │
                │  • Standalone   │  └─────────┬────────┘
                │  • WebSocket    │            │
                │  • 4 GB RAM     │            │
                │  • Disk 80GB    │            │
                └────┬────────────┘            │
                     │                         │
                     │ Tailscale VPN           │
                     │ (mesh encrypted)        │
                     │                         │
                     └──────────┬──────────────┘
                                │
                                ▼
                ┌──────────────────────────────────┐
                │  VPS2 (séparé)                    │
                │                                   │
                │  • Worker Node.js                 │
                │  • BullMQ consumer                │
                │  • Redis 7 (auth Tailscale)       │
                │  • Cron jobs :                    │
                │    - Backup B2 quotidien (2h)     │
                │    - Discord alerts               │
                │    - Email queues                 │
                │    - Cleanup fichiers KYC 7j      │
                │  • nba-auto-update.sh (5min)     │
                └────┬───────────────┬─────────────┘
                     │               │
                     │               │
                     ▼               ▼
         ┌─────────────────────┐  ┌──────────────────┐
         │  NEON PostgreSQL    │  │  SENTRY          │
         │  (serverless)       │  │  (error tracking)│
         │  • 42 tables        │  └──────────────────┘
         │  • Pooler           │
         │  • Branches par PR  │  ┌──────────────────┐
         │  • Backups auto     │  │  BACKBLAZE B2    │
         └─────────────────────┘  │  (backup froid)  │
                                  │  • DB dump       │
                                  │  • Storage S3    │
                                  │  • .env chiffré  │
                                  └──────────────────┘
```

---

## 📡 Flux d'un signal (chemin complet)

```
┌─────────────┐  1. Crée signal    ┌──────────────┐
│  ADMIN      │ ──────────────────▶│ Next.js API  │
│ (édite +    │  POST /api/admin/  │ /admin/      │
│  preview)   │  signals           │ signals      │
└─────────────┘                    └──────┬───────┘
                                          │
                                          │ 2. INSERT en DB
                                          ▼
                                  ┌──────────────┐
                                  │  Neon DB     │
                                  │ signals table│
                                  └──────┬───────┘
                                         │
                                         │ 3. Emit event
                                         ▼
                                  ┌──────────────┐
                                  │  BullMQ      │
                                  │  Queue       │
                                  │ signals      │
                                  └──────┬───────┘
                                         │
                                         │ 4. Process async
                                         ▼
                                  ┌──────────────┐
                                  │  VPS2        │
                                  │  Worker      │
                                  │  (signals)   │
                                  └──────┬───────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
                │ 5a. Email              │ 5b. Push                │ 5c. WebSocket
                ▼                        ▼                        ▼
        ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
        │  Resend      │         │  Web Push    │         │  Socket.IO   │
        │  (templates) │         │  API         │         │  (broadcast) │
        └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
               │                        │                        │
               ▼                        ▼                        ▼
        ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
        │  Membres     │         │  Membres     │         │  Membres     │
        │  (email)     │         │  (browser)   │         │  (online)    │
        └──────────────┘         └──────────────┘         └──────────────┘
```

**Latence cible** : signal publié → livré aux membres en **< 30 secondes** (email) ou **< 1 seconde** (push/WebSocket pour connectés).

---

## 🔐 Flux KYC

```
┌─────────────┐  1. Upload     ┌──────────────┐
│  MEMBRE     │ ──────────────▶│ Next.js API  │
│  (form KYC) │  multipart     │ /onboarding/ │
│             │                │  kyc         │
└─────────────┘                └──────┬───────┘
                                      │
                                      │ 2. Magic bytes validation
                                      │ 3. Streaming write (anti-OOM)
                                      ▼
                              ┌──────────────┐
                              │  S3 / Storage│
                              │  /tmp        │
                              │  (transient) │
                              └──────┬───────┘
                                     │
                                     │ 4. Create KycDocument row
                                     ▼
                              ┌──────────────┐
                              │  Neon DB     │
                              │  kyc_documents│
                              └──────┬───────┘
                                     │
                                     │ 5. Notify admin
                                     ▼
                              ┌──────────────┐
                              │  BullMQ      │
                              │  notification│
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Admin       │
                              │  (review)    │
                              └──────┬───────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
            Approve            Reject              Request more
                  │                  │                  │
                  ▼                  ▼                  ▼
            (DB update)      (DB + email)        (DB + email)
                  │
                  │ 6. CRON quotidien (2h)
                  ▼
            ┌──────────────┐
            │ Cleanup job  │
            │ Supprime     │
            │ fichiers 7j  │
            └──────────────┘
```

---

## 💬 Flux WebSocket (messagerie temps réel)

```
┌─────────────┐                    ┌──────────────┐
│  MEMBRE A   │                    │  MEMBRE B    │
│  (online)   │                    │  (online)    │
└──────┬──────┘                    └──────┬───────┘
       │                                   │
       │ 1. WS connect (auth JWT)         │
       │ 2. Subscribe to own conversations │
       │                                   │
       └─────────────┬─────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Socket.IO   │
              │  Server      │
              │  (Next.js    │
              │   custom     │
              │   server)    │
              └──────┬───────┘
                     │
                     │ Redis adapter
                     │ (pub/sub)
                     │
                     ▼
              ┌──────────────┐
              │  Redis 7     │
              │  (VPS2)      │
              └──────────────┘

PUIS :

┌─────────────┐  1. Send message     ┌──────────────┐
│  MEMBRE A   │ ───────────────────▶│  Next.js API │
└─────────────┘                     │  /dashboard/ │
                                    │  messages    │
                                    └──────┬───────┘
                                           │
                                           │ 2. Persist + emit
                                           ▼
                                    ┌──────────────┐
                                    │  Neon DB     │
                                    │  messages    │
                                    └──────┬───────┘
                                           │
                                           │ 3. WS broadcast
                                           ▼
                                    ┌──────────────┐
                                    │  Socket.IO   │
                                    │  Server      │
                                    └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  MEMBRE B    │
                                    │  (reçoit en  │
                                    │  temps réel) │
                                    └──────────────┘
```

---

## 📦 Flux CI/CD

```
┌──────────────┐    git push main     ┌──────────────┐
│  Développeur │ ────────────────────▶│  GitHub      │
└──────────────┘                      │  Actions     │
                                      │  ci.yml      │
                                      └──────┬───────┘
                                             │
                                             │ 1. Install deps
                                             │ 2. Typecheck
                                             │ 3. Lint
                                             │ 4. Tests (vitest)
                                             │ 5. Coverage
                                             │ 6. pnpm audit
                                             │ 7. Build Docker
                                             │
                          ┌──────────────────┴──────────────────┐
                          │ PASS                                │ FAIL
                          ▼                                     ▼                          │
                  ┌──────────────┐                      ┌──────────────┐                 │
                  │  deploy.yml  │                      │  Stop        │                 │
                  │  trigger     │                      │  (Slack notif│                 │
                  └──────┬───────┘                      │   optionnel) │                 │
                         │                             └──────────────┘                 │
                         │ 1. Build image                                                          │
                         │ 2. Tag sha-{short}                                                      │
                         │ 3. Push GHCR                                                            │
                         ▼                                                                        │
                  ┌──────────────┐                                                                │
                  │  GHCR        │                                                                │
                  │  ghcr.io/    │                                                                │
                  │  digitaleflex│                                                                │
                  └──────┬───────┘                                                                │
                         │                                                                        │
                         │ 3. SSH + deploy                                                         │
                         ▼                                                                        │
                  ┌──────────────┐                       ┌──────────────┐                       │
                  │  VPS1        │                       │  VPS2        │                       │
                  │  docker pull │                       │  docker pull │                       │
                  │  restart     │                       │  restart     │                       │
                  └──────┬───────┘                       └──────┬───────┘                       │
                         │                                      │                              │
                         ▼                                      ▼                              │
                  ┌──────────────┐                       ┌──────────────┐                       │
                  │  Healthcheck │                       │  Healthcheck │                       │
                  │  /health     │                       │  /health     │                       │
                  └──────┬───────┘                       └──────┬───────┘                       │
                         │                                      │                              │
                         └──────────────┬───────────────────────┘                              │
                                        │                                                       │
                                        ▼                                                       │
                                ┌──────────────┐                                                │
                                │  Sentry      │                                                │
                                │  capture     │                                                │
                                │  any errors  │                                                │
                                └──────────────┘                                                │
                                                                                                │
   Temps total : ~10 min (premier run) / ~3 min (runs suivants)                                 │
```

---

## 🛡️ Couches de sécurité

```
┌──────────────────────────────────────────────────────────┐
│  Couche 1 — Réseau                                       │
│  • Cloudflare DDoS protection                            │
│  • Traefik TLS termination                               │
│  • Rate limiting L7                                      │
└──────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Couche 2 — Application                                  │
│  • CSP dynamique avec nonce                              │
│  • CSRF protection                                       │
│  • Headers HSTS, X-Frame, X-Content-Type                 │
│  • Rate limiting (auth, OTP, uploads)                    │
└──────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Couche 3 — Authentification                             │
│  • Better Auth (sessions httpOnly)                       │
│  • Cookies sécurisés                                    │
│  • Validation UUID path params                          │
│  • Fenêtre brute-force 2min                             │
└──────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Couche 4 — Autorisation                                │
│  • RBAC : 5 rôles, 11 permissions                       │
│  • requirePermission() sur tous les endpoints admin       │
│  • Helper validateId() sur path params                  │
└──────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Couche 5 — Validation données                          │
│  • Zod .strict() sur tous les endpoints                 │
│  • Magic bytes validation uploads                       │
│  • Anti-MIME falsification                              │
└──────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Couche 6 — Audit & Monitoring                           │
│  • Sentry error tracking                                │
│  • Audit logs avec intégrité                            │
│  • Login attempts tracking                              │
│  • Abuse catalog (30+ scénarios)                        │
└──────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Couche 7 — Données                                      │
│  • Backups B2 quotidiens                                │
│  • Auto-cleanup KYC 7j (RGPD)                           │
│  • Chiffrement at rest                                   │
│  • Hard delete users                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Inventaire des flux

| Flux | Latence cible | Fréquence | Technologie |
|---|---|---|---|
| Signal diffusion | < 30s | À la demande | BullMQ + Redis |
| Push notification | < 5s | À la demande | Web Push API |
| WebSocket message | < 100ms | En continu | Socket.IO |
| Backup B2 | Daily 2h | Cron quotidien | Cron + B2 |
| Cleanup KYC | Daily | Cron | Cron + Neon |
| Healthcheck | /health toutes les 30s | Docker HEALTHCHECK | Docker |
| Alertes Discord | < 1 min | Continue | Webhook |
| Analytics aggregation | Hourly | Cron | SQL aggregations |
| Cache purge | Sur demande | Admin UI | API |
| CI tests | < 5 min | À chaque commit | GHA |
| CI deploy | < 5 min | À chaque push main | GHA |

---

*Document confidentiel — usage strictement privé*
*Dernière mise à jour : 3 septembre 2026*