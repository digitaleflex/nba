# Architecture Système

> **Version :** 2.0
> **Statut :** Approved
> **Dernière mise à jour :** Juillet 2026
> **Domaine de prod :** `access.signauxx.com`

---

## 1. Vue d'ensemble

NeverBrokeAgain (NBA) est un **monolithe modulaire** Next.js 16 déployé sur **deux VPS** reliés via **Tailscale** (mesh privé). Le frontend, l'API et le reverse-proxy Traefik sont sur VPS1, le worker BullMQ est isolé sur VPS2.

```text
                         Internet
                             │
                       Cloudflare CDN/Proxy
                             │ (HTTPS + WAF)
                             ▼
   ┌──────────────────────── VPS1 (audit@axiom) ───────────────────────┐
   │  Tailscale: 100.122.171.84                                       │
   │                                                                  │
   │     ┌──────────────── Traefik (reverse proxy) ──────────────┐    │
   │     │                                                        │    │
   │     ▼                                                        │    │
   │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │    │
   │  │  NBA App     │    │  nba-redis   │    │  storage/    │    │    │
   │  │  (Next.js 16)│◀──▶│  (Valkey 8)  │    │  (KYC,       │    │    │
   │  │  2 CPU 4GB   │    │  0.5 CPU     │    │   broker)    │    │    │
   │  │              │    │  256MB       │    │              │    │    │
   │  └──────┬───────┘    └──────▲───────┘    └──────────────┘    │    │
   │         │                   │                                │    │
   └─────────┼───────────────────┼────────────────────────────────┘    │
             │                   │                                     │
   ┌─────────┼───────────────────┼──────── Tailscale mesh ──────────┐
   │         │                   │                                   │
   │  ┌──────┴──────────────────────────────────────────┐            │
   │  │  VPS2 (72.61.90.216 — phanthome)               │            │
   │  │  Tailscale: 100.75.74.21                      │            │
   │  │                                               │            │
   │  │  ┌────────────────────────────────────┐       │            │
   │  │  │  NBA Worker (BullMQ)                │       │            │
   │  │  │  2 CPU 1GB                         │       │            │
   │  │  │                                    │       │            │
   │  │  │  • file-cleanup                    │       │            │
   │  │  │  • notification-delivery           │       │            │
   │  │  │  • signal-distribution             │       │            │
   │  │  │  • B2 backup cron (daily 2h)       │       │            │
   │  │  └────────────────────────────────────┘       │            │
   │  └───────────────────────────────────────────────┘            │
   └────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌────────────────────┐
                          │  Neon PostgreSQL   │
                          │  (cloud, pooled)   │
                          └────────────────────┘
                                    │
                                    ▼
                          ┌────────────────────┐
                          │  Backblaze B2      │
                          │  (backups daily)   │
                          └────────────────────┘
```

---

## 2. VPS1 — Application + Redis

| Ressource | Valeur |
|-----------|--------|
| Hostname | `audit@axiom` (alias `vps1-nba`) |
| IP publique | (configurée par hébergeur) |
| IP Tailscale | `100.122.171.84` |
| CPU | 2 cores |
| RAM totale | 7.8 GB |
| RAM app | 4 GB (limite Docker) |
| RAM Redis | 256 MB |
| Stockage | 50 GB NVMe |

**Conteneurs** :
- `nba-app-1` : Next.js 16, port 3000
- `nba-nba-redis-1` : Valkey 8 (port 6379, bind 0.0.0.0)
- (réseau `proxy` partagé pour Traefik)

---

## 3. VPS2 — Worker BullMQ

| Ressource | Valeur |
|-----------|--------|
| Hostname | `phant home` (alias `vps2-nba`) |
| IP publique | `72.61.90.216` |
| IP Tailscale | `100.75.74.21` |
| CPU | 2 cores |
| RAM | 1 GB (limite Docker) |
| Stockage | 50 GB NVMe |

**Conteneurs** :
- `nba-app-worker-1` : image `ghcr.io/digitaleflex/nba-worker:latest`

---

## 4. Réseau privé Tailscale

Les deux VPS sont reliés via **Tailscale** (mesh WireGuard). Avantages :
- Pas besoin d'exposer Redis sur Internet (sécurité)
- Latence minimale (P2P)
- Configuration zéro
- Authentification par clé réutilisable

**IP Tailscale** :
- VPS1 : `100.122.171.84`
- VPS2 : `100.75.74.21`

**ACLs** : par défaut, tous les appareils de l'utilisateur peuvent se parler. À durcir via https://login.tailscale.com/admin/acls/file pour restreindre.

---

## 5. Stack technique

### Frontend
- Next.js 16 (App Router, standalone build)
- React 19
- TypeScript strict
- Tailwind CSS + design-system custom (packages/design-system)
- lucide-react (icônes)

### Backend
- Next.js Route Handlers (`src/app/api/**`)
- Server Actions
- Better Auth (sessions JWT-like + cookies)
- Prisma 6.x (ORM)
- BullMQ 5.x (file de jobs)

### Base de données
- **PostgreSQL** (Neon, pooled connection)
- Schéma : 17 tables (User, Session, Account, Role, Permission, AccessRequest, Signal, Notification, etc.)

### Cache & Queue
- **Redis/Valkey 8** (cache + broker BullMQ)
- 3 files : `file-cleanup`, `notification-delivery`, `signal-distribution`

### Stockage fichiers
- Local (`/app/storage/{kyc,broker,signals}`)
- Magic bytes validation (anti-mismatch MIME)
- Limite 50 Mo par fichier
- Purge auto via BullMQ (7j après review KYC/Broker)

### Email
- Resend (transactionnel uniquement)
- Templates : OTP email, KYC approval/rejection, broker approval/rejection, access approval/rejection, signal published

### Auth
- Better Auth + Prisma adapter
- Cookies HttpOnly, Secure, SameSite
- 5 rôles : SUPER_ADMIN, ADMIN, KYC_AGENT, SUPPORT_AGENT, MEMBER
- 11 permissions granulaires

---

## 6. Flux de données

```text
User
  ↓
Traefik (HTTPS, rate limit Cloudflare)
  ↓
Next.js App (VPS1)
  ↓
Better Auth (session check)
  ↓
Route Handler / Server Action
  ↓
Service Layer
  ↓
Repository (Prisma)
  ↓
Neon PostgreSQL
```

Pour les actions asynchrones (notifications, scheduled signals, file cleanup) :
```text
Service → BullMQ add() → Redis → Worker (VPS2) → Resend / Prisma / Storage
```

---

## 7. Couches applicatives

| Couche | Responsabilité | Règle |
|--------|----------------|-------|
| Presentation | Pages, composants, forms, UI state | Pas de logique métier ni DB |
| Application | Use cases, workflows, transactions | Appelle repositories + services |
| Domain | Business rules, entités | Indépendant des frameworks |
| Infrastructure | Prisma, Redis, BullMQ, Resend, Storage | Détails techniques |

---

## 8. Modules

```text
src/modules/
├── auth/         (Better Auth config)
├── members/      (User, Account, Session)
├── plans/        (SubscriptionPlan, AccessRequest)
├── kyc/          (KycDocument)
├── broker/       (BrokerVerification)
├── signals/      (Signal, SignalVersion, SignalRead, SignalFavorite, SignalArchive)
├── notifications/(Notification, NotificationDelivery)
├── admin/        (AuditLog, settings)
└── audit/        (audit helpers)
```

---

## 9. Sécurité

| Mesure | Implémentation |
|--------|----------------|
| HTTPS | Cloudflare (proxied) + Traefik |
| Cookies | HttpOnly, Secure, SameSite=Lax |
| CSRF | Better Auth |
| Rate limiting | Better Auth (5/min sur sign-in) + custom sur uploads (5/h) |
| RBAC | 5 rôles × 11 permissions |
| Auth API | `requirePermission()` ou `requireRole()` sur toutes routes admin |
| Mots de passe | hashés via Better Auth (scrypt) |
| Fichiers | Magic bytes validation, limite taille, MIME whitelist |
| Données sensibles | Jamais dans les logs, jamais en clair |

---

## 10. Capacité

| Action | Concurrent | Raison |
|--------|------------|--------|
| Inscription (form) | 80-120 | Léger |
| Vérification OTP | 80-120 | Très léger |
| KYC (upload images) | 30-50 | Mémoire + I/O |
| Broker (upload vidéo) | 15-25 | Très lourd (50 Mo/fichier) |

---

## 11. Backups

- **Quotidien 2h** (cron) sur VPS2
- Dump PostgreSQL (pg_dump format custom)
- Archive `storage/` (KYC, broker, signals)
- `.env` (sans les secrets)
- Upload vers **Backblaze B2** (`nba-backups` bucket)
- **Alerte email** automatique via Resend en cas d'échec (à `admin@signauxx.com`)

Rétention : indéfinie sur B2 (configurable via lifecycle policy).
