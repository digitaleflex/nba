# 💎 Inventaire valorisé des fonctionnalités — NBA / SignauxX

> **Document de tarification détaillée** — chaque fonctionnalité a un temps estimé, un coût de remplacement, et une valeur catalogue.

---

## 📐 Méthode d'estimation du temps

### Échelle utilisée (jours-homme)

| Code | Temps | Description | Exemples |
|---|---|---|---|
| 🟢 **XS** | 0,1 j (1h) | Fix trivial, 1-2 fichiers | Bugfix ciblé, label, texte |
| 🟢 **S** | 0,25 j (2h) | Feature simple, 1 fichier | Helper, validation, hook |
| 🟡 **M** | 0,5 j (4h) | Feature moyenne, 2-5 fichiers | Page CRUD, composant |
| 🟠 **L** | 1 j (8h) | Feature complexe | Module complet, refonte |
| 🔴 **XL** | 2-3 j | Architecture, intégration | Service + API + UI + tests |
| 🔴🔴 **XXL** | 5+ j | Système entier | KYC, signaux, RBAC |

### Tarif de référence

- **Taux journalier** : **120 000 FCFA/jour** (≈ 180 €/jour, freelance senior Afrique francophone)
- **Bonus qualité moyen** : +50 % sur les systèmes complexes (sécurité, RBAC, KYC)

---

## 📊 Vue d'ensemble (synthèse)

| Catégorie | Nb features | Temps estimé | Valeur |
|---|---|---|---|
| Authentification | 18 | 11,5 j | 1 380 000 FCFA |
| RBAC & permissions | 8 | 5 j | 600 000 FCFA |
| Module Signaux (cœur) | 15 | 18,5 j | 2 220 000 FCFA |
| KYC & onboarding | 12 | 12 j | 1 440 000 FCFA |
| Messagerie temps réel | 16 | 14 j | 1 680 000 FCFA |
| Notifications push | 8 | 5 j | 600 000 FCFA |
| Module Journal de trading | 10 | 7 j | 840 000 FCFA |
| Coaching | 4 | 3 j | 360 000 FCFA |
| Admin Center (17 onglets) | 32 | 22 j | 2 640 000 FCFA |
| Sécurité & anti-fraude | 18 | 12 j | 1 440 000 FCFA |
| Infrastructure & DevOps | 20 | 13 j | 1 560 000 FCFA |
| Tests & qualité | 6 | 5 j | 600 000 FCFA |
| Documentation | 5 | 3 j | 360 000 FCFA |
| Design system & UI | 12 | 9 j | 1 080 000 FCFA |
| **TOTAL** | **184** | **140 j** | **16 800 000 FCFA** |

> Note : ce total (140 j) est légèrement supérieur aux 89 j-h réels car j'intègre ici le temps qu'aurait mis une équipe senior standard (sans optimisation par IA et expertise maximale du fondateur).

---

# 🔐 1. AUTHENTIFICATION (18 fonctionnalités — 11,5 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 1.1 | Inscription email + password | `src/lib/auth/auth.ts` | 🟡 M | 0,5 j | 60 000 |
| 1.2 | Vérification email par OTP | `src/lib/auth/otp.ts` | 🟡 M | 0,5 j | 60 000 |
| 1.3 | Login avec sessions persistantes | `auth.ts` + `middleware.ts` | 🟠 L | 1 j | 120 000 |
| 1.4 | Mot de passe oublié | `forgot-password` page + API | 🟡 M | 0,5 j | 60 000 |
| 1.5 | Reset password avec token | `reset-password` page + API | 🟡 M | 0,5 j | 60 000 |
| 1.6 | Logout | API + UI | 🟢 S | 0,25 j | 30 000 |
| 1.7 | Magic bytes validation uploads | `lib/security/magic-bytes.ts` | 🟡 M | 0,5 j | 60 000 |
| 1.8 | Validation UUID path params | `lib/security/validate-id.ts` | 🟢 XS | 0,1 j | 12 000 |
| 1.9 | Rate limiting auth endpoints | `lib/rate-limit/*` | 🟠 L | 1 j | 120 000 |
| 1.10 | Normalisation email (trim+lowercase) | `auth.ts` | 🟢 XS | 0,1 j | 12 000 |
| 1.11 | CSRF protection (Better Auth) | config Better Auth | 🟡 M | 0,5 j | 60 000 |
| 1.12 | Cookies sécurisés (httpOnly, secure, sameSite) | config Better Auth | 🟢 S | 0,25 j | 30 000 |
| 1.13 | Captcha system | `api/auth/captcha/*` | 🟠 L | 1 j | 120 000 |
| 1.14 | Session expiry configurable | config + tests | 🟢 XS | 0,1 j | 12 000 |
| 1.15 | Multi-device sessions list | `dashboard/devices` page + API | 🟡 M | 0,5 j | 60 000 |
| 1.16 | Session revocation | API + UI confirmation | 🟡 M | 0,5 j | 60 000 |
| 1.17 | Fingerprint anti-fraude device | `@fingerprintjs/fingerprintjs` | 🟡 M | 0,5 j | 60 000 |
| 1.18 | Login attempt tracking | `login_attempts` table + index | 🟡 M | 0,5 j | 60 000 |
| **SOUS-TOTAL** | | | | **11,5 j** | **1 380 000 FCFA** |

---

# 🛡️ 2. RBAC & PERMISSIONS (8 fonctionnalités — 5 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 2.1 | Modèle Role + Permission | `prisma/schema.prisma` | 🟡 M | 0,5 j | 60 000 |
| 2.2 | Seed 5 rôles + 11 permissions | `scripts/seed.ts` | 🟢 S | 0,25 j | 30 000 |
| 2.3 | Helper `requireRole()` | `lib/auth/require-role.ts` | 🟢 S | 0,25 j | 30 000 |
| 2.4 | Helper `requirePermission()` | `lib/auth/require-permission.ts` | 🟡 M | 0,5 j | 60 000 |
| 2.5 | Helper `requireAuth()` | `lib/auth/require-auth.ts` | 🟢 XS | 0,1 j | 12 000 |
| 2.6 | Migration requireRole → requirePermission sur 50+ routes | multi-fichiers | 🟠 L | 1 j | 120 000 |
| 2.7 | Pages 401 / 403 custom | `app/401`, `app/403` | 🟢 S | 0,25 j | 30 000 |
| 2.8 | Script createAdmin fonctionnel | `scripts/createAdmin.ts` | 🟡 M | 0,5 j | 60 000 |
| **SOUS-TOTAL** | | | | **5 j** | **600 000 FCFA** |

---

# 🟣 3. MODULE SIGNAUX — CŒUR MÉTIER (15 fonctionnalités — 18,5 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 3.1 | Modèle Signal + versions + reads + audience | `prisma/schema.prisma` | 🔴 XL | 2 j | 240 000 |
| 3.2 | Service layer distribution signaux | `lib/signals/service.ts` | 🔴 XL | 2 j | 240 000 |
| 3.3 | Markdown parser sécurisé (anti-XSS) | `lib/signals/markdown.ts` | 🟡 M | 0,5 j | 60 000 |
| 3.4 | Éditeur Notion/Telegram-like (admin) | `components/admin/SignalEditor*` | 🔴 XL | 2 j | 240 000 |
| 3.5 | Chart SVG candlestick dynamique | `components/admin/SignalChart` | 🟠 L | 1 j | 120 000 |
| 3.6 | Action bar SignalEditor | `SignalEditor/ActionBar` | 🟡 M | 0,5 j | 60 000 |
| 3.7 | Diffusion BullMQ + Redis sub-queue | `lib/signals/queue.ts` + `workers/queue.ts` | 🔴 XL | 2 j | 240 000 |
| 3.8 | Templates HTML email signaux | `lib/signals/email-template.ts` | 🟠 L | 1 j | 120 000 |
| 3.9 | API endpoints admin (CRUD + publish) | `api/admin/signals/*` (12 routes) | 🔴 XL | 2 j | 240 000 |
| 3.10 | API endpoints membre (read + favorite + archive) | `api/dashboard/signals/*` (8 routes) | 🟠 L | 1 j | 120 000 |
| 3.11 | Inbox premium membre (recherche + filtres) | `dashboard/signals/page.tsx` + `SignalsView` | 🔴 XL | 2 j | 240 000 |
| 3.12 | Détail signal (image + copier + read events) | `dashboard/signals/[id]/page.tsx` | 🟠 L | 1 j | 120 000 |
| 3.13 | Favoris + archives (signal_favorites, signal_archives) | DB + UI + API | 🟡 M | 0,5 j | 60 000 |
| 3.14 | File serving sécurisé images | `api/files/[...path]` | 🟡 M | 0,5 j | 60 000 |
| 3.15 | 4 correctifs robustesse "Apple-level" | multi | 🟠 L | 1 j | 120 000 |
| **SOUS-TOTAL** | | | | **18,5 j** | **2 220 000 FCFA** |

---

# 🪪 4. KYC & ONBOARDING (12 fonctionnalités — 12 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 4.1 | Modèle KycDocument + BrokerVerification | `prisma/schema.prisma` | 🟠 L | 1 j | 120 000 |
| 4.2 | Capture selfie caméra (3 poses doigts) | `onboarding/kyc` + `useCamera` | 🔴 XL | 2 j | 240 000 |
| 4.3 | Capture carte ID recto/verso | `onboarding/kyc` | 🟠 L | 1 j | 120 000 |
| 4.4 | Transitions caméra + flash + animations | UI components | 🟡 M | 0,5 j | 60 000 |
| 4.5 | Upload parallèle (3 fichiers) | API optimisée | 🟡 M | 0,5 j | 60 000 |
| 4.6 | Auto-cleanup 7 jours (RGPD) | cron + script | 🟡 M | 0,5 j | 60 000 |
| 4.7 | Broker dropdown + custom name | `onboarding/broker` | 🟡 M | 0,5 j | 60 000 |
| 4.8 | OTP generation + verification API | `api/onboarding/send-otp`, `verify-otp` | 🟡 M | 0,5 j | 60 000 |
| 4.9 | Flow 3 étapes (email → KYC → broker) | wizard state machine | 🔴 XL | 2 j | 240 000 |
| 4.10 | Email-only flow simplifié (option) | onboarding flow v2 | 🟡 M | 0,5 j | 60 000 |
| 4.11 | Vérification Center (membre) | `dashboard/verification` | 🟠 L | 1 j | 120 000 |
| 4.12 | Review admin KYC/Broker (viewer image plein écran) | `admin/kyc/[id]` + `admin/broker/[id]` | 🟠 L | 1 j | 120 000 |
| **SOUS-TOTAL** | | | | **12 j** | **1 440 000 FCFA** |

---

# 💬 5. MESSAGERIE TEMPS RÉEL (16 fonctionnalités — 14 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 5.1 | Modèle Conversation + Messages + Reactions | `prisma/schema.prisma` | 🟠 L | 1 j | 120 000 |
| 5.2 | Service WebSocket (Socket.IO) | `workers/websocket.ts` | 🔴 XL | 2 j | 240 000 |
| 5.3 | WS auth + Redis adapter | `workers/ws-auth.ts` | 🟠 L | 1 j | 120 000 |
| 5.4 | Conversations 1-1 (findOrCreate race-condition safe) | `lib/messaging/service.ts` | 🟡 M | 0,5 j | 60 000 |
| 5.5 | Conversations groupées | API | 🟡 M | 0,5 j | 60 000 |
| 5.6 | Envoi messages + WebSocket broadcast | API + WS | 🟠 L | 1 j | 120 000 |
| 5.7 | Réactions messages | API + UI | 🟡 M | 0,5 j | 60 000 |
| 5.8 | Édition + suppression messages | API + permissions | 🟡 M | 0,5 j | 60 000 |
| 5.9 | Citations + réponses | DB schema + UI | 🟡 M | 0,5 j | 60 000 |
| 5.10 | Reports messages (anti-abus) | DB + admin UI | 🟡 M | 0,5 j | 60 000 |
| 5.11 | Compteur non-lus + badge | DB + WS event | 🟡 M | 0,5 j | 60 000 |
| 5.12 | Mark-as-read tracking | API + WS | 🟢 S | 0,25 j | 30 000 |
| 5.13 | Cascade deletes (cleanup orphelins) | DB + service | 🟢 S | 0,25 j | 30 000 |
| 5.14 | Attachments (images, fichiers) | upload + serving | 🟠 L | 1 j | 120 000 |
| 5.15 | Bulk message admin → tous membres | admin feature | 🟡 M | 0,5 j | 60 000 |
| 5.16 | MessagingUnreadProvider (cache context) | React context | 🟢 S | 0,25 j | 30 000 |
| **SOUS-TOTAL** | | | | **14 j** | **1 680 000 FCFA** |

---

# 🔔 6. NOTIFICATIONS PUSH (8 fonctionnalités — 5 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 6.1 | Modèle PushSubscription | `prisma/schema.prisma` | 🟢 S | 0,25 j | 30 000 |
| 6.2 | VAPID keys generation + config | `lib/push/vapid.ts` | 🟡 M | 0,5 j | 60 000 |
| 6.3 | Subscribe API (Web Push) | `api/push/subscribe` | 🟡 M | 0,5 j | 60 000 |
| 6.4 | Send notifications worker | `workers/queue.ts` push processor | 🟠 L | 1 j | 120 000 |
| 6.5 | Notification delivery tracking | `notification_deliveries` table | 🟡 M | 0,5 j | 60 000 |
| 6.6 | Recovery path push failures | error handling | 🟡 M | 0,5 j | 60 000 |
| 6.7 | Notifications bureau arrière-plan | service worker + UI | 🟡 M | 0,5 j | 60 000 |
| 6.8 | Préférences notification utilisateur | `notification-preferences` page + API | 🟠 L | 1 j | 120 000 |
| **SOUS-TOTAL** | | | | **5 j** | **600 000 FCFA** |

---

# 📓 7. MODULE JOURNAL DE TRADING (10 fonctionnalités — 7 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 7.1 | Modèles Trade, JournalSession, DailyReflection, Streak | `prisma/schema.prisma` | 🟠 L | 1 j | 120 000 |
| 7.2 | API CRUD trades | `api/dashboard/journal/trades/*` | 🟠 L | 1 j | 120 000 |
| 7.3 | API sessions (auto-création, backfill) | `api/dashboard/journal/sessions/*` | 🟡 M | 0,5 j | 60 000 |
| 7.4 | API daily reflections | `api/dashboard/journal/reflections` | 🟡 M | 0,5 j | 60 000 |
| 7.5 | API tags + pairs | `api/dashboard/journal/tags`, `pairs` | 🟡 M | 0,5 j | 60 000 |
| 7.6 | Page journal overview | `dashboard/journal/page.tsx` | 🟠 L | 1 j | 120 000 |
| 7.7 | Stats calculées (PnL, winRate) | service + recharts | 🟡 M | 0,5 j | 60 000 |
| 7.8 | Nudge quotidien (rappel) | cron + email | 🟡 M | 0,5 j | 60 000 |
| 7.9 | Guide "1er signal" intégré | onboarding in-app | 🟢 S | 0,25 j | 30 000 |
| 7.10 | Vue admin overview (tous les users) | `admin/journal/overview` | 🟡 M | 0,5 j | 60 000 |
| **SOUS-TOTAL** | | | | **7 j** | **840 000 FCFA** |

---

# 🎓 8. MODULE COACHING (4 fonctionnalités — 3 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 8.1 | Page coaching admin overview | `admin/coaching/page.tsx` | 🟡 M | 0,5 j | 60 000 |
| 8.2 | Vue détaillée trades (PnL unifié) | `admin/journal/[userId]` | 🟠 L | 1 j | 120 000 |
| 8.3 | Affichage setups (profils trading) | DB + UI | 🟡 M | 0,5 j | 60 000 |
| 8.4 | Helper email relance accès expirés | `scripts/` | 🟡 M | 0,5 j | 60 000 |
| **SOUS-TOTAL** | | | | **3 j** | **360 000 FCFA** |

---

# 👨‍💼 9. ADMIN CENTER — 17 ONGLETS (32 fonctionnalités — 22 j)

## 9.1 Dashboard + Analytics (4 — 3 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.1.1 | Dashboard KPI + MRR + recharts | 🔴 XL | 2 j | 240 000 |
| 9.1.2 | Analytics repensée (vraie dataviz) | 🟠 L | 1 j | 120 000 |
| 9.1.3 | Revenus : MRR timeline + churn alert | 🟠 L | 1 j | 120 000 |
| 9.1.4 | Opérations center (SPA tabs unifié) | 🔴 XL | 2 j | 240 000 |

## 9.2 Membres (5 — 4 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.2.1 | Liste membres (17 onglets skeleton) | 🟠 L | 1 j | 120 000 |
| 9.2.2 | Détail utilisateur complet | 🟠 L | 1 j | 120 000 |
| 9.2.3 | Promote / change role | 🟡 M | 0,5 j | 60 000 |
| 9.2.4 | Détection doublons (nom/email/IP) | 🟠 L | 1 j | 120 000 |
| 9.2.5 | Recherche + pagination + filtres | 🟡 M | 0,5 j | 60 000 |

## 9.3 Signaux admin (3 — 2 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.3.1 | Ongide Signals repensé (layout vertical) | 🟠 L | 1 j | 120 000 |
| 9.3.2 | Éditeur premium (déjà compté 3.4-3.6) | — | — | — |
| 9.3.3 | History + métriques distribution | 🟡 M | 0,5 j | 60 000 |

## 9.4 KYC + Broker admin (2 — 1,5 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.4.1 | File d'attente KYC review (déjà 4.12) | — | — | — |
| 9.4.2 | File d'attente Broker review | 🟡 M | 0,5 j | 60 000 |

## 9.5 Abonnements (4 — 3 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.5.1 | Plans CRUD | 🟡 M | 0,5 j | 60 000 |
| 9.5.2 | Plans Deriv intégrés | 🟡 M | 0,5 j | 60 000 |
| 9.5.3 | Approbation access requests (avec isActive) | 🟡 M | 0,5 j | 60 000 |
| 9.5.4 | Actions batch SSE streaming | 🟠 L | 1 j | 120 000 |

## 9.6 Audit & Sécurité (3 — 2 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.6.1 | Ongide Audit (logs avec intégrité) | 🟠 L | 1 j | 120 000 |
| 9.6.2 | Export audit logs | 🟡 M | 0,5 j | 60 000 |
| 9.6.3 | Audit integrity check | 🟡 M | 0,5 j | 60 000 |

## 9.7 Files (BullMQ) + Queues (3 — 2 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.7.1 | Ongide Files Bull Board | 🟡 M | 0,5 j | 60 000 |
| 9.7.2 | Queues monitoring | 🟡 M | 0,5 j | 60 000 |
| 9.7.3 | DLQ webhooks + replay | 🟡 M | 0,5 j | 60 000 |

## 9.8 Support + Bugs (3 — 2 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.8.1 | Support tickets inbox | 🟡 M | 0,5 j | 60 000 |
| 9.8.2 | Bug reports (depuis dashboard membre) | 🟠 L | 1 j | 120 000 |
| 9.8.3 | Ongide inbox consolidé (admin→user) | 🟡 M | 0,5 j | 60 000 |

## 9.9 Système & cache (3 — 2 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.9.1 | Ongide cache (purge + stats + status) | 🟠 L | 1 j | 120 000 |
| 9.9.2 | Circuit breaker monitoring | 🟡 M | 0,5 j | 60 000 |
| 9.9.3 | Crons monitoring | 🟡 M | 0,5 j | 60 000 |

## 9.10 Sécurité admin (3 — 2 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.10.1 | Ongide security center | 🟠 L | 1 j | 120 000 |
| 9.10.2 | Fraud dashboard (30+ scénarios) | 🟠 L | 1 j | 120 000 |
| 9.10.3 | Modération (bans + sanctions) | 🟡 M | 0,5 j | 60 000 |

## 9.11 Developer & Settings (2 — 1,5 j)

| # | Fonctionnalité | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|
| 9.11.1 | Settings + env management | 🟡 M | 0,5 j | 60 000 |
| 9.11.2 | Developer tools (command palette + search) | 🟠 L | 1 j | 120 000 |

| **SOUS-TOTAL** | | | **22 j** | **2 640 000 FCFA** |

---

# 🔒 10. SÉCURITÉ & ANTI-FRAUDE (18 fonctionnalités — 12 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 10.1 | CSP dynamique avec nonce | `middleware.ts` + dynamic rendering | 🟠 L | 1 j | 120 000 |
| 10.2 | Rate limiting général | `lib/rate-limit/*` | 🟡 M | 0,5 j | 60 000 |
| 10.3 | Rate limit OTP / upload / admin | endpoints multiples | 🟡 M | 0,5 j | 60 000 |
| 10.4 | Audit log service | `lib/audit/*` | 🟠 L | 1 j | 120 000 |
| 10.5 | Audit log integrity (backfill) | `scripts/backfill-audit-integrity.ts` | 🟡 M | 0,5 j | 60 000 |
| 10.6 | Audit log search (backfill) | `scripts/backfill-audit-search.ts` | 🟡 M | 0,5 j | 60 000 |
| 10.7 | Catalogue abuse cases (30+) | `lib/security/abuse-cases.ts` | 🟡 M | 0,5 j | 60 000 |
| 10.8 | Fenêtre brute-force 2 min | service login | 🟡 M | 0,5 j | 60 000 |
| 10.9 | Magic bytes validation | `lib/security/magic-bytes.ts` | 🟡 M | 0,5 j | 60 000 |
| 10.10 | Hard delete users (réinscription) | service | 🟡 M | 0,5 j | 60 000 |
| 10.11 | Anti-MIME falsification | validation uploads | 🟢 S | 0,25 j | 30 000 |
| 10.12 | Headers HSTS, X-Frame, X-Content-Type | config Next.js + Traefik | 🟢 S | 0,25 j | 30 000 |
| 10.13 | Cleanup auth attempts | cron + script | 🟢 S | 0,25 j | 30 000 |
| 10.14 | Cleanup ghost access | `scripts/cleanup-ghost-access.ts` | 🟢 S | 0,25 j | 30 000 |
| 10.15 | Cleanup email events | `scripts/cleanup-email-events.ts` | 🟢 S | 0,25 j | 30 000 |
| 10.16 | Cleanup push subscriptions | `scripts/cleanup-push.ts` | 🟢 S | 0,25 j | 30 000 |
| 10.17 | Brute-force protection (auth) | service login | 🟡 M | 0,5 j | 60 000 |
| 10.18 | Device fingerprint + abuse | `lib/security/fingerprint.ts` | 🟠 L | 1 j | 120 000 |
| **SOUS-TOTAL** | | | | **12 j** | **1 440 000 FCFA** |

---

# 🐳 11. INFRASTRUCTURE & DEVOPS (20 fonctionnalités — 13 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 11.1 | Dockerfile multi-stage production | `Dockerfile` | 🟠 L | 1 j | 120 000 |
| 11.2 | Dockerfile worker séparé | `Dockerfile.worker` | 🟡 M | 0,5 j | 60 000 |
| 11.3 | Standalone Next.js output | config Next.js | 🟢 S | 0,25 j | 30 000 |
| 11.4 | HEALTHCHECK Docker | `Dockerfile` | 🟢 XS | 0,1 j | 12 000 |
| 11.5 | Docker Compose app + Redis + Traefik | `compose.yml` | 🟠 L | 1 j | 120 000 |
| 11.6 | Docker Compose VPS2 worker seul | `compose.vps2.yml` | 🟡 M | 0,5 j | 60 000 |
| 11.7 | VPS2 Tailscale setup | `scripts/deploy-tailscale.sh` | 🟡 M | 0,5 j | 60 000 |
| 11.8 | Resource limits Docker | compose | 🟢 XS | 0,1 j | 12 000 |
| 11.9 | Réseau `nba` rename | compose | 🟢 XS | 0,1 j | 12 000 |
| 11.10 | Redis password + sécurité | compose + auth | 🟢 S | 0,25 j | 30 000 |
| 11.11 | CI GitHub Actions (quality + scan) | `.github/workflows/ci.yml` | 🟠 L | 1 j | 120 000 |
| 11.12 | CD GitHub Actions (deploy GHCR) | `.github/workflows/deploy.yml` | 🟠 L | 1 j | 120 000 |
| 11.13 | Cache GHA + registry | workflows | 🟢 S | 0,25 j | 30 000 |
| 11.14 | Backup B2 cron quotidien | `scripts/backup.sh` | 🟠 L | 1 j | 120 000 |
| 11.15 | Backup email alerts | `scripts/backup.sh` + Resend | 🟡 M | 0,5 j | 60 000 |
| 11.16 | Discord alerts swap/memory | `scripts/` | 🟡 M | 0,5 j | 60 000 |
| 11.17 | Sentry error tracking | config + instrumentation | 🟡 M | 0,5 j | 60 000 |
| 11.18 | PM2 ecosystem (legacy keep-alive) | `ecosystem.config.cjs` | 🟢 S | 0,25 j | 30 000 |
| 11.19 | nba-auto-update.sh (VPS2 pull) | cron | 🟢 S | 0,25 j | 30 000 |
| 11.20 | Neon keep-alive instrumentation | `instrumentation.ts` | 🟡 M | 0,5 j | 60 000 |
| **SOUS-TOTAL** | | | | **13 j** | **1 560 000 FCFA** |

---

# 🧪 12. TESTS & QUALITÉ (6 fonctionnalités — 5 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 12.1 | Tests Vitest unit/integration (~50 fichiers, 5 410 LOC) | `src/**/*.test.ts` | 🔴 XL | 2 j | 240 000 |
| 12.2 | Coverage configuré | `vitest.config.ts` | 🟢 S | 0,25 j | 30 000 |
| 12.3 | ESLint strict (eslint-config-next) | `.eslintrc` | 🟢 S | 0,25 j | 30 000 |
| 12.4 | TypeScript strict + types custom | `tsconfig.json` | 🟡 M | 0,5 j | 60 000 |
| 12.5 | pnpm audit clean | process | 🟢 S | 0,25 j | 30 000 |
| 12.6 | Dependabot weekly updates | `.github/dependabot.yml` | 🟢 XS | 0,1 j | 12 000 |
| **SOUS-TOTAL** | | | | **5 j** | **600 000 FCFA** |

---

# 📚 13. DOCUMENTATION (5 fonctionnalités — 3 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 13.1 | OpenAPI spec auto-généré | `api/docs/openapi.json` | 🟠 L | 1 j | 120 000 |
| 13.2 | README + .env.example complets | `README.md`, `.env.example` | 🟡 M | 0,5 j | 60 000 |
| 13.3 | Documentation scripts (CRONS.md) | `scripts/CRONS.md` | 🟡 M | 0,5 j | 60 000 |
| 13.4 | Issue tracking documents | `docs/` | 🟢 S | 0,25 j | 30 000 |
| 13.5 | Commit messages disciplinés (conventional commits) | process | 🟡 M | 0,5 j | 60 000 |
| **SOUS-TOTAL** | | | | **3 j** | **360 000 FCFA** |

---

# 🎨 14. DESIGN SYSTEM & UI (12 fonctionnalités — 9 j)

| # | Fonctionnalité | Fichiers clés | Complexité | Temps | Valeur FCFA |
|---|---|---|---|---|---|
| 14.1 | Spacing tokens | `tailwind.config` | 🟢 S | 0,25 j | 30 000 |
| 14.2 | Elevation matrix (3 niveaux ombres) | CSS + tokens | 🟢 S | 0,25 j | 30 000 |
| 14.3 | Interactive states (hover/active/focus) | components | 🟢 S | 0,25 j | 30 000 |
| 14.4 | Glassmorphisme premium | components | 🟡 M | 0,5 j | 60 000 |
| 14.5 | Gradients signature (#261) | components | 🟡 M | 0,5 j | 60 000 |
| 14.6 | Statuts sémantiques centralisés | tokens | 🟢 S | 0,25 j | 30 000 |
| 14.7 | StatCard / FilterPills / ConfirmDialog | components | 🟠 L | 1 j | 120 000 |
| 14.8 | Navigation Sidebar + Bottom Nav | components | 🟠 L | 1 j | 120 000 |
| 14.9 | Touch targets 40px+ mobile | refactor | 🟢 S | 0,25 j | 30 000 |
| 14.10 | Confirmation dialogs (universal) | component | 🟡 M | 0,5 j | 60 000 |
| 14.11 | Toast sonner (remplacement alert) | component | 🟢 S | 0,25 j | 30 000 |
| 14.12 | Logo NBA + branding | assets | 🟢 S | 0,25 j | 30 000 |
| **SOUS-TOTAL** | | | | **9 j** | **1 080 000 FCFA** |

---

# 📊 RÉCAPITULATIF FINAL

## Par catégorie

| # | Catégorie | Features | Temps | Valeur FCFA | % du total |
|---|---|---|---|---|---|
| 1 | Authentification | 18 | 11,5 j | 1 380 000 | 8,2 % |
| 2 | RBAC & permissions | 8 | 5 j | 600 000 | 3,6 % |
| 3 | Module Signaux (cœur) | 15 | 18,5 j | 2 220 000 | 13,2 % |
| 4 | KYC & onboarding | 12 | 12 j | 1 440 000 | 8,6 % |
| 5 | Messagerie temps réel | 16 | 14 j | 1 680 000 | 10,0 % |
| 6 | Notifications push | 8 | 5 j | 600 000 | 3,6 % |
| 7 | Journal de trading | 10 | 7 j | 840 000 | 5,0 % |
| 8 | Coaching | 4 | 3 j | 360 000 | 2,1 % |
| 9 | Admin Center (17 onglets) | 32 | 22 j | 2 640 000 | 15,7 % |
| 10 | Sécurité & anti-fraude | 18 | 12 j | 1 440 000 | 8,6 % |
| 11 | Infrastructure & DevOps | 20 | 13 j | 1 560 000 | 9,3 % |
| 12 | Tests & qualité | 6 | 5 j | 600 000 | 3,6 % |
| 13 | Documentation | 5 | 3 j | 360 000 | 2,1 % |
| 14 | Design system & UI | 12 | 9 j | 1 080 000 | 6,4 % |
| **TOTAL** | **184** | **140 j** | **16 800 000 FCFA** | **100 %** |

---

## 💎 Valeur par module "vendable" (top 10)

| Module | Valeur FCFA | Valeur € | Justification |
|---|---|---|---|
| **Admin Center (17 onglets)** | 2 640 000 | 4 000 € | Plus gros module, dashboard BI + KPI + MRR |
| **Module Signaux** | 2 220 000 | 3 364 € | Cœur métier, éditeur + distribution + temps réel |
| **Messagerie temps réel** | 1 680 000 | 2 545 € | WebSocket + Redis adapter + reactions |
| **Infrastructure DevOps** | 1 560 000 | 2 364 € | Multi-VPS + CI/CD + backups |
| **Sécurité & anti-fraude** | 1 440 000 | 2 182 € | CSP + RBAC + audit + abuse catalog |
| **KYC & onboarding** | 1 440 000 | 2 182 € | Capture selfie + magic bytes + auto-cleanup |
| **Authentification** | 1 380 000 | 2 091 € | Better Auth + OTP + multi-device |
| **Design system premium** | 1 080 000 | 1 636 € | Glassmorphisme + recharts + tokens |
| **Journal de trading** | 840 000 | 1 273 € | Trades + sessions + streaks |
| **RBAC** | 600 000 | 909 € | 5 rôles + 11 permissions |
| **TOTAL TOP 10** | **14 880 000 FCFA** | **22 545 €** | **88,5 % de la valeur** |

---

## 💰 Conversion monétaire (plusieurs scénarios)

### Scénario 1 — Vente à l'unité (clients)

Si tu vends chaque module indépendamment :

| Module | Prix catalogue |
|---|---|
| Module Signaux | 50 000 – 80 000 € |
| Admin Center complet | 80 000 – 120 000 € |
| Infrastructure DevOps | 40 000 – 60 000 € |
| Messagerie temps réel | 30 000 – 50 000 € |
| Sécurité (CSP + audit + RBAC) | 25 000 – 40 000 € |
| KYC complet | 20 000 – 35 000 € |
| Authentification | 15 000 – 25 000 € |
| Design system | 15 000 – 25 000 € |

### Scénario 2 — Licence complète (SaaS white-label)

| Élément | Tarif annuel |
|---|---|
| Setup initial (branding + config) | 8 000 € |
| Licence annuelle par client | 30 000 – 60 000 € |
| Maintenance + support | 12 000 € |
| **Total an 1** | **50 000 – 80 000 €** |

### Scénario 3 — Cession totale

| | Valeur |
|---|---|
| **Valeur catalogue totale (140 j × 120k FCFA + bonus)** | **~25 millions FCFA** |
| **Valeur de remplacement réaliste** | **18 500 000 FCFA** |
| **Valeur agence Europe** | **100 000 – 160 000 €** |

---

## 🎯 Justification client — messages clés

> *« Le module Signaux seul (cœur métier avec éditeur Notion-like + chart SVG + diffusion temps réel) représente 18,5 jours-homme de développement, soit **2 220 000 FCFA** à 120 000 FCFA/jour. »*

> *« L'Admin Center avec ses 17 onglets et ses vues BI (KPI, MRR, recharts) représente 22 jours-homme, soit **2 640 000 FCFA**. »*

> *« L'ensemble du projet comporte 184 fonctionnalités documentées, soit 140 jours-homme valorisés à **16,8 millions FCFA** au tarif d'un développeur senior. »*

> *« Avec le bonus qualité production (0 vulnérabilité, 8 releases, design premium, multi-VPS), la valeur catalogue atteint **25 millions FCFA** (~37 500 €). »*

---

*Document confidentiel — usage strictement privé*
*Généré le 3 septembre 2026*
*Total : 184 fonctionnalités documentées et valorisées*