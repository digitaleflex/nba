# 🛣️ 04 — Roadmap Technique — Transformation Multi-Tenant

> **Objectif : passer de single-tenant à SaaS white-label en 4–6 semaines, 8–15k€.**
> 3 phases séquentielles, livrables testables à chaque phase.

---

## ⏱️ Vue d'ensemble

| Phase | Nom | Durée | Coût estimé | Livrable |
|-------|-----|-------|-------------|----------|
| **Phase 1** | **Multi-tenant — le socle** | 2–3 semaines | 5 000 – 8 000 € | Chaque coach a son org isolée, sous-domaines opérationnels |
| **Phase 2** | **Stripe billing par organisation** | 1–2 semaines | 2 000 – 4 000 € | Self-serve : création org → checkout → provisioning auto |
| **Phase 3** | **API publique + i18n** | 1–1,5 semaine | 1 500 – 3 000 € | Clés API org-scoped, OpenAPI, FR/EN/AR |
| **TOTAL** | | **4–6 semaines** | **8 000 – 15 000 €** | **SaaS shippable** |

> Coûts basés sur TJM freelance senior Afrique 120 000 FCFA (~183 €) à 350 €/j Europe. Hypothèse : 1 dev senior fullstack + revue.

---

## 🔧 Phase 1 — Multi-tenant (2–3 semaines) — P0 BLOQUANT

### 1.1 Schema Prisma — nouveau model `Organization`

**Fichier principal : `prisma/schema.prisma`**

```prisma
model Organization {
  id          String   @id @default(uuid()) @db.Uuid
  slug        String   @unique // ex: "coachdupont" → coachdupont.signauxx.com
  name        String
  logoUrl     String?  @map("logo_url")
  primaryColor String? @map("primary_color") // ex: "#0ea5e9"
  customDomain String? @unique @map("custom_domain") // ex: "signaux.coachdupont.com"
  status      OrganizationStatus @default(ACTIVE)
  ownerId     String   @map("owner_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  owner       User     @relation("OrgOwner", fields: [ownerId], references: [id])
  members     OrganizationMember[]
  signals     Signal[]
  subscriptionPlans SubscriptionPlan[]
  trades      Trade[]
  conversations Conversation[]
  notifications Notification[]
  // ... + JournalSession, KycDocument, BrokerVerification si scopés par org

  @@index([slug])
  @@index([ownerId])
  @@map("organizations")
}

model OrganizationMember {
  organizationId String @map("organization_id") @db.Uuid
  userId         String @map("user_id") @db.Uuid
  role           OrgRole @default(MEMBER) // OWNER, COACH, MODERATOR, MEMBER
  createdAt      DateTime @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([organizationId, userId])
  @@index([userId])
  @@index([organizationId])
  @@map("organization_members")
}

enum OrganizationStatus { ACTIVE SUSPENDED DELETED }
enum OrgRole { OWNER COACH MODERATOR MEMBER }
```

**Ajouter `organizationId` (FK, nullable pendant migration puis NOT NULL) à :**

| Model | Champ | Index |
|-------|-------|-------|
| `User` | `organizationId String? @map("organization_id") @db.Uuid` | `@@index([organizationId])` |
| `Signal` | `organizationId String @map("organization_id") @db.Uuid` | `@@index([organizationId])` + `@@index([organizationId, status])` |
| `SubscriptionPlan` | `organizationId String? @map("organization_id") @db.Uuid` | `@@index([organizationId])` — `null` = plan plateforme |
| `Conversation` | `organizationId String @map("organization_id") @db.Uuid` | `@@index([organizationId])` |
| `Notification` | `organizationId String? @map("organization_id") @db.Uuid` | `@@index([organizationId])` |
| `Trade` / `JournalSession` / `DailyReflection` / `Streak` | `organizationId String @map("organization_id") @db.Uuid` | `@@index([userId, organizationId])` |
| `KycDocument` / `BrokerVerification` | `organizationId String?` | Optionnel — si KYC par org |
| `AuditLog` / `SecurityEvent` | `organizationId String?` | Pour audit par org |

> **Migration** : créer `Organization` par défaut (ex: slug `nba`, owner = admin seed), backfiller tous les rows existants avec `organizationId = <id défaut>`, puis passer en NOT NULL. Tester rollback.

### 1.2 Middleware — résolution `orgId`

**Fichier : `src/middleware.ts`** (existant — protection routes)

Ajouter avant la logique auth :

```ts
// Résoudre org depuis host : coachdupont.signauxx.com → slug=coachdupont
// ou custom domain → lookup Organization.customDomain
// Injecter x-organization-id dans headers pour les Server Components / API routes
const org = await resolveOrganization(req.headers.get('host'));
if (org) req.headers.set('x-organization-id', org.id);
```

Fichiers touchés :
- `src/middleware.ts` — résolution org
- `src/lib/organization.ts` **(nouveau)** — `resolveOrganization()`, `requireOrganization()`, `getOrgContext()`
- `src/lib/auth/permissions.ts` — étendre `requirePermission` avec check `organizationId`

### 1.3 Sous-domaines — Traefik wildcard

**Fichiers : `compose.yml`, `compose.override.yml`, infra Traefik**

```yaml
# compose.yml — remplacer Host(`access.signauxx.com`) par HostRegexp
labels:
  - "traefik.http.routers.nba.rule=HostRegexp(`{org:[a-z0-9-]+}.signauxx.com`) || Host(`signauxx.com`) || Host(`www.signauxx.com`)"
```

Prérequis infra :
- DNS wildcard `*.signauxx.com` → IP VPS (A record)
- Cert wildcard `*.signauxx.com` via Let's Encrypt DNS-01 (Cloudflare/Route53) — Traefik `certresolver` adapté
- Variable `NEXT_PUBLIC_APP_URL` → dynamique par org (ne plus hardcoder `access.signauxx.com`)

Fichiers :
- `compose.yml` + `compose.vps2.yml`
- `traefik.yml` / `traefik/dynamic.yml` (si file provider)
- `.env.example` + `.env` (ajouter `BASE_DOMAIN=signauxx.com`)

### 1.4 Isolation — scoper toutes les queries

**Fichiers à modifier (liste exhaustive) :**

| Dossier / fichier | Action |
|-------------------|--------|
| `src/app/api/signals/*` | Ajouter `where: { organizationId: orgId }` |
| `src/app/api/messages/*` | Idem |
| `src/app/api/notifications/*` | Idem |
| `src/modules/signals/*` | Service layer — injecter `orgId` |
| `src/app/(admin)/admin/*` | Admin org-scoped + super-admin plateforme (bypass) |
| `workers/queue.ts` | Préfixer queues BullMQ par `org:{id}:` — `new Queue(org:${orgId}:signals)` |
| `workers/websocket.ts` | Rooms Socket.IO par org — `socket.join(org:${orgId})`, adapter `redis-adapter` key prefix |
| `src/lib/redis.ts` / `src/lib/cache/*` | Préfixe Redis `org:${orgId}:` |
| `src/lib/prisma.ts` | Middleware Prisma optionnel pour auto-injecter `organizationId` (défense en profondeur) |

### 1.5 Theming white-label (base)

**Nouveau : `src/lib/theme.ts` + `src/app/layout.tsx`**

- Lire `Organization.logoUrl`, `primaryColor` côté serveur, injecter CSS variables `--org-primary`.
- Composant `<OrgTheme org={org}>` qui surcharge le design system.

### ✅ Critères de sortie Phase 1

- [ ] 2 orgs de test (`alpha.signauxx.localhost`, `beta.signauxx.localhost`) avec données isolées — un signal créé dans alpha n'apparaît pas dans beta
- [ ] Tests d'isolation automatisés : `pnpm test` inclut `organization-isolation.test.ts`
- [ ] Sous-domaines wildcard fonctionnels en staging
- [ ] Migration Prisma appliquée en prod avec 0 downtime (backfill + switch)

---

## 💳 Phase 2 — Stripe Billing par Organisation (1–2 semaines) — P0

### 2.1 Dépendances

```bash
pnpm add stripe @stripe/stripe-js
```

### 2.2 Schema — abonnements org

**Fichier : `prisma/schema.prisma` — ajouter :**

```prisma
model OrganizationSubscription {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @unique @map("organization_id") @db.Uuid
  stripeCustomerId String? @unique @map("stripe_customer_id")
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  stripePriceId  String?  @map("stripe_price_id")
  tier           SaasTier // STARTER, PRO, SCALE, ENTERPRISE
  status         SaasSubStatus // ACTIVE, PAST_DUE, CANCELED, TRIALING
  currentPeriodEnd DateTime? @map("current_period_end")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@index([stripeCustomerId])
  @@map("organization_subscriptions")
}

enum SaasTier { STARTER PRO SCALE ENTERPRISE }
enum SaasSubStatus { ACTIVE PAST_DUE CANCELED TRIALING INCOMPLETE }
```

### 2.3 Routes Stripe

| Route | Fichier | Rôle |
|-------|---------|------|
| `POST /api/orgs` | `src/app/api/orgs/route.ts` **(nouveau)** | Créer org (slug, name) — auth required |
| `POST /api/orgs/[orgId]/checkout` | `src/app/api/orgs/[orgId]/checkout/route.ts` | Créer Stripe Checkout Session (price selon tier) |
| `POST /api/orgs/[orgId]/portal` | `src/app/api/orgs/[orgId]/portal/route.ts` | Créer Customer Portal Session |
| `POST /api/webhooks/stripe` | `src/app/api/webhooks/stripe/route.ts` **(nouveau)** | Gérer `checkout.session.completed`, `customer.subscription.*`, `invoice.paid/failed` |
| `GET /api/orgs/[orgId]/subscription` | `src/app/api/orgs/[orgId]/subscription/route.ts` | Statut abonnement courant |

**Fichier lib : `src/lib/stripe.ts` (nouveau)** — client Stripe server-side, helpers `createCustomer`, `createCheckout`, `createPortal`.

### 2.4 Gating — bloquer l'accès si subscription inactive

- Middleware : si `OrganizationSubscription.status != ACTIVE` et route != `/billing` → redirect `/billing`
- Hook `useSubscription()` côté client pour afficher bannière "Paiement en échec"

### 2.5 Onboarding self-serve

**Fichier : `src/app/(onboarding)/create-org/page.tsx` (nouveau)**

Flow : `Inscription → Créer mon espace (nom + slug) → Choisir offre (Starter/Pro/Scale) → Stripe Checkout → Webhook → provisioning → redirect vers {slug}.signauxx.com/dashboard`

### ✅ Critères de sortie Phase 2

- [ ] Création org + checkout E2E testée en mode Stripe test
- [ ] Webhooks Stripe rejouables (DLQ existante réutilisée)
- [ ] Customer Portal accessible depuis settings org
- [ ] Gating fonctionnel : org sans abonnement actif = accès limité

---

## 🔌 Phase 3 — API Publique + i18n (1–1,5 semaine) — P1

### 3.1 API publique versionnée

**Base : `src/app/api/v1/*` (nouveau namespace)**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/signals` | GET, POST | Lister / créer signaux (org-scoped) |
| `/api/v1/signals/[id]` | GET, PATCH, DELETE | CRUD signal |
| `/api/v1/members` | GET | Lister membres de l'org |
| `/api/v1/trades` | GET, POST | Journal — trades |
| `/api/v1/webhooks` | POST | Enregistrer webhook org (URL + events) |

**Fichiers :**
- `src/app/api/v1/*` — routes versionnées
- `src/lib/api-keys.ts` **(nouveau)** — model `ApiKey { id, organizationId, keyHash, prefix: "sk_live_...", lastUsedAt }`, génération `sk_live_` + hash bcrypt, middleware auth par header `Authorization: Bearer sk_live_...`
- `prisma/schema.prisma` — ajouter `model ApiKey`
- `src/lib/rate-limit.ts` — rate limiting **par org + par clé** (ex: 100 req/min/org)
- `docs/04-api/openapi.yaml` — spec OpenAPI 3.1, servir via `swagger-ui-react` déjà installé
- `src/lib/webhooks.ts` — dispatcher webhooks org (BullMQ job `webhook:dispatch`)

### 3.2 i18n

**Dépendance : `next-intl` (recommandé pour Next.js 16 App Router)**

```bash
pnpm add next-intl
```

**Fichiers :**
- `src/i18n.ts` + `src/middleware.ts` (ajouter matcher `/:locale/*`)
- `messages/fr.json`, `messages/en.json`, `messages/ar.json` — extraire strings FR actuelles
- `next.config.ts` — plugin `next-intl`
- Migration progressive : FR par défaut, EN en Phase 3, AR en follow-up (RTL à prévoir)

### ✅ Critères de sortie Phase 3

- [ ] `curl -H "Authorization: Bearer sk_live_..." https://alpha.signauxx.com/api/v1/signals` → 200 org-scoped
- [ ] OpenAPI disponible sur `/docs` par org
- [ ] Switch langue FR/EN fonctionnel (middleware + cookie `NEXT_LOCALE`)
- [ ] Rate limiting par org vérifié (429 au-delà du quota)

---

## 📦 Fichiers à modifier — récapitulatif global

| # | Fichier | Phase | Type |
|---|---------|-------|------|
| 1 | `prisma/schema.prisma` | 1, 2, 3 | Modif + migration |
| 2 | `prisma/migrations/*` | 1, 2, 3 | Nouvelles migrations |
| 3 | `src/middleware.ts` | 1, 3 | Modif |
| 4 | `src/lib/organization.ts` | 1 | **Nouveau** |
| 5 | `src/lib/stripe.ts` | 2 | **Nouveau** |
| 6 | `src/lib/api-keys.ts` | 3 | **Nouveau** |
| 7 | `src/lib/theme.ts` | 1 | **Nouveau** |
| 8 | `src/lib/redis.ts` | 1 | Modif (préfixe) |
| 9 | `src/lib/rate-limit.ts` | 3 | Modif (par org) |
| 10 | `src/app/api/orgs/*` | 2 | **Nouveau** |
| 11 | `src/app/api/webhooks/stripe/*` | 2 | **Nouveau** |
| 12 | `src/app/api/v1/*` | 3 | **Nouveau** |
| 13 | `src/app/(onboarding)/create-org/*` | 2 | **Nouveau** |
| 14 | `src/modules/signals/*` | 1 | Modif (orgId) |
| 15 | `workers/queue.ts` | 1 | Modif (namespacing) |
| 16 | `workers/websocket.ts` | 1 | Modif (rooms par org) |
| 17 | `compose.yml` / `compose.vps2.yml` | 1 | Modif (wildcard) |
| 18 | `traefik.yml` | 1 | Modif (wildcard cert) |
| 19 | `next.config.ts` | 3 | Modif (next-intl) |
| 20 | `src/i18n.ts` + `messages/*` | 3 | **Nouveau** |
| 21 | `.env.example` | 1, 2 | Modif (BASE_DOMAIN, STRIPE_*) |
| 22 | `src/app/(admin)/admin/*` | 1 | Modif (super-admin vs org-admin) |

---

## 💰 Budget détaillé

| Poste | Jours | TJM 250 € | TJM 350 € |
|-------|-------|-----------|-----------|
| Phase 1 — Multi-tenant | 10–15 j | 2 500 – 3 750 € | 3 500 – 5 250 € |
| Phase 2 — Stripe billing | 5–10 j | 1 250 – 2 500 € | 1 750 – 3 500 € |
| Phase 3 — API + i18n | 5–7 j | 1 250 – 1 750 € | 1 750 – 2 450 € |
| QA + tests isolation + staging | 3–5 j | 750 – 1 250 € | 1 050 – 1 750 € |
| **TOTAL** | **23–37 j** | **5 750 – 9 250 €** | **8 050 – 12 950 €** |
| Marge imprévus 15 % | | +862 – 1 387 € | +1 207 – 1 942 € |
| **TOTAL avec marge** | | **6 612 – 10 637 €** | **9 257 – 14 892 €** |

> **Fourchette pitch : 8 000 – 15 000 €** — couvre les deux hypothèses TJM.

---

## ⚠️ Risques techniques & mitigations

| Risque | Mitigation |
|--------|------------|
| Migration Prisma casse la prod | Migration en 2 temps : colonnes nullable + backfill + contrainte NOT NULL ; test sur clone Neon branch |
| Fuite inter-tenant | Tests d'isolation automatisés + middleware Prisma + revue systématique des `where` |
| Wildcard cert échec | Valider DNS-01 en staging avant prod ; garder `access.signauxx.com` en fallback |
| Stripe webhooks perdus | Réutiliser `WebhookDlq` existante + retry BullMQ + endpoint idempotent (par `svixId`) |

---

*Roadmap estimée le 6 septembre 2026 — base : schema.prisma 1 129 lignes, 603 fichiers, infra Traefik + Neon + Redis existante.*
