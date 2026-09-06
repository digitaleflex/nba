# 🏗️ 05 — Architecture Cible Multi-Tenant

> **Cible : une codebase, N organisations isolées, sous-domaines, queues namespacées, theming white-label.**
> Stratégie : **single database, shared schema, `organizationId` discriminant** (row-level isolation) — le meilleur compromis coût/isolation pour 10–500 orgs.

---

## 🧭 Principes

| Principe | Choix | Pourquoi |
|----------|-------|----------|
| **Isolation** | Shared DB + `organizationId` sur chaque table métier (discriminant) | Simple, 1 migration, pas de N databases à opérer ; Neon scale verticalement |
| **Résolution tenant** | Host header (`{slug}.signauxx.com` ou `customDomain`) → `Organization` lookup | Middleware Next.js, pas de header custom à gérer côté client |
| **Sous-domaines** | Wildcard `*.signauxx.com` + Traefik HostRegexp + cert wildcard DNS-01 | 1 cert, N orgs, pas de config par org |
| **Queues & cache** | Préfixe Redis `org:{id}:` + BullMQ queues namespacées + Socket.IO rooms par org | Isolation sans N Redis |
| **Auth** | User peut appartenir à N orgs via `OrganizationMember` (rôle par org) | Coach multi-org possible, membre mono-org par défaut |
| **Billing** | 1 `OrganizationSubscription` par org (Stripe Customer + Subscription) | Facturation org-scoped, pas user-scoped |

---

## 🌐 Diagramme ASCII — architecture cible

```
                         ┌─────────────────────────────────────────────────┐
                         │                  Internet                        │
                         └──────────────┬──────────────────────────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   Cloudflare DNS    │
                              │  *.signauxx.com  A  │  + domaine custom coach
                              │  signauxx.com    A  │    (CNAME → cname.signauxx.com)
                              └─────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  Traefik (edge)     │
                              │  HostRegexp         │
                              │  {org}.signauxx.com │
                              │  + wildcard TLS     │
                              │  *.signauxx.com     │
                              │  (DNS-01 LE)        │
                              └─────────┬──────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
           ┌────────▼────────┐  ┌──────▼───────┐   ┌──────▼───────┐
           │  Next.js App    │  │  Worker VPS2 │   │  Redis (cache│
           │  (VPS1)         │  │  BullMQ +    │   │   + BullMQ  │
           │                 │  │  WebSocket   │   │   + pub/sub) │
           │  middleware.ts  │◄─┤  (Tailscale) │◄──┤              │
           │  resolve org    │  │  queues      │   │  org:{id}:*  │
           │  x-org-id header│  │  org:{id}:*  │   │  prefix      │
           │                 │  │              │   │              │
           │  ┌───────────┐  │  │  Socket.IO   │   │              │
           │  │  Prisma   │──┼──┼──────────────┼──►│              │
           │  │  + RLS    │  │  │  rooms       │   │              │
           │  │  orgId    │  │  │  org:{id}    │   │              │
           │  └─────┬─────┘  │  └──────────────┘   └──────────────┘
           │        │        │
           └────────┼────────┘
                    │
           ┌────────▼────────┐
           │  PostgreSQL     │
           │  Neon           │
           │  ┌───────────┐  │
           │  │organizations│ │
           │  │members      │ │
           │  │signals      │ │  WHERE organization_id = $orgId
           │  │plans        │ │  sur chaque table métier
           │  │trades       │ │
           │  │conversations│ │
           │  │...          │ │
           │  └───────────┘  │
           └─────────────────┘
                    │
           ┌────────▼────────┐
           │  Stripe         │
           │  Customer/      │
           │  Subscription   │
           │  par org        │
           │  webhooks →     │
           │  /webhooks/stripe│
           └─────────────────┘
                    │
           ┌────────▼────────┐
           │  S3 / B2        │
           │  org/{id}/      │
           │  prefix         │
           │  (KYC, images)  │
           └─────────────────┘
```

---

## 🔐 Isolation données — comment on évite les fuites

### 1. Niveau applicatif (principal)

```ts
// Helper central — toute query passe par ici
export function orgWhere(orgId: string) {
  return { organizationId: orgId };
}

// Usage
await prisma.signal.findMany({
  where: { ...orgWhere(orgId), status: 'PUBLISHED' }
});
```

**Règle d'or** : aucun `prisma.*.find*` sans `organizationId` sur les tables scopées. Vérifié par :
- Revue code systématique
- Test d'isolation : créer 2 orgs, vérifier qu'aucune query ne retourne de données cross-org
- Middleware Prisma optionnel (défense en profondeur) :

```ts
prisma.$use(async (params, next) => {
  if (params.model && SCOPED_MODELS.includes(params.model)) {
    params.args.where = { ...params.args.where, organizationId: getOrgContext() };
  }
  return next(params);
});
```

### 2. Niveau base de données (ceinture + bretelles)

- Index composite `@@index([organizationId, status])`, `@@index([organizationId, createdAt])` pour perfs
- Contrainte FK `organizationId → organizations.id`
- Optionnel : Row Level Security (RLS) Postgres — politique `USING (organization_id = current_setting('app.org_id')::uuid)` pour les connexions directes

### 3. Niveau cache & queues

| Système | Isolation |
|---------|-----------|
| **Redis cache** | Clés préfixées `org:{id}:signals:list`, `org:{id}:user:{userId}:...` |
| **BullMQ** | Queues `org:{id}:signals:dispatch`, `org:{id}:emails`, `org:{id}:webhooks` |
| **Socket.IO** | Rooms `org:{id}`, `org:{id}:signals`, `org:{id}:conversation:{convId}` — `socket.join(org:${orgId})` + `io.to(org:${orgId}).emit(...)` |
| **S3 / B2** | Prefix `org/{id}/kyc/`, `org/{id}/signals/` — policy par préfixe |

### 4. Niveau domaine & theming

```
coachdupont.signauxx.com  → Organization.slug = "coachdupont"
signaux.coachdupont.com   → Organization.customDomain = "signaux.coachdupont.com"
signauxx.com              → landing plateforme (pas d'org)
```

Middleware résout `host` → `Organization` → injecte `x-organization-id` → Server Components lisent `org.logoUrl`, `org.primaryColor` → CSS variables `--org-primary`.

---

## 🔑 Modèle de données — extrait cible

```
User ──< OrganizationMember >── Organization ──< Signal
 │                                    ├──< SubscriptionPlan
 │                                    ├──< Conversation ──< Message
 │                                    ├──< Notification
 │                                    ├──< Trade / JournalSession
 │                                    └──< OrganizationSubscription (Stripe)
 │
 ├──< Device, Session, AuditLog (avec organizationId)
 └──< KycDocument (optionnel par org)
```

**Tables scopées par `organizationId` (obligatoire) :**
`Signal, SignalAudience, SubscriptionPlan, Conversation, Message, Notification, Trade, JournalSession, DailyReflection, Streak`

**Tables avec `organizationId` nullable (contexte plateforme) :**
`User` (user peut exister sans org avant création), `AuditLog`, `SecurityEvent`, `KycDocument`

**Tables plateforme (pas scopées) :**
`Organization`, `OrganizationMember`, `OrganizationSubscription`, `Setting` (ou `Setting` scopé si settings par org)

---

## 📡 Flux temps réel par organisation

```
[Admin coach A publie signal]
        │
        ▼
  POST /api/signals { orgId: A }
        │
        ▼
  BullMQ job → queue "org:A:signals:dispatch"
        │
        ├─► Résoudre audience (SignalAudience → plans de l'org A)
        ├─► Créer Notification pour chaque membre de l'org A
        ├─► Push Resend / web-push (filtré org A)
        └─► Socket.IO emit → room "org:A:signals"
                              │
                              ▼
                    Clients connectés à A reçoivent en live
                    Clients de B : rien (room différente)
```

---

## 🔒 Sécurité — checklist multi-tenant

| Mesure | Statut cible | Détail |
|--------|--------------|--------|
| `organizationId` sur toutes les queries métier | 🔲 Phase 1 | Helper `orgWhere()` + revue |
| Tests isolation inter-tenant | 🔲 Phase 1 | 2 orgs + assertions cross-org = 0 rows |
| Middleware Prisma RLS | 🟡 Optionnel | Défense en profondeur |
| Rate limiting par org | 🔲 Phase 3 | `rateLimit(orgId + apiKey)` |
| Clés API org-scoped (`sk_live_*`) | 🔲 Phase 3 | Hash + prefix, `ApiKey` table |
| Audit logs avec `orgId` | 🔲 Phase 1 | Filtre admin par org |
| CSP nonce (existant) | ✅ Déjà fait | Conserver |
| Domaine custom — vérification DNS | 🔲 Phase 1 | TXT record `_signauxx-challenge` ou CNAME |
| RGPD — export/suppression par org | 🔲 Phase 1 | `DELETE /api/orgs/[id]/gdpr/export` |

---

## 📈 Scalabilité

| Palier | Orgs | Membres totaux | DB | Redis | Action |
|--------|------|----------------|----|-------|--------|
| **Lancement** | 1–20 | 500–2 000 | Neon scale 0,5–2 CU | 1 instance 256 MB | Aucune |
| **Croissance** | 20–100 | 2k–20k | Neon 2–4 CU + read replica | Redis 1 GB + persistence | Monitor `pg_stat` |
| **Échelle** | 100–500 | 20k–100k | Neon 4–8 CU, partition `signals` par `organizationId` si besoin | Redis cluster | Sharding BullMQ par org |

> Pas de prématurisation : le shared schema tient 500 orgs sans sharding. Le jour où 1 org fait 50k signaux, on partitionne cette table.

---

## 🧩 Dépendances infra à prévoir

| Besoin | Solution | Coût |
|--------|----------|------|
| Wildcard TLS `*.signauxx.com` | Let's Encrypt DNS-01 via Cloudflare API + Traefik | 0 € (automatique) |
| DNS wildcard | Cloudflare : `A *.signauxx.com → VPS IP` | Inclus |
| Domaine custom coach | CNAME `signaux.coach.com → cname.signauxx.com` + vérif | 0 € |
| Neon branching (test migration) | `neon branches create` | Inclus |
| Redis namespacing | Config `keyPrefix` ioredis | 0 € |

---

*Architecture validée le 6 septembre 2026 — cible : single DB shared schema, isolation par `organizationId`, wildcard sous-domaines, queues/rooms namespacées. Évolutive vers RLS / sharding si >500 orgs.*
