# 📐 Architecture Decision Records (ADR)

> **Documents justifiant les choix techniques majeurs** du projet SignauxX.
> Indispensables pour qu'un repreneur comprenne le "pourquoi" de chaque décision.

---

## 📋 SOMMAIRE

1. [ADR-001 — Next.js 16 (App Router)](#adr-001--nextjs-16)
2. [ADR-002 — Prisma 7 comme ORM](#adr-002--prisma-7)
3. [ADR-003 — Neon serverless comme base de données](#adr-003--neon-serverless)
4. [ADR-004 — Architecture multi-VPS](#adr-004--multi-vps)
5. [ADR-005 — BullMQ pour jobs async](#adr-005--bullmq)
6. [ADR-006 — Better Auth pour l'authentification](#adr-006--better-auth)

---

## ADR-001 — Next.js 16 (App Router)

**Statut** : ✅ Accepté (25 juin 2026)  
**Dernière révision** : 31 août 2026

### Contexte

Le projet nécessite un framework fullstack capable de gérer :
- Rendu serveur (SEO, performance)
- API routes
- WebSocket
- Streaming responses
- Déploiement containerisé

### Décision

Adoption de **Next.js 16 avec App Router** comme framework principal.

### Alternatives considérées

| Alternative | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **Next.js 16** | Écosystème, App Router, RSC, déploiement simple | Complexité croissante | ✅ Choisi |
| Remix | Excellent data-loading, web standards | Écosystème plus petit | ❌ |
| SvelteKit | Perfo, simplicité | Communauté jeune, peu de libs UI | ❌ |
| NestJS + React séparé | Architecture enterprise | Double déploiement | ❌ |

### Conséquences

**Positives** :
- Un seul codebase pour frontend + backend
- Server Components pour les perfs
- Vercel-compatible (mais déployé sur VPS)
- API Routes intégrées

**Négatives** :
- Courbe d'apprentissage pour App Router
- Breaking changes fréquents (Next 14 → 15 → 16)
- Middleware limité (proxy.ts introduit tard)

### Notes

- Migration Next 15 → 16 réalisée en juillet 2026
- Standalone output activé pour Docker

---

## ADR-002 — Prisma 7

**Statut** : ✅ Accepté (25 juin 2026)  
**Dernière révision** : 27 juillet 2026 (upgrade 7.8 → 7.9)

### Contexte

Le projet nécessite un ORM avec :
- TypeScript-first
- Migrations versionnées
- Support PostgreSQL + Neon
- Bonne DX

### Décision

Adoption de **Prisma 7** comme ORM principal avec schema déclaratif.

### Alternatives considérées

| Alternative | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **Prisma 7** | Schema déclaratif, migrations auto, DX top | Bundle size, query engine séparé | ✅ Choisi |
| Drizzle | SQL-like, perfo, bundle plus petit | Migrations manuelles | ❌ |
| TypeORM | Mature, décorateurs | Migrations pénibles, plus de boilerplate | ❌ |
| Kysely | SQL-like, typesafe | Pas d'ORM, plus de SQL manuel | ❌ |

### Conséquences

**Positives** :
- Génération automatique des types TypeScript
- Migrations trackées en DB
- `@prisma/adapter-pg` pour Neon
- Bonne intégration avec les outils (Vitest, etc.)

**Négatives** :
- Prisma 7 a introduit des changements breaking (custom generated client)
- Bundle size côté client (~50 KB minifié)
- Indirection query → SQL parfois obscur

### Notes

- 26 champs `@db.Uuid` retirés en juillet 2026 pour compatibilité Neon
- Script `db:setup` automatise generate + migrate + seed

---

## ADR-003 — Neon serverless

**Statut** : ✅ Accepté (25 juin 2026)  
**Dernière révision** : 3 juillet 2026 (auto-cleanup 7j)

### Contexte

Le projet nécessite une base PostgreSQL avec :
- Haute disponibilité
- Auto-scaling (saisons)
- Backups automatiques
- Coût maîtrisé

### Décision

Adoption de **Neon** (PostgreSQL serverless managé).

### Alternatives considérées

| Alternative | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **Neon** | Serverless, branches par commit, pooling | US-only, coût compute | ✅ Choisi |
| Supabase | Plus riche (auth, realtime) | Vendor lock-in plus fort | ❌ |
| AWS RDS | Contrôle total, EU dispo | Complexe, cher à petite échelle | ❌ |
| PlanetScale | Excellent (MySQL) | Pas PostgreSQL | ❌ |
| Railway Postgres | Simple, EU | Moins riche que Neon | ❌ |

### Conséquences

**Positives** :
- Auto-scaling (scale to zero possible)
- Branching par PR (utile pour tester)
- Backups automatiques inclus
- Connection pooling intégré
- `keep-alive` instrumentation nécessaire (cold start)

**Négatives** :
- US-only (impact RGPD, à compenser avec SCC)
- Latence si utilisateurs hors US
- Coût variable selon compute

### Notes

- Script `keep-alive.ts` envoie une requête toutes les 5 min pour éviter cold start
- Tous les transferts encadrés par SCC (UE)

---

## ADR-004 — Architecture multi-VPS

**Statut** : ✅ Accepté (3 juillet 2026)  
**Dernière révision** : 25 juillet 2026 (auto-update VPS2)

### Contexte

Au début, l'app + worker étaient sur le même VPS. Problèmes constatés :
- Worker lourd impactait les performances de l'app
- Risque de cascade failure (worker bug → app down)
- Difficulté de scale indépendant

### Décision

Adoption d'une architecture **multi-VPS** :
- **VPS1** : Next.js + WebSocket
- **VPS2** : Worker BullMQ + Redis + Cron jobs
- **Tailscale** : VPN mesh entre les deux

### Alternatives considérées

| Alternative | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **Multi-VPS** | Isolation, scale indépendant | Plus complexe à gérer | ✅ Choisi |
| Monolithe single VPS | Simple | SPOF, pas de scale | ❌ |
| Kubernetes | Standard, scalable | Overkill pour 89 j-h de projet | ❌ |
| Vercel + Railway | Serverless | Vendor lock-in, coûts | ❌ |

### Conséquences

**Positives** :
- Isolation des workloads critiques
- Worker peut être redémarré sans impacter l'app
- Possibilité de scale horizontal futur
- Sécurité (Tailscale chiffré)

**Négatives** :
- Plus de configuration
- 2x monitoring à gérer
- Auto-update VPS2 (cron 5min) nécessaire

### Notes

- `nba-auto-update.sh` créé pour auto-pull des images GHCR
- Tailscale gratuit (Personal plan) utilisé pour le mesh

---

## ADR-005 — BullMQ pour jobs async

**Statut** : ✅ Accepté (27 juin 2026)  
**Dernière révision** : 30 juillet 2026 (push instantané v2.2.0)

### Contexte

Le projet nécessite un système de queue pour :
- Distribution de signaux (email + push)
- Notifications
- Backups
- Cron jobs custom

### Décision

Adoption de **BullMQ** avec Redis comme backing store.

### Alternatives considérées

| Alternative | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **BullMQ** | Mature, Redis natif, Bull Board UI | Dépendance Redis | ✅ Choisi |
| Inngest | Excellent DX, serverless | Vendor lock-in, coût | ❌ |
| Trigger.dev v3 | DX moderne, Open source | Plus jeune | ❌ |
| Temporal | Très robuste | Overkill, complexe | ❌ |
| Cron natif | Simple | Pas de retry, pas de monitoring | ❌ |

### Conséquences

**Positives** :
- Robustesse (retry, backoff, dead-letter)
- Bull Board pour monitoring (UI admin)
- Workers séparables (VPS2)
- Schedules (delayed jobs)
- Sub-queues pour parallélisation (v2.1.0)

**Négatives** :
- Dépendance à Redis (SPOF si down)
- Mode dégradé nécessaire (Redis désactivé avec noop fallback)

### Notes

- Redis password sécurisé, exposé uniquement sur Tailscale
- Mode Redis-disabled avec noop fallback (cf. v2.0.0)

---

## ADR-006 — Better Auth

**Statut** : ✅ Accepté (25 juin 2026)  
**Dernière révision** : 31 juillet 2026 (bump 1.6.25)

### Contexte

Le projet nécessite un système d'authentification avec :
- Email + password
- Sessions sécurisées
- RBAC extensible
- OAuth-ready (futur)
- CSRF protection

### Décision

Adoption de **Better Auth** (librairie TypeScript moderne).

### Alternatives considérées

| Alternative | Avantages | Inconvénients | Verdict |
|---|---|---|---|
| **Better Auth** | TypeScript-first, RBAC-friendly, OAuth | Librairie jeune (breaking changes possibles) | ✅ Choisi |
| NextAuth (Auth.js) | Mature, large communauté | Vieillissant, TypeScript moins bon | ❌ |
| Clerk | Excellent DX, prêt à l'emploi | Cher, vendor lock-in | ❌ |
| Lucia | DIY, contrôle total | Plus de code à écrire | ❌ |
| Custom (bcrypt + JWT) | Contrôle total | Sécurité critique à réinventer | ❌ |

### Conséquences

**Positives** :
- API simple et bien documentée
- Sessions httpOnly + secure + sameSite par défaut
- 2FA plugin disponible (activé tard mais désactivé car bug)
- Cookies CSRF intégrés

**Négatives** :
- Librairie jeune (1.x → breaking changes possibles)
- Migration 1.6.20 → 1.6.25 a nécessité plusieurs patches

### Notes

- 2FA désactivé temporairement (cassait l'inscription sur bundle .next existant)
- Sessions persistantes par défaut (`rememberMe: true` forcé) depuis v2.4.0

---

## 📋 ADR FUTURS (à documenter)

| # | Sujet | Statut |
|---|---|---|
| ADR-007 | Refonte admin UI avec Recharts (v2.4.0) | 🔲 À documenter |
| ADR-008 | Module coaching & journal (v2.3.0) | 🔲 À documenter |
| ADR-009 | Migration vers Vercel (optionnel) | ❌ Refusé (vendor lock-in) |
| ADR-010 | i18n multilingue | 🔲 À évaluer |
| ADR-011 | Multi-tenant white-label | 🔲 À évaluer |

---

*Document confidentiel — usage strictement privé*
*À enrichir à chaque décision technique majeure*