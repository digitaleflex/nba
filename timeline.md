# 📅 Timeline — Projet NBA / SignauxX

> **Période couverte** : 25 juin 2026 → 31 août 2026 (~2 mois)
> **Total commits** : 913
> **Releases taguées** : 8 (v1.0.0 → v2.5.0)
> **Stack** : Next.js 16 · React · Prisma 7 · PostgreSQL/Neon · BullMQ · Better Auth · WebSocket · Tailwind 4 · Sentry

---

## 🎯 Vue d'ensemble

Le projet **NBA** (commercialisé **SignauxX**) est une plateforme de signaux de trading multi-tenant avec administration, onboarding KYC/KYB, distribution temps réel (BullMQ + WebSocket), notifications push, et un système d'abonnements. En deux mois, le projet est passé d'un scaffold vide à une plateforme production-grade multi-VPS avec CI/CD, monitoring Sentry, et infrastructure distribuée.

```
[Bootstrap]──▶[MVP Auth+Signaux]──▶[v1.0 Hardening]──▶[v2.0 Infra]──▶[v2.5 Production]
   J0-J2          J2-J21              J21-J23             J23-J28          J28-J67
   25-27 juin     27 juin-16 juil      16-23 juil          23-31 août
```

---

## 🟢 Phase 0 — Bootstrap (25 juin 2026)

### Commit initial
- **`967427b`** — `chore: initial project scaffold` *(25 juin 2026)*
  - Création du repo Next.js + structure de dossiers

### Mise en place CI
- **`d2aced6`** — `chore: add CI workflow, vitest, and test setup`
- **`37b987c`** — `chore: add tests and coverage to CI workflow`
- **`b61aeb1`** — `feat: remove homepage - redirect to auth flow only`

> 🎯 **Objectif** : poser les fondations (Next.js, tests, CI GitHub Actions) et recentrer l'app sur le flux d'authentification.

---

## 🔵 Phase 1 — Construction du MVP (27 juin 2026)

**Une seule journée très dense** — tout le cœur fonctionnel est livré le 27 juin.

### Architecture & infrastructure
| Commit | Description |
|---|---|
| `7126618` | Build deps, scripts utilitaires, config PM2 |
| `64249c7` | Schéma DB, migrations Prisma, seed |
| `ba7be61` | Instrumentation Next.js + keep-alive Neon |
| `0ee72b6` | Docker-compose, docs, gitignore |

### Design system
- **`265a9bb`** — Theme provider, debounce hook, composants UI (card, dialog, dropdown, popover, select)

### Authentification (Better Auth)
- **`f654425`** — Intégration Better Auth + rôle par défaut + templates email Resend + services device/localStorage
- **`568c701`** — Layouts (onboarding/auth/admin), routing, pages et API routes
- **`c6ba289`** — Middleware de protection des routes
- **`7730056`** — Helpers `requireRole`, `requireAuth`
- **`56be948`** — Fix redirect loop racine
- **`2aef93a`** — Protection server-side des layouts admin/onboarding
- **`46d87da`** — Utilisation de `requireRole` sur les API admin
- **`195f50b`** — Page reset-password avec validation token
- **`0c01ac1`** — Lien "Mot de passe oublié ?" sur login
- **`0ab6b93`** — Bouton logout dans header admin
- **`02dec53`** — Page forgot-password avec formulaire email

### Dashboard utilisateur
- **`11f98f4`** — Layout dashboard + landing page

### RBAC (Role-Based Access Control)
- **`3ba2fba`** — Seed 5 rôles, 11 permissions + assignations
- **`1d322af`** — Script createAdmin fonctionnel
- **`ecf7d5d`** — Fonction `requirePermission` pour contrôles granulaires
- **`6c07e87`** — Migration requireRole → requirePermission
- **`6d82ff6`** — Client Prisma étendu dans createAdmin

### Validation & Sécurité
- **`733043d`** — Schémas Zod + utilitaire de validation
- **`dff6864`** — Intégration Zod dans les routes API
- **`c9b8b90`** — Rate limiting sur endpoints auth
- **`c5f6641`** — Service d'audit log + intégration actions admin
- **`17443fa`** — Pages erreur 401 / 403 custom
- **`39840f7`** — UI gestion de sessions dans dashboard
- **`c394c0c`** — Tests validation/auth, session expiry, refactor wizard inscription

### Correction DB
- **`1f648dd`** — Suppression `@db.Uuid` (26 champs texte), alignement rôle par défaut

### KYC (Know Your Customer)
- **`c6943cf`** — Capture selfie avec caméra, guidelines qualité, notice confidentialité, pose 3 doigts
- **`7caefa7`** — Transitions caméra, effet flash, barre progression, animations feedback

### Emails
- **`9ff161f`** — Init lazy de Resend (plus de crash si clé API manquante)
- **`d313428`** — Amélioration gestion d'erreur et logs email

### Pages d'erreur
- **`10c7996`** — Pages 404 (not-found) et 500 (error boundaries) pour toutes les sections

### Onboarding
- **`1c48cf6`** — Enforcement onboarding dans middleware
- **`e20e79b`** — Génération OTP email + endpoints API vérification
- **`53e6643`** — Redesign flux 3 étapes : email → KYC → broker
- **`1ee5920`** — Optimisation cache session + simplification reset password

### 🟣 Module Signaux (cœur métier)
- **`f70d1c8`** — Simplification schéma Signal + migration
- **`7ec1042`** — Parser markdown simple + template HTML email
- **`3464827`** — Service layers + BullMQ distribution async + typings
- **`9e3ed47`** — File serving sécurisé + endpoints admin signal
- **`ee86204`** — Éditeur Notion/Telegram-like + vues feed membre
- **`87c7f50`** — Tests parser markdown et schémas Zod
- **`0ff2d4a`** — Schéma Zod création signal
- **`d7adb60`** — Schémas signal_v2 (versions, reads, templates)
- **`0a2a820`** — Contrôle d'accès politique + templates + services core
- **`5debaa4`** — Endpoints API admin et membre
- **`e63bac4`** — Worker queue avec scheduling
- **`1503c85`** — ActionBar SignalEditor + métriques historique AdminPage
- **`1b15f2d`** — Détail signal membre + événements read

### Refactor & infra
- **`f1b4f07`** — Résolution TS compiler paths + casts explicites
- **`6c9c067`** — Fix mapping param signal detail page
- **`420624b`** — Permission build script `msgpackr-extract`
- **`5bea6cd`** — Path relatif PrismaClient dans db.ts
- **`ece1f30`** — Services access management + onboarding workflow + Knip
- **`e9c211f`** *(28 juin)* — Parse User-Agent + IP pour affichage user-friendly device/localhost

### Signaux UX
- **`9f69ad2`** — Refactor signals page en client-side avec live search, pagination
- **`9975556`** — Composant SignalsView pour filtrer notifications

### Branding
- **`5fec400`** — Logo NBA + favicon + OpenGraph
- **`beb1ae4`** — Remplacement SVG inline par vrai logo PNG dans emails

### 🔒 Patchs sécurité (28 juin)
- **`c972033`** — Suppression stockage mot de passe en sessionStorage (→ useState)
- **`662b60c`** — Validation magic bytes anti-MIME falsification
- **`3406211`** — Branchement auto-cleanup fichiers KYC/Broker
- **`899b657`** — Rate limiting OTP, upload KYC, Broker, signaux
- **`7f62a27`** — Cookies sécurisés + trustedOrigins + CSRF dans Better Auth
- **`badc476`** — Uniformisation permissions admin avec `requirePermission()`
- **`4f088a8`** — Ajout SUPER_ADMIN dans SignalPolicy
- **`423cdfb`** — Blocage dashboard si email non vérifié
- **`e0df3f2`** — Helper `validateId()` pour UUID path params
- **`6e30f03`** — Validation UUID sur 17 path params
- **`d3efd05`** — Remplacement throws nus par 500 safe (anti-fuite stack)
- **`7258ab3`** — Pagination admin/signals + admin/access-requests
- **`0f3eb17`** — Validation Zod dashboard/profile PUT, kyc, broker
- **`7022a7a`** — `.strict()` sur tous les schémas Zod

### Merge branches audit/sécurité
- **`0834f28`** — merge audit/security-fixes into develop
- **`2168c9b`** — merge audit branches → export `getQueue`, notifications, profile, subscription, admin pages, docs, tests middleware

### Fix tests + housekeeping
- **`60cc1e6`** — Alignement middleware tests avec emailVerified + Better Auth
- **`7f5b8c7`** — merge research prompts + security fixes → main
- **`e298c70`** — Untrack staging/production env files
- **`437f1fe`** — Ignore `.next` et `out` globalement
- **`e2a6894`** — Allow `blob:` dans CSP `img-src`

### ⚡ Perf
- **`1e6d395`** — Réduction roundtrips DB/réseau middleware via route unique status
- **`07187a9`** — Parallélisation distribution BullMQ sub-queue
- **`0b56ad6`** — Stream uploads vers disque + lecture partielle pour validation
- **`e2ab64f`** — Upload KYC front/back/selfie en parallèle
- **`348f2cd`** — Indexes `deletedAt` + composite `status/deletedAt` sur Signal
- **`27f95e5`** — Remplacement `<img>` par `next/image`
- **`f136413`** — Cast connection → any (conflits versions ioredis BullMQ)
- **`b8776f6`** — Dockerfile multi-stage + standalone output
- **`c9ff9ca`** — Amélioration createAdmin (recreate logic)
- **`e8f4f64`** — Fix regex loopback IP dans liste sessions
- **`2119764`** — Cast connection + skipVersionCheck queues globales

### Navigation premium
- **`9abdfb3`** — Intégration Sidebar + Bottom Nav dans admin
- **`0403a23`** — Idem dashboard
- **`cb8b5c7`** — Type `MobileNavLink` explicite (fix TS2339)
- **`d8f0210`** — Collapse/expand sidebar avec persistance localStorage
- **`f431c1e`** — Masquage tabs header admin + sidebar glassmorphique premium
- **`cf2d3be`** — Operations Center complet avec SPA tabs unifié

### Admin Center
- **`f904c08`** — Refactor signals API service layer + fix Redis warning

> 🎯 **Bilan Phase 1** : MVP fonctionnel complet (auth + RBAC + KYC + signaux + admin). Stack production-ready posée.

---

## 🟡 Phase 2 — Affinement UX/UI (28-29 juin 2026)

- **`138f9bf`** *(29 juin)* — Suppression background sombre forcé, adaptation light theme
- **`7505bd6`** — Éditeur de signaux premium interactif avec chart SVG candlestick dynamique
- **`0877f0a`** — Lazy load SignalEditor + AdminContextPanel (next/dynamic)
- **`e231d4a`** — Simplification SignalEditor (clean copy-paste + image attachments + channel diffusion)
- **`a8c438a`** — Layout final broadcast canal privé pour SignalEditor
- **`0fd528a`** — Inbox trading premium membre (favoris, archives, actions)
- **`0bc7e53`** — Viewer image plein écran pour revues KYC
- **`d243ba1`** — Structure dashboard projet + helper migration DB

### KYC simplifié
- **`85da969`** — Suppression selfie de DB + onboarding, vérification auto-cleanup 7j

### Centre de vérification
- **`8b640f7`** — Verification Center, déblocage dashboard, intégration sidebar tabs
- **`bace38a`** — Filtrage target audience groups (privacy) + menu Subscription

### 🐳 Infra & ops (30 juin)
- **`f1268f7`** — Docker resource limits + réseau proxy externe + Traefik routing `access.signauxx.com`
- **`22af6dd`** — Automatisation setup DB + deployment
- **`f701778`** — Fix middleware tests + onboarding redirect `/dashboard`

---

## 🔴 Phase 3 — 🏷️ v1.0.0 — "First Stable" (1er-16 juillet 2026)

### Panneau admin complet
- **`b10fa50`** *(1er juil)* — Admin peut promouvoir/changer rôles user
- **`eb9147c`** — Panneau admin complet — 10 fix critiques

### 🐛 Bugfixes accessibilité (campagne #001-#025)
| Ticket | Commit | Description |
|---|---|---|
| #001 | `fbbf808` | Redirect login si session null |
| #002 | `0607f60` | Error state verification (anti-spinner infini) |
| #003 | `27095ed` | role=button, tabIndex, onKeyDown, aria-label notification cards |
| #004 | `3db5ee6` | htmlFor/id labels, aria-expanded toggles |
| #007 | `006e046` | OTP regex + aria-label |
| #0011 | `b9a325a` | Mark XSS resolved (markdown déjà sanitize) |
| #021 | `d092042` | Error state onboarding |
| #005 | `21891fd` | Mark admin mobile header resolved |
| #006 | `eb2b2d1` | Taille boutons signal action (size-7→size-9) |
| #008 | `e7a705e` | role=dialog, aria-modal, Escape handler panel |
| #009 | `ffe2e38` | Error states admin fetch ops/members/requests/signals/kyc/broker |
| #010 | `aaf6b8d` | Confirmation dialog access request |
| #012 | `d353f64` | Suppression tabIndex=-1 password toggle |
| #013 | `8a65bae` | tabIndex=0 + Enter/Space file upload labels |
| #014 | `3115e8a` | Confirmation session revocation |
| #015 | `2ee421b` | role=progressbar + aria-valuenow KYC |
| #016 | `1ddb323` | role=alert error messages |
| #017 | `1fa523d` | mx-auto subscription page |
| #025 | `571d22a` | Remplacement fake progress bar par spinner honest |
| #023 | `dd077df` | ARIA combobox pattern admin search |
| #024 | `bc0f932` | Désactivation fake notification bell |
| #022 | `4164443` | Remplacement alert/confirm par sonner toasts |
| #019 | `b6090aa` | Select design system dans profile page |

### 🐳 Docker & CI (2 juillet)
- **`c010f84`** — Configuration pnpm workspace hoisting
- **`f7fa7fb`** — Update pnpm lockfile
- **`ca62095`** — Code review SignalsView
- **`655c20b`** — Session summary TS fixes + code review
- **`47037ca`** — Fix Docker build (copie .npmrc)
- **`9222d22`** — Doc fix Docker build Prisma
- **`254975b`** — Ajout .dockerignore
- **`6ac680d`** — Fix runner stage node_modules Prisma/tsx CLI
- **`65a865f`** — Fix imports Prisma 7 custom generated client
- **`5aee763`** — Fix Select onValueChange type mismatch
- **`f1d397e`** — Doc Critical #2 fix validation
- **`16424f0`** *(3 juil)* — Dockerfile multi-stage production-ready Neon + HEALTHCHECK

### Perf DB & queue
- **`397052f`** *(3 juil)* — Indexes composites perf requêtes
- **`21451a5`** — Mode Redis-disabled avec noop fallback
- **`3f7e304`** — Remplacement middleware in-app par proxy caching

### 🏷️ **v1.0.0 — Released 16 juillet 2026**
- **`1d9f4b8`** — `fix(api): handleAuthError ne re-throw plus les erreurs inconnues`

---

## 🟣 Phase 4 — Audit post-v1 (17-19 juillet 2026)

### Correctifs audit P0-P2
- **`bfda997`** *(19 juil)* — `fix(audit): correctifs P0-P2 post-audit` ← **v1.1.0**

### Phase erreurs (multi-PR)
| Commit | Description |
|---|---|
| `79bb107` (fix/pr1-infra) | E11 — errorCode dans tous `log.error`/`log.warn` |
| `c1fbd70` (fix/pr2-routes) | E10 — retry flags Prisma middleware |
| `7e478b4` (fix/pr3-features) | E14 — audit recovery |
| `cacebf2` | Catalogue abuse cases (30+ scénarios) |
| `a11fe4a` | Perf inscription/abonnement (emails async, cache 120s) |

### UX polish
- **`5d5618f`** *(22 juil)* — Gradient signature #261 + refonte ombres #262
- **`3ed2f11`** — Page Files BullMQ + sidebar orphelins
- **`94ea0ed`** — Hard delete users (re-inscription même email)

---

## 🟠 Phase 5 — 🏷️ v2.0.0 — Refonte infra (20-23 juillet 2026)

### Campagne qualité/perf (22-25 juillet)
- **`d1616d6`** *(23 juil)* — `chore: lockfile + fix page blocked message` ← **v2.0.0**

### Configuration environnement
- **`ef8f3d9`** *(3 juil)* — Configurable metadata base URL
- **`a234722`** — Vitest scope restreint à `src/`
- **`b386712`** — Admin API : pagination + batch onboarding + status filtering
- **`4d4ed61`** — Copy button content signal detail
- **`b951511`** — Optimisation lookup image signal (DB directe)
- **`0d9d4f6`** — Docs issue tracking

### 🌐 Réseau & infra
- **`cafe6b6`** — Renommage réseau `nba` (clarité)
- **`364d3b8`** — GitHub Actions deploy workflow avec GHCR
- **`3be5aa6`** — workflow_dispatch deploy manuel
- **`11a035f`** — Service Redis + build target/args
- **`06496c7`** — Build arg `NEXT_PUBLIC_APP_URL`
- **`f970c96`** — CSP allow Cloudflare beacon
- **`76ae5cd`** — Fix cookie detection proxy
- **`63ec2b7`** — ipAddress headers rate limit (Traefik)

### Storage & features
- **`4131003`** — Migration `signal_favorites` + `signal_archives`
- **`c3662bf`** — Subscription : uniquement offre active
- **`6a0f7a5`** — Rename sidebar "Boîte de réception" → "Mes Signaux"
- **`547d7e0`** — Suppression SMTP UI admin + sessions actives dashboard
- **`8c579be`** — Favicon update from logo.png
- **`62c48c5`** — Onglet Membres admin (filter par subscription)

### 🎨 Design system
- **`54b9054`** — Spacing tokens, elevation matrix, interactive states

### Queue/workers production
- **`455a9ae`** *(3 juil)* — BullMQ + worker service + notification polling + audit purge
- **`5f3a06c`** — Entrypoints `migrate deploy` → `safe db push`
- **`5cc02ec`** — Backup B2 cron quotidien 2h
- **`d09f42f`** — Backup email alerts via Resend
- **`bf3b4e8`** — App memory bump 4GB

### Onboarding simplifié
- **`e76d9e4`** — Email-only flow, KYC/Broker → `/dashboard/verification`

### Architecture distribuée VPS1+VPS2
- **`49aab70`** *(3 juil)* — VPS2 setup worker-only compose
- **`27fd1cc`** — VPS2 Redis password + Tailscale
- **`fa9c03c`** — Compose sans hardcoded REDIS_URL
- **`d848f76`** — Split worker Dockerfile.worker
- **`4985e9f`** — Suppression contrainte KYC-approved, broker dropdown custom name
- **`b733acb`** — VPS2 pull depuis GHCR
- **`38629cd`** — Suppression worker VPS1 (déplacé VPS2)
- **`80ae61d`** — Sentry error tracking + fix notifications PUT/DELETE
- **`1fceaad`** — `nba-auto-update.sh` cron VPS2 (pull toutes les 5min)
- **`f7f9370`** — Amélioration log auto-update
- **`7606cc4`** — Fix proxy.ts session validation
- **`624113d`** — Fix middleware tests proxy.ts + register timeout

### Auth
- **`15f323b`** *(25 juil)* — test:coverage non-bloquant
- **`4cb74aa`** — Suppression twoFactor (cassait inscription)
- **`59ae3d8`** — Lockfile reclassify deps
- **`9c756c4`** — Regen Prisma client twoFactorEnabled
- **`b479d75`** — Bump better-auth 1.6.23→1.6.25
- **`781d513`** — Bump sonner 1.7.4→2.0.7
- **`de10ef4`** *(31 juil)* — 21 vulnérabilités corrigées (audit clean)
- **`f672c77`** *(31 juil)* — Logs toutes tentatives login/signup
- **`a2cacfa`** *(31 juil)* — Fix CI typecheck + tests périmés

---

## 🚀 Phase 6 — 🏷️ v2.1.0 — Robustesse signaux (28 juillet 2026)

- **`2ddba3f`** *(28 juil)* — `fix(signals): robustesse niveau Apple — 4 correctifs critiques` ← **v2.1.0**

### Hotfixes UX messagerie (28 juillet — campagne dense)
| Commit | Description |
|---|---|
| `7362fde` | 3 bugs critiques distribution signaux |
| `ff7a0d5` | Fix boucle refresh continu onglet signaux |
| `f67b1db` | API revenue onglet fonctionnel |
| `7d9cee0` | i18n messages erreur français |
| `37ba33b` | Suppression scroll horizontal mobile |
| `7c7f878` | Touch targets 40px mobile (Apple HIG) |
| `3971e25` | Affichage secondes horodatages |
| `a013a13` | Notifications bureau arrière-plan |
| `4bd4634` | Actions visibles mobile + retry envoi |
| `18253fd` | Bulk-message expéditeur admin@signauxx.com |
| `19d79f6` | Messagerie groupée admin → tous membres |
| `1f04fdd` | 4 correctifs bloquants adoption messagerie |

### Pipeline complet phases 1-6
- **`e39bdc5`** *(28 juil)* — `feat: phases 1-6 roadmap complet — performance, temps réel, UX, nettoyage`

### Fixes infra messagerie
- **`62f9c30`** — Endpoint admin report manquant
- **`7e6488b`** — MessagingUnreadProvider + rate limit
- **`742ba9a`** — Cascade deletes Notification/NotificationDelivery/AccessRequest
- **`38100b4`** — Recovery path push delivery failures
- **`33f7b64`** — Prevent orphan PENDING push delivery
- **`e611c11`** — Prevent cascade failure publishMessage
- **`05258cb`** — Prevent race condition findOrCreateDirectConversation

### Auth
- **`6292698`** *(27 juil)* — Normalisation email login (trim + lowercase)

---

## 🔔 Phase 7 — 🏷️ v2.2.0 — Push & resilience (30 juillet 2026)

- **`62ebe67`** *(30 juil)* — `perf(push): notifications push instantanées + resilience worker` ← **v2.2.0**

---

## 📓 Phase 8 — 🏷️ v2.3.0 — Module Journal de trading (août 2026)

### Module journal
- **`f44725b`** *(5 août)* — `feat(journal): adoption — session auto, nudge quotidien, guide 1er signal, backfill` ← **v2.3.0**

### Features (4 août)
- **`9e6aa8c`** — Multisection par plan + badges "Votre section"
- **`2bdeca4`** — Outils de debug et déploiement
- **`ad22dd7`** — Signalement bugs par membres + onglet admin
- **`4f201a0`** — Actions batch admin (SSE streaming + Prisma transactions)
- **`bb69719`** — Approbation accès : isActive restauré, emails SUSPENDED/REVOKED, changement plan

### Détection doublons
- **`9b3ca6e`** *(8 août)* — Doublons nom/email/IP + échéances abonnements + plans Deriv

### Discord alerts
- **`e904ce5`** — Discord swap/memory pressure (anti-spam)

### Sécurité
- **`8f99f3f`** — Traçabilité emails sync + KYC sans broker + fenêtre brute-force 2min

---

## 🛡️ Phase 9 — 🏷️ v2.4.0 — Refonte admin UI (26 août 2026)

### Refonte admin complète
- **`c2bdeee`** *(26 août)* — Dashboard repensé : KPI + MRR + recharts + alerte churn
- **`a57ed6a`** — Revenus repensé : MRR timeline + alerte churn + recharts
- **`1463814`** — Analytics repensé : vraie dataviz recharts
- **`eccc406`** — Phase 3 polish (transitions, sticky header, KPI animés)
- **`5051dbf`** — Phase 2 design system (StatCard/FilterPills/ConfirmDialog)
- **`46ec729`** — Phase 1 design system (typographie lisible + statuts)
- **`2706e72`** — SignalsTab repensé (layout vertical, actions labellisées, pills)
- **`d921261`** — MembresTab skeleton loading desktop + mobile ← **v2.4.0**
- **`a8bc3cd`** — Audit center (skeleton, toast, selects stylés)
- **`09e5e00`** — Helpers template email + script relance accès expirés
- **`094c63d`** — Conformité Web Interface Guidelines nav
- **`ad7c128`** — Sidebar badge Décoder cohérent + fabrique unique icônes

### Module coaching
- **`84b64c6`** — Vue d'ensemble journaux + détail complet trades
- **`2ea1a02`** — PnL unifié + winRate membre/admin + affichage setups

### DB
- **`1697622`** — Drop table `signal_templates` (feature jamais livrée)

### Hardening
- **`28a364c`** — Purge code mort + durcissement rôles + sidebar clarifiée
- **`be95f55`** — Invalidation cache purge fantômes + suggestions résilientes
- **`f44f99c`** *(2 août)* — Sessions persistantes par défaut (rememberMe forcé true)

---

## 🔒 Phase 10 — 🏷️ v2.5.0 — Security hardening (31 août 2026)

- **`a48b99b`** *(31 août)* — `fix(deps): upgrade next@16.2.12, sharp@0.35.4 (Dependabot patches)` ← **v2.5.0**

### Hardening final
- **`db911ad`** *(31 août)* — Hardening sécurité : rate-limit admin, CSP nonce, TLS, execSync
- **`994b551`** — Génération vrai nonce CSP en middleware (vs placeholder `{x-nonce}`)
- **`6ecdff6`** — URLs absolues dans redirects (compatibilité Node 16 runtime)
- **`b10f4eb`** *(31 août)* — Injection nonce CSP via headers requête + rendu dynamique (pattern officiel Next.js)
- **`7571ab5`** — Patch vulnérabilités nanoid, undici, ip-address, dompurify, socket.io-parser

---

## 📊 Synthèse de l'évolution

### Architecture : du monolithique au distribué

```
Phase 0-1 (J0-J2) : Single Next.js app
Phase 2-3 (J3-J21): Next.js + Prisma + BullMQ + WebSocket (monolithique)
Phase 4-5 (J22-J28): + Sentry, GHCR, multi-VPS, Redis externalisé
Phase 6-10 (J29-J67): Production-grade distribué VPS1+VPS2+Tailscale
```

### Métriques clés

| Métrique | Phase 1 | Phase 5 | Phase 10 (v2.5) |
|---|---|---|---|
| Commits totaux | ~45 | ~450 | 913 |
| Releases | — | v1.0.0 | v2.5.0 |
| Vulnérabilités connues | n/a | 21 | 0 |
| Modules métier | 3 (auth, KYC, signaux) | + journal, messagerie | + coaching |
| Serveurs | 1 (local) | 1 (VPS) | 2 (VPS1+VPS2) |

### Modules métier construits au fil du temps

```
Auth (J2) → KYC (J2) → Signaux (J2) → Admin Center (J3) → RBAC granulaires (J21)
→ Messagerie (J27) → Push notifs (J29) → Journal trading (J34) → Coaching (J63)
→ Bug reports (J40) → Audit center (J63)
```

### Files clés ajoutées par phase

- **Phase 1** : `src/lib/auth/*`, `src/lib/rbac/*`, `src/lib/signals/*`, `workers/queue.ts`, `prisma/schema.prisma`
- **Phase 2** : `src/app/(admin)/signals/editor/*`, `src/components/ui/glass/*`
- **Phase 3** : `compose.yml`, `Dockerfile`, `.github/workflows/*`
- **Phase 4** : `src/lib/errors/*`, `src/lib/audit/*`
- **Phase 5** : `compose.vps2.yml`, `Dockerfile.worker`, `scripts/backup.sh`
- **Phase 6** : `src/lib/messaging/*`, `src/lib/push/*`
- **Phase 8** : `src/lib/journal/*`
- **Phase 9** : `src/app/(admin)/_components/charts/*`, `src/lib/coaching/*`

### Releases — résumé

| Tag | Date | Commit | Thème |
|---|---|---|---|
| v1.0.0 | 16 juil | `1d9f4b8` | First stable, auth + signaux + KYC + admin |
| v1.1.0 | 19 juil | `bfda997` | Correctifs audit P0-P2 |
| v2.0.0 | 23 juil | `d1616d6` | Refonte infra (Docker, CI, GHCR) |
| v2.1.0 | 28 juil | `2ddba3f` | Robustesse signaux niveau Apple |
| v2.2.0 | 30 juil | `62ebe67` | Push instantané + resilience |
| v2.3.0 | 5 août | `f44725b` | Module journal de trading |
| v2.4.0 | 26 août | `d921261` | Refonte admin UI (recharts, KPI, MRR) |
| v2.5.0 | 31 août | `a48b99b` | Security hardening (CSP nonce, deps) |

---

## 🔮 Axes d'évolution probables (au-delà de v2.5)

Identifiés via les derniers commits et le contexte :

1. **Finalisation module Coaching** — ouvert récemment, encore en adoption
2. **Multi-tenant SaaS** — préparation possible (plans Deriv, multisection)
3. **Mobile app native** — touch targets 40px + notifications bureau = préparation PWA/natif
4. **API publique** — base solide, OAuth prêt via Better Auth
5. **Internationalisation** — i18n messages déjà entamé (français), prochaine étape anglais

---

*Généré le 3 septembre 2026 — 913 commits analysés sur 67 jours d'activité (25 juin → 31 août 2026).*