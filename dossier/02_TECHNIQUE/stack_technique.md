# 🔧 Stack technique complète

## Vue d'ensemble

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| **Runtime** | Next.js | 16.2.12 | Framework fullstack |
| **Langage** | TypeScript | 5.x | Typage statique |
| **UI** | React | 19.x | Composants |
| **Styling** | Tailwind CSS | 4.3.3 | Utility-first CSS |
| **UI Kit** | Radix / Base UI | 1.6+ | Composants accessibles |
| **Charts** | Recharts | dernière | Dataviz admin |
| **Icons** | lucide-react | 1.28 | Icônes SVG |
| **Toasts** | sonner | 2.0.7 | Notifications |
| **Animations** | motion (Framer) | 12.43 | Micro-interactions |
| **Forms** | react-hook-form + zod | dernière | Validation forms |

## Backend & data

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| **ORM** | Prisma | 7.9.1 | ORM + migrations |
| **DB** | PostgreSQL (Neon serverless) | 16 | Base principale |
| **DB adapter** | @prisma/adapter-pg | 7.9 | Connexion Neon |
| **Cache/Queue** | Redis + ioredis | 5.11 | Job store |
| **Queue** | BullMQ | 5.79 | Jobs async |
| **Queue UI** | bull-board | 8.4 | Monitoring |
| **Auth** | Better Auth | 1.6.25 | Sessions + OAuth-ready |
| **Email** | Resend | dernière | Transactionnel |
| **Validation** | Zod | dernière | Schémas API |
| **Storage** | AWS S3 SDK | 3.1100 | Fichiers KYC/signaux |

## Realtime & push

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| **WebSocket** | Socket.IO | 4.x | Realtime |
| **WS adapter** | @socket.io/redis-adapter | 8.3 | Scale multi-instance |
| **Push web** | Web Push API | native | Notifications PWA |
| **PWA** | service worker custom | — | Offline + install |

## Infra & ops

| Couche | Technologie | Rôle |
|---|---|---|
| **Container app** | Docker multi-stage | Build production |
| **Container worker** | Dockerfile.worker | Worker seul |
| **Orchestration** | Docker Compose | Local + VPS |
| **Reverse proxy** | Traefik | Routage + TLS |
| **VPS app** | VPS1 (Hetzner/OVH) | Next.js prod |
| **VPS worker** | VPS2 (séparé) | Worker + Redis |
| **Réseau privé** | Tailscale | Interconnexion VPS |
| **Registre images** | GitHub Container Registry | ghcr.io |
| **CI/CD** | GitHub Actions | Tests + build + deploy |
| **Monitoring** | Sentry | 10.69 |
| **Backup** | Backblaze B2 | Cron quotidien |
| **Alertes** | Discord webhook | Mémoire + backups |
| **Process mgr** | PM2 | Keep-alive (legacy) |

## Tests & qualité

| Couche | Technologie | Version |
|---|---|---|
| **Tests unit/intégration** | Vitest | 3.x |
| **Coverage** | @vitest/coverage | — |
| **Linter** | ESLint + eslint-config-next | 16.2.12 |
| **Typecheck** | TypeScript strict | 5.x |
| **Audit** | pnpm audit | clean |

## Sécurité

| Mesure | Statut |
|---|---|
| CSP dynamique avec nonce | ✅ v2.5.0 |
| HSTS | ✅ |
| X-Frame-Options | ✅ |
| X-Content-Type-Options | ✅ |
| Rate-limiting (auth/OTP/uploads) | ✅ |
| CSRF (Better Auth) | ✅ |
| Cookies sécurisés (httpOnly, secure, sameSite) | ✅ |
| Magic bytes validation (uploads) | ✅ |
| Audit logs avec intégrité | ✅ |
| Anti-fraude (doublons nom/email/IP) | ✅ |
| RBAC granulaire (5 rôles, 11 permissions) | ✅ |
| 0 vulnérabilité npm audit | ✅ |
| Backups quotidiens B2 | ✅ |
| TLS via Traefik | ✅ |

## Packages notables

| Package | Usage |
|---|---|
| `@fingerprintjs/fingerprintjs` | Anti-fraude device fingerprint |
| `@bull-board/express` | UI admin BullMQ |
| `howler` | Sons notifications trading |
| `driver.js` | Onboarding guidé |
| `class-variance-authority` | Variants UI |
| `clsx` | Conditional className |
| `knip` | Détection code mort |

## Versions majeures (évolution)

| Date | Version | Changement |
|---|---|---|
| 27 juin 2026 | Next.js 14 → 15 (init) | Scaffold |
| 22 juillet 2026 | Prisma 7.x | Migration majeure |
| 22 juillet 2026 | better-auth 1.6.20 → 1.6.23 | Patchs sécu |
| 27 juillet 2026 | Prisma 7.8 → 7.9 | Patchs |
| 27 juillet 2026 | @sentry/nextjs 10.63 → 10.68 | Patchs |
| 31 juillet 2026 | better-auth 1.6.25 | Patchs |
| 31 juillet 2026 | sonner 1.7.4 → 2.0.7 | Major |
| 31 juillet 2026 | tailwindcss 4.3.3 | Patchs |
| 3 août 2026 | lucide-react 0.400 → 1.28 | Major |
| 3 août 2026 | @bull-board/express 8.1 → 8.4 | Minor |
| 3 août 2026 | @sentry/nextjs 10.69 | Patch |
| 3 août 2026 | motion 11 → 12 | Major |
| 31 août 2026 | Next.js 16.2.12, sharp 0.35.4 | Patchs (v2.5.0) |

---

## 📐 Architecture en production

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
│                  (Cloudflare + DNS)                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  TRAEFIK (reverse proxy)                    │
│              • TLS termination                              │
│              • Rate limit L7                                │
│              • Routage par host                             │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
   signauxx.com                  access.signauxx.com
             │                            │
             ▼                            ▼
   ┌────────────────────┐      ┌──────────────────────┐
   │  VPS1 — Next.js     │      │  Bull Board (admin)  │
   │  • App Next.js 16   │      │  Queue monitoring    │
   │  • WebSocket        │      └──────────┬───────────┘
   │  • Standalone       │                 │
   │  • 4 GB RAM         │                 │
   └──────┬──────────────┘                 │
          │ Tailscale VPN                   │
          │                               │
          ▼                               ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    VPS2 — Worker                          │
   │  • Worker Node.js (BullMQ consumer)                      │
   │  • Redis (auth Tailscale)                                │
   │  • Cron jobs (backup B2, alertes Discord)                │
   │  • Notification sender (email + push)                   │
   └────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
   ┌──────────────────────────────────────────────────────────┐
   │              Neon PostgreSQL (serverless)                │
   │  • 42 tables                                             │
   │  • Pooler connection                                     │
   │  • Backups automatiques (Neon)                          │
   └──────────────────────────────────────────────────────────┘
                            │
                            ▼
   ┌──────────────────────────────────────────────────────────┐
   │                  Services externes                        │
   │  • Resend (email transactionnel)                         │
   │  • Sentry (error tracking)                               │
   │  • Backblaze B2 (backup fichiers)                       │
   │  • GitHub Container Registry (images)                    │
   └──────────────────────────────────────────────────────────┘
```

---

*Document confidentiel — usage strictement privé*