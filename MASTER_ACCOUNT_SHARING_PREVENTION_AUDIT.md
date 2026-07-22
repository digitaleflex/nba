# MASTER_ACCOUNT_SHARING_PREVENTION_AUDIT

Version : 1.0

Audit complet de l'architecture d'authentification, des sessions, des abonnements et de la protection contre le partage frauduleux des comptes.

---

## 1. Résumé Exécutif

**Projet** : NeverBrokeAgain (NBA / Signauxx) — Plateforme SaaS de signaux de trading

**Stack** : Next.js 16 / Better Auth 1.6.20 / Prisma / PostgreSQL (Neon) / Redis / Socket.IO

**Constat Principal** : L'application est **totalement vulnérable au partage de compte**. Aucun mécanisme de détection ou de prévention n'est en place. Les utilisateurs peuvent librement partager leurs identifiants sans aucune restriction.

**Score de maturité sécurité** : 2/10

---

## 2. Cartographie Complète du Projet

### 2.1 Arborescence Fonctionnelle

```
Application (NBA)
│
├── Auth (Better Auth)
│   ├── Login (email/password)
│   ├── Register (multi-step)
│   ├── Password Reset
│   ├── Email Verification
│   └── Session Management
│
├── Subscription / Access Control
│   ├── Plans (6 plans, price=0)
│   ├── Access Requests (admin-approved)
│   └── Plan Selection
│
├── Signals (Core Product)
│   ├── Creation (admin)
│   ├── Distribution (multi-channel)
│   ├── Access Policy (plan-based)
│   └── Real-time (WebSocket)
│
├── Notifications
│   ├── In-App
│   ├── Email (Resend)
│   ├── Push (Web Push VAPID)
│   ├── Telegram
│   └── WhatsApp
│
├── Users & Roles (RBAC)
│   ├── Role (USER, ADMIN, SUPER_ADMIN)
│   ├── Permissions
│   └── Profile Management
│
├── Admin Dashboard
│   ├── User Management
│   ├── Access Requests
│   ├── Signal Management
│   ├── Audit Logs
│   └── Analytics
│
├── Onboarding
│   ├── Profile
│   ├── KYC (Identity Verification)
│   └── Broker Verification
│
├── Training Journal
│   ├── Trades
│   ├── Reflections
│   ├── Sessions
│   └── Statistics
│
└── Infrastructure
    ├── Docker / Docker Compose
    ├── Redis (Rate Limit, Queue, Pub/Sub)
    ├── PostgreSQL (Neon)
    ├── MinIO / imgproxy (Storage)
    └── Socket.IO (WebSocket)
```

### 2.2 Relations entre Modules

```
User ────→ Sessions (∞ par user, aucune limite)
  │
  ├──→ Accounts (credentials, OAuth)
  ├──→ AccessRequests ──→ SubscriptionPlan
  ├──→ Role ──→ Permissions
  ├──→ Devices (info uniquement, non enforce)
  ├──→ DeviceVerifications
  ├──→ Notifications ──→ NotificationDeliveries
  ├──→ Signals (reads, favorites, archives)
  ├──→ AuditLogs
  └──→ Trades / JournalSession / DailyReflection
```

### 2.3 Flux d'Authentification Actuel

```
1. REGISTER
   Browser → POST /api/auth/sign-up (better-auth)
   → User created in DB
   → Session cookie set (7 days)
   → Redirect to /onboarding

2. LOGIN
   Browser → POST /api/auth/sign-in (custom wrapper)
   → better-auth signInEmail()
   → Session cookie set (7 days)
   → Redirect to /dashboard

3. MIDDLEWARE (Edge)
   Vérifie existence cookie `better-auth.session_token`
   Routes protégées : /dashboard, /admin, /onboarding
   Routes publiques : /login, /register, /api/public

4. SERVER-SIDE SESSION
   getServerSession() → cache() → auth.api.getSession(headers)
   Utilisé par requireAuth(), requireActiveUser(), requireRole(), requirePermission()

5. WEBSOCKET AUTH
   Cookie vérifié → HMAC signé → Session lookup DB
   → socket.join(`user:${userId}`)
```

---

## 3. Inventaire Technologique

| Catégorie | Technologie | Version | Notes |
|-----------|------------|---------|-------|
| **Framework** | Next.js | 16+ | App Router |
| **Auth** | Better Auth | 1.6.20 | Prisma adapter, next-js plugin |
| **ORM** | Prisma | Dernière | PostgreSQL provider |
| **Base de données** | PostgreSQL (Neon) | - | Serverless |
| **Cache / Queue** | Redis + BullMQ | - | Rate limiting, Pub/Sub |
| **Temps réel** | Socket.IO | - | Redis adapter |
| **UI** | React (Next.js) + Design System custom | - | shadcn/ui inspired |
| **Email** | Resend | - | Transactionnel |
| **Push** | Web Push (VAPID) | - | Notification push |
| **Monitoring** | Sentry | - | Frontend + Backend |
| **Stockage** | MinIO (S3-compatible) + Local | - | Fichiers, KYC, images |
| **Validation** | Zod | - | Schémas de validation |
| **CI/CD** | GitHub Actions | - | 2 workflows |
| **Conteneurisation** | Docker + Docker Compose | - | 2 compose files |
| **Cloud** | Cloudflare | - | DNS, CDN |

---

## 4. Cartographie des Données Sensibles

| Donnée | Créée | Stockée | Modifiée | Supprimée | Risque |
|--------|-------|---------|----------|-----------|--------|
| Email | Register | `User.email` | Change Email | Hard delete | 🟡 |
| Mot de passe | Register | `Account.password` (hash) | Change Password | Hard delete | 🔴 |
| Session Token | Login | `Session.token` + Cookie | Refresh | Logout/Revoke | 🔴 |
| IP Address | Every request | `Session.ipAddress`, `Device.ipAddress`, `AuditLog.ipAddress` | - | - | 🟡 |
| User Agent | Every request | `Session.userAgent`, `Device.userAgent` | - | - | 🟢 |
| Device Fingerprint | Device verify | `Device.fingerprint` | Update | Revoke | 🟡 |
| OTP Code | Send OTP | `Verification.value`, `DeviceVerification.verificationCode` | - | Cleanup | 🔴 |
| KYC Documents | Upload | `KycDocument.*FilePath` (local/S3) | - | Hard delete | 🔴 |
| Cookies | Login | Browser (signed) | Refresh | Logout | 🔴 |
| Whatsapp | Register | `User.whatsapp` | Profile | Hard delete | 🟡 |
| Téléphone | Register | `User.phone` | Profile | Hard delete | 🟡 |

---

## 5. Cartographie des Flux d'Authentification

### Flux détaillé : Login → Session → Abonnement → Accès Signaux

```
Utilisateur
    │
    ├── POST /api/auth/sign-in
    │   ├── Rate limit check (5 req/60s par IP)
    │   ├── better-auth signInEmail()
    │   │   ├── Vérifie email/password (bcrypt)
    │   │   ├── Crée Session (token, ipAddress, userAgent, expiresAt: 7j)
    │   │   ├── Set-Cookie: better-auth.session_token=<signed>
    │   │   └── UpdateAge: 24h (stale session prevention)
    │   └── Audit log on failure (LOGIN_FAILED)
    │
    ├── Redirection → /dashboard
    │
    ├── Middleware (Edge)
    │   ├── Vérifie présence du cookie
    │   └── Passe si cookie présent (MÊME EXPIRÉ / INVALIDE)
    │       └── ⚠️ Le middleware ne vérifie PAS la validité du cookie
    │
    ├── Dashboard Layout (Server Component)
    │   ├── getServerSession() → auth.api.getSession()
    │   │   ├── Vérifie token en DB
    │   │   ├── Vérifie expiration
    │   │   └── Retourne null si invalide → redirect /login
    │   └── Vérifie rôle en DB
    │
    ├── Accès aux Signaux
    │   ├── getSignalsApi()
    │   │   ├── getServerSession() (vérifie session valide)
    │   │   ├── Vérifie isActive
    │   │   ├── Récupère plans APPROUVÉS (AccessRequest)
    │   │   └── Filtre signaux par planIds
    │   │
    │   └── canViewSignal()
    │       ├── Vérifie rôle ADMIN / signalsAccessOverride
    │       └── Vérifie AccessRequest APPROUVÉ pour le plan
    │
    └── Distribution des Signaux (Worker)
        ├── findMany users with:
        │   ├── isActive: true, deletedAt: null
        │   └── AccessRequest APPROUVÉ OU signalsAccessOverride
        ├── Crée Notification par membre
        └── Envoie via tous les canaux
```

### Points Critiques Identifiés dans le Flux

1. **Middleware** : Vérifie **l'existence** du cookie, pas sa **validité** → cookie expiré passe le middleware
2. **Session illimitées** : Aucune limite de sessions simultanées
3. **Aucun device tracking** : `detectNewDevice()` défini mais jamais appelé
4. **Aucune 2FA** : Pas de multi-facteur
5. **Aucune anomalie IP** : Pas de détection d'impossible travel

---

## 6. Forces de l'Architecture

### 6.1 Ce qui est bien conçu

| Force | Description |
|-------|-------------|
| **Better Auth** | Choix robuste, maintenu, avec bonnes primitives de sécurité |
| **Session en DB** | Permet listing et révocation centralisés |
| **Rate Limiting (Redis)** | Protection contre brute-force sur auth endpoints (sliding window) |
| **CSRF Protection** | Vérification origin/referer sur mutations API |
| **Anti-enumération** | `/api/auth/check-login` retourne toujours "ok" |
| **Audit Logging** | Toutes les actions sensibles sont loguées avec hash d'intégrité |
| **Account Suspension** | `isActive` flag, check dans `requireActiveUser()` |
| **Email Banning** | Vérification dans `databaseHooks.user.create.before` |
| **IP Trust** | `ipAddressHeaders` configuré selon l'environnement |
| **Password minimum** | 10 caractères minimum |
| **Cookie HMAC signé** | Protection contre la falsification des cookies (vérifié en WS) |
| **Device Verification** | Code de vérification pour nouveaux appareils (existe mais non enforce) |
| **Session Update Age** | Refresh implicite toutes les 24h (stale session prevention) |
| **Transaction retry** | `withRetryTransaction` pour les opérations concurrentes |

---

## 7. Faiblesses de l'Architecture

### 7.1 Absence Totale de Protection Anti-Partage

| Faiblesse | Criticité | Description |
|-----------|-----------|-------------|
| **Aucune limite de sessions** | 🔴 Critique | Un utilisateur peut avoir un nombre illimité de sessions simultanées |
| **Aucune limite d'appareils** | 🔴 Critique | Aucune limite sur le nombre d'appareils connectés |
| **Device tracking non enforce** | 🔴 Critique | `detectNewDevice()` existe mais n'est JAMAIS appelé dans le flux de login |
| **Aucune 2FA/MFA** | 🟠 Élevée | Seul un mot de passe protège le compte |
| **Aucune détection d'anomalie IP** | 🟠 Élevée | Impossible travel, pays inhabituels, IPs multiples |
| **Aucune notification de sécurité** | 🟠 Élevée | Pas d'alerte email lors d'une connexion depuis un nouvel appareil |
| **Plans gratuits (price=0)** | 🟡 Moyenne | Aucune friction financière pour le partage |
| **Cookie middleware laxiste** | 🟡 Moyenne | Vérifie existence, pas validité du cookie |

### 7.2 Faiblesses Architecturales Générales

| Faiblesse | Criticité | Description |
|-----------|-----------|-------------|
| **Responsabilités mélangées** | 🟡 Moyenne | Logique métier dans les routes API (onboarding-status, select-plan) |
| **Modules vides** | 🟢 Faible | 17 modules domaines créés mais tous vides |
| **Code mort** | 🟢 Faible | `detectNewDevice()` jamais appelé |
| **Pas de test d'intégration auth** | 🟡 Moyenne | Tests unitaires limités |
| **Secrets en clair** | 🟠 Élevée | `.env` contient clés API en clair (Resend, etc.) |
| **Redis SPOF** | 🟠 Élevée | Rate limiting et queue tombent si Redis indisponible |

---

## 8. Dette Technique

### Priorité Haute

| ID | Dette | Description | Impact |
|----|-------|-------------|--------|
| T-01 | **Device tracking non intégré** | `detectNewDevice()` défini, jamais appelé dans login | Sécurité : partage de compte invisible |
| T-02 | **Modules domaines vides** | 17 modules créés mais vides, code dans `src/lib/services/` | Architecture : non-respect de la modularité |
| T-03 | **Logique métier dans route handlers** | `select-plan/route.ts`, `onboarding-status/route.ts` | Maintenabilité : difficile à tester |

### Priorité Moyenne

| ID | Dette | Description | Impact |
|----|-------|-------------|--------|
| T-04 | **Pas de test d'intégration auth** | Tests unitaires seulement, pas de scénario de partage | Qualité : failles non détectées |
| T-05 | **Rate limit sans fallback gracieux** | Redis down → tous les rate limits bloquent | Disponibilité : 503 en cascade |
| T-06 | **Price=0 en production** | Plans avec price=0, pas de paiement | Business : pas de monétisation |
| T-07 | **Pas de monitoring sécurité** | Aucune métrique sur les tentatives de connexion suspectes | Ops : aveugle sur les attaques |

### Priorité Basse

| ID | Dette | Description |
|----|-------|-------------|
| T-08 | `console.log` dans le code de production | Signal distribution, workers |
| T-09 | Modules vides vs code dans `src/lib/services` | Incohérence architecturale |
| T-10 | Magic strings (ex: "ADMIN", "SUPER_ADMIN") | Pas de constantes typées |

---

## 9. Dette de Sécurité

### Critique (Exploitation Immédiate)

| ID | Dette | Description | Détection |
|----|-------|-------------|-----------|
| **S-01** | **Aucune limite de sessions simultanées** | Un utilisateur peut avoir 100+ sessions actives | Trivial : ouvrir sessions multiples |
| **S-02** | **Aucune limite d'appareils** | Aucune restriction sur le nombre d'appareils | Trivial : login depuis N appareils |
| **S-03** | **Device detection non enforce** | Nouvel appareil = pas de vérification, pas d'alerte | Trivial : login depuis nouveau device |

### Élevée (Exploitation Possible à Court Terme)

| ID | Dette | Description | Détection |
|----|-------|-------------|-----------|
| **S-04** | **Pas de 2FA/MFA** | Mot de passe seule protection | Test : pas d'option 2FA dans UI |
| **S-05** | **Pas de notifications de sécurité** | Aucun email pour nouveau login/appareil | Test : se connecter depuis nouveau device |
| **S-06** | **Pas de détection d'anomalie IP** | Impossible travel, Tor/VPN, IP inhabituelle | Audit : pas de check |
| **S-07** | **Middleware ne vérifie pas la validité du cookie** | Cookie expiré passe le middleware | Test : envoyer cookie expiré |
| **S-08** | **Secrets exposés dans `.env`** | Clés API Resend, MinIO en clair | Audit : lire `.env` |

### Moyenne (Exploitation Nécessite Autre Faille)

| ID | Dette | Description | Détection |
|----|-------|-------------|-----------|
| **S-09** | **Pas de géolocalisation des connexions** | Aucune donnée geo dans sessions | Audit : session.ipAddress stocké mais pas analysé |
| **S-10** | **Historique de connexions limité** | Session log mais pas d'analyse temporelle | Audit : pas de dashboard connexions |
| **S-11** | **Rate limit Redis dépendant** | Redis down = rate limit cassé → 503 | Test : stopper Redis |
| **S-12** | **Password reset sans vérification de session active** | Reset ne révoque pas les autres sessions | Test : reset password, anciennes sessions restent |
| **S-13** | **Aucun audit des accès admin aux données users** | Admin peut lire données sans trace | Audit : pas d'audit sur admin read |

### Faible (Amélioration Recommandée)

| ID | Dette | Description |
|----|-------|-------------|
| **S-14** | `signalsAccessOverride` bypass trop large | Permet accès total sans subscription check |
| **S-15** | SessionStorage pour formulaire d'inscription | Données personnelles en sessionStorage client |
| **S-16** | Pas de CSP headers | Aucune Content Security Policy |
| **S-17** | Pas de rate limiting sur la route API session listing | Listing sessions non protégé |
| **S-18** | Session cookie pas HttpOnly (dépend de Better Auth config) | Vérifier configuration cookie |

---

## 10. Analyse Détaillée : Mécanismes de Partage de Compte

### 10.1 Scénarios de Partage Possibles

#### Scénario A : Partage d'Identifiants (le plus simple)
```
1. Alice crée un compte, choisit un plan
2. Alice donne email + mot de passe à Bob, Charlie, David
3. Bob, Charlie, David se connectent depuis leurs appareils
4. Chacun a sa propre session (4 sessions actives simultanées)
5. Tous reçoivent les signaux de trading en temps réel
6. Aucune détection possible
```
**Probabilité : Très élevée** | **Détection : Aucune**

#### Scénario B : Partage de Cookie Session
```
1. Alice se connecte, obtient cookie `better-auth.session_token`
2. Alice exporte le cookie et l'envoie à Bob
3. Bob importe le cookie dans son navigateur
4. Bob accède au dashboard sans mot de passe
5. Session partagée : actions de Bob visibles comme Alice
```
**Probabilité : Élevée** (cookie non HttpOnly peut être exporté)
**Détection : Limité** (même session, IP/user-agent changerait)

#### Scénario C : Accès Admin Frauduleux
```
1. Admin légitime crée un accès avec signalsAccessOverride=true
2. Admin partage avec des utilisateurs non autorisés
3. Ces utilisateurs voient tous les signaux
```
**Probabilité : Faible** (accès admin nécessaire)
**Détection : Possible si audit logging analysé**

### 10.2 Vecteurs d'Exploitation Détaillés

#### Vector 1 : Sessions Multiples (CRITIQUE)
- **Où** : `auth.ts` session config, `sessions` table
- **Comment** : Better Auth ne limite pas le nombre de sessions par défaut. Aucune logique custom
- **Code** : `src/lib/auth.ts` - pas de `maxSessions` config
- **Impact** : Partage de compte massif et indétectable

#### Vector 2 : Device Tracking Non Enforcé (CRITIQUE)
- **Où** : `src/lib/services/device.ts` - `detectNewDevice()`
- **Comment** : La fonction est définie mais **jamais appelée** dans le flux de login
- **Code** : `detectNewDevice` n'est importée nulle part
- **Preuve** : `grep detectNewDevice` → 1 résultat (la définition)
- **Impact** : Nouvel appareil = pas de vérification, pas d'alerte

#### Vector 3 : Absence de 2FA (ÉLEVÉ)
- **Où** : `auth.ts` config
- **Comment** : Aucun plugin 2FA/TOTP configuré
- **Code** : `plugins: [nextCookies()]` - pas de `twoFactor()`
- **Impact** : Mot de passe seule barrière, facilement partageable

#### Vector 4 : Pas de Notification de Sécurité (ÉLEVÉ)
- **Où** : `src/lib/auth.ts`, `src/app/api/auth/sign-in/route.ts`
- **Comment** : Aucune alerte pour nouveau login/appareil
- **Preuve** : Login enregistre audit `LOGIN_FAILED` mais jamais `LOGIN_SUCCESS` avec alerte
- **Impact** : Alice ne sait pas que Bob utilise son compte

#### Vector 5 : Plans Gratuits (MOYEN)
- **Où** : `scripts/seed.ts`, plans avec `price: 0`
- **Comment** : Aucune barrière financière au partage
- **Impact** : Pas de friction : partager un compte gratuit ne coûte rien

---

## 11. Analyse des Sessions

### 11.1 Cycle de Vie d'une Session

```
Création
  ↓
POST /api/auth/sign-in → better-auth signInEmail()
  → INSERT INTO sessions (userId, token, expiresAt, ipAddress, userAgent)
  → Set-Cookie: better-auth.session_token=<hmac_signed_token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800 (7 jours)
  ↓
Middleware
  ↓
Vérifie existence cookie (PAS validité)
  ↓
Route Handler
  ↓
getServerSession() → auth.api.getSession(headers) → vérifie token en DB
  ↓
Expiration (7 jours) OU Refresh implicite (24h) OU Révocation explicite
```

### 11.2 Problèmes Identifiés

| Problème | Détail |
|----------|--------|
| **Pas de `HttpOnly` garanti** | Dépend de la config Better Auth / nextCookies |
| **Pas de `SameSite=Strict`** | Actuellement `Lax`, pourrait être `Strict` |
| **Cookie non chiffré** | Token en clair (signé HMAC mais pas chiffré) |
| **Pas de rotation de token** | Même token jusqu'à expiration |
| **Aucune limite de sessions** | N sessions par utilisateur |
| **Pas de géolocalisation** | IP stockée, pas utilisée pour la détection |

---

## 12. Analyse des Appareils (Device)

### 12.1 État Actuel

Le système d'appareils (`Device` model) est **partiellement implémenté** :

- ✅ Modèle de données complet (`Device` avec fingerprint, type, brand, OS, browser)
- ✅ Service `device.ts` avec CRUD complet
- ✅ API `/api/dashboard/devices` pour lister/gérer
- ✅ UI "Mes appareils" avec rename/revoke
- ✅ Vérification de code par email pour nouveaux appareils
- ❌ **`detectNewDevice()` n'est jamais appelé pendant le login**
- ❌ **Aucune vérification de nouvel appareil à la connexion**
- ❌ **Aucune alerte lors d'une connexion depuis un nouvel appareil**
- ❌ **Device fingerprint basé sur `ip|user-agent` facilement contournable**

### 12.2 Faiblesse du Fingerprinting

```typescript
function fingerprint(req: Request): string {
  const ua = req.headers.get("user-agent") ?? ""
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  return `${ip}|${ua}`
}
```

- IP changeante (mobile, VPN, partage) → nouveau fingerprint
- User-agent identique sur même navigateur → fingerprint identique
- Facilement contournable en modifiant le user-agent

---

## 13. Analyse des Abonnements

### 13.1 Modèle Actuel

```
SubscriptionPlan (6 plans, price=0)
    ↑
AccessRequest (userId, planId, status: PENDING/APPROVED/REJECTED/SUSPENDED/REVOKED)
    ↑
User
```

- Plans sont gratuits (`price: 0` en Decimal(10,2))
- Pas de paiement intégré (statuts `PAYMENT_PENDING`/`PAYMENT_CONFIRMED` inutilisés)
- Approbation manuelle par admin
- Accès vérifié par `hasActiveAccess()` → `findFirst({status: "APPROVED"})`
- Pas de date d'expiration effective (seulement `durationDays` dans SubscriptionPlan)
- Pas de vérification de `durationDays` dans le code

### 13.2 Problèmes

| Problème | Détail |
|----------|--------|
| **Pas de vérification d'expiration** | `durationDays` stocké mais jamais utilisé |
| **Pas de limite de plans** | Un utilisateur peut avoir plusieurs plans |
| **Pas de limite de partage** | Rien n'empêche N personnes d'utiliser le même abonnement |
| **signalsAccessOverride bypass** | Un admin peut donner accès sans subscription |
| **Email verified = accès** | `onboarding-status` donne accès si email vérifié (`hasAccess = ... emailVerified` ligne 64) |

---

## 14. Conclusion de l'Audit (Phase 1)

### Constat Général

L'application NBA est **structurellement vulnérable au partage de compte**. Aucun des mécanismes essentiels de protection n'est en place :

1. ❌ **Pas de limite de sessions simultanées**
2. ❌ **Pas de limite d'appareils**
3. ❌ **Pas de détection de nouvel appareil pendant l'authentification**
4. ❌ **Pas de 2FA/MFA**
5. ❌ **Pas de notifications de sécurité**
6. ❌ **Pas de détection d'anomalies (IP, géolocalisation, comportement)**
7. ❌ **Pas de vérification de la validité du cookie dans le middleware**
8. ❌ **Plans gratuits sans friction**

### Ce qui Existe (mais insuffisant)

- ✅ Rate limiting (Redis) sur auth endpoints
- ✅ CSRF protection
- ✅ Audit logging (mais pas d'analyse)
- ✅ Session listing/revocation (réactif, pas préventif)
- ✅ Device verification code (existe mais non enforce)
- ✅ Anti-enumeration sur check-login

### Score de Maturité Anti-Partage

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Session Management | 2/10 | Base solide (DB sessions), mais pas de limites |
| Device Management | 3/10 | Modèle complet, mais pas enforce |
| 2FA/MFA | 0/10 | Absent |
| Anomaly Detection | 0/10 | Absent |
| Security Notifications | 1/10 | Device verification email existe, rien d'autre |
| Rate Limiting | 7/10 | Bon, mais SPOF Redis |
| Audit | 6/10 | Bon, mais pas d'alerting |
| **TOTAL** | **2.7/10** | **Protection quasi inexistante** |

---

---
---

# PHASE 2 — ARCHITECTURE CIBLE & CONCEPTION

---

## 15. Threat Modeling (STRIDE)

Analyse systématique des menaces avant toute implémentation.

### 15.1 Spoofing (Usurpation d'Identité)

| Menace | Vecteur | Impact | Surface |
|--------|---------|--------|---------|
| Partage de mot de passe | Identifiants partagés entre utilisateurs | Perte revenue, fraude | Login endpoint |
| Cookie theft | XSS, session hijacking | Accès non autorisé | Cookie session |
| Session replay | Vol de token session | Accès permanent | API endpoints |
| Device spoofing | User-agent falsifié | Contournement device check | Login endpoint |
| IP spoofing | Headers X-Forwarded-For falsifiés | Contournement géolocalisation | Headers proxy |
| 2FA bypass | Code OTP intercepté | Accès compte | 2FA endpoint |

**Mitigation** :
- Session binding (device fingerprint + IP range)
- Rotation des tokens de session
- Validation HMAC des cookies (déjà présent en WS)
- `HttpOnly` + `SameSite=Strict` sur cookies session
- Rate limiting renforcé sur les endpoints sensibles
- Détection de User-Agent incohérent

### 15.2 Tampering (Altération)

| Menace | Vecteur | Impact | Surface |
|--------|---------|--------|---------|
| Altération session | Modification token session | Privilèges non autorisés | Session token |
| Device fingerprint | Falsification fingerprint | Contournement appareil | Device storage |
| Security events | Suppression/modification logs | Effacement traces | Audit/events DB |
| Rate limiting counters | Redis flush | Contournement rate limit | Redis |
| Plan override | Admin frauduleux | Accès non autorisé | Admin API |

**Mitigation** :
- Chainage cryptographique des audit logs (déjà présent avec hash)
- Signature HMAC des tokens session (déjà présent)
- WAL logging PostgreSQL pour détection de tampering
- Vérification d'intégrité périodique des audit logs
- Admin actions enregistrées avec double signature (action + reviewer)

### 15.3 Repudiation (Reniement)

| Menace | Vecteur | Impact | Surface |
|--------|---------|--------|---------|
| Connexion non tracée | Pas d'audit LOGIN_SUCCESS | Utilisateur nie connexion | Login |
| Accès signaux non tracé | Pas d'audit de lecture | Utilisateur nie réception | Signal view |
| Changement plan non tracé | Pas d'audit admin | Admin nie action | Admin |
| Partage volontaire | Pas de preuve | Utilisateur nie partage | Toutes actions |

**Mitigation** :
- Audit logging obligatoire sur toutes les actions d'authentification (LOGIN_SUCCESS ajouté)
- Horodatage certifié (NTP)
- Notification email pour toutes les actions sensibles (traçabilité utilisateur)
- Conservation des logs minimum 1 an (RGPD/GDPR compliance)
- Export des preuves de connexion pour l'utilisateur

### 15.4 Information Disclosure (Fuites)

| Menace | Vecteur | Impact | Surface |
|--------|---------|--------|---------|
| Données utilisateur | Partenaire malveillant lit données abonnement | Fuite stratégique | Dashboard |
| Device fingerprint | Données fingerprint exposées | Vie privée | Device API |
| IP addresses stockées | GeoIP dans logs | Vie privée | DB sessions |
| Signal content | Scraping via partage | Perte IP | Signal distribution |
| PII dans emails | Nom/email exposés dans notifications | Vie privée | Email service |

**Mitigation** :
- Pagination et rate limiting sur API listing
- Anonymisation des IPs dans les logs après 30 jours
- Device fingerprint hashé (pas stocké en clair)
- Encryption au repos (PostgreSQL TDE / column encryption)
- RGPD : droit à l'oubli, export, portabilité

### 15.5 Denial of Service (Déni de Service)

| Menace | Vecteur | Impact | Surface |
|--------|---------|--------|---------|
| Session flooding | Création massive de sessions | Épuisement DB | Login |
| Device flooding | Création massive devices | Épuisement DB | Device verify |
| 2FA code bombing | Demande massive codes 2FA | SPOF email | 2FA |
| Rate limit exhaustion | Requêtes massives | Blocage légitimes | Tous endpoints |
| Redis exhaustion | Flood rate limit keys | Crash mémoire | Redis |

**Mitigation** :
- Limite stricte de sessions par utilisateur (5-20 selon plan)
- Rate limiting multi-couche (IP + User + Global)
- Circuit breaker sur services externes (Resend, Redis)
- Alerting sur métriques de sessions actives
- Pagination et limits sur tous les listings

### 15.6 Elevation of Privilege (Élévation de Privilèges)

| Menace | Vecteur | Impact | Surface |
|--------|---------|--------|---------|
| Admin takeover | Session admin volée | Contrôle total | Admin sessions |
| Plan bypass | Contournement access request | Accès signaux sans abonnement | Signal policy |
| Role escalation | Modification rôle | Privilèges admin | User update API |
| Impersonation bypass | Contournement mécanisme impersonate | Accès admin | Impersonation |

**Mitigation** :
- Sessions admin avec durée réduite (24h max)
- 2FA obligatoire pour les admins
- Double validation pour actions sensibles (approve/reject access)
- Audit logging obligatoire pour tout changement de rôle
- Impersonation avec journalisation complète

---

## 16. Attack Surface Mapping

### 16.1 Surfaces d'Attaque par Priorité

```
PRIORITÉ 1 (Exploitation immédiate - sans authentification)
├── /api/auth/sign-in      (login)
├── /api/auth/sign-up      (registration)
├── /api/auth/check-login  (anti-enumeration, mais rate limité)
├── /api/public/plans      (plans listing)
├── /api/public/select-plan (plan selection)
├── /api/webhooks/resend   (webhook - signature vérifiée)
└── /api/push/subscribe    (push subscription)

PRIORITÉ 2 (Nécessite authentification)
├── /api/sessions           (session listing)
├── /api/dashboard/devices  (device management)
├── /api/dashboard/signals  (signal access)
├── /dashboard/*            (UI dashboard)
└── WebSocket (socket.io)

PRIORITÉ 3 (Nécessite admin)
├── /api/admin/members      (user management)
├── /api/admin/access-requests (access control)
├── /api/admin/signals      (signal management)
└── /api/admin/impersonate  (user impersonation)
```

### 16.2 Matrice Attaque vs Défense

| Surface | Attaque Partagée | Défense Actuelle | Défense Cible |
|---------|-----------------|------------------|---------------|
| `/api/auth/sign-in` | Partage identifiants | Rate limit IP | + Session limit + Device check + Risk scoring + 2FA |
| Session cookie | Cookie sharing | HMAC signé | + Device binding + IP binding + Rotation |
| `/api/dashboard/signals` | Multi-session access | Plan filter | + Concurrency monitor + Rate limiting |
| WebSocket | Multi-socket | Cookie auth | + Session binding + Device check |
| `/api/sessions` | Session enumeration | Auth required | + Rate limit + Own sessions only |
| `/api/public/select-plan` | Plan selection abuse | Rate limit | + Max plans limit + Cooldown |

---

## 17. Business Abuse Cases

### 17.1 Cas d'Usage Frauduleux (Stories)

#### F-01 : Partage de Compte Familial
```
Titre : Famille Dupont partage un abonnement "Signals X Pro Forex"
Membre A : s'abonne (30€/mois hypothétique)
Membre B, C, D : utilisent le même login depuis 3 appareils différents
Durée : 6 mois sans détection
Impact : -75% de revenu potentiel (4 utilisateurs pour 1 abonnement)
Détection actuelle : AUCUNE
```

#### F-02 : Revente d'Accès
```
Titre : Revente d'accès sur Telegram/WhatsApp
Revenseur : s'abonne à "Signals X Pro Forex + Deriv"
Revenseur : crée 5 sessions depuis des IP différentes
Revenseur : revend l'accès à 5 personnes à 10€/mois chacun
Profit revendeur : 50€/mois sur un abonnement à 30€
Plateforme : perte de 5 clients potentiels
Détection actuelle : AUCUNE
```

#### F-03 : Scraping Automatisé de Signaux
```
Titre : Bot de scraping de signaux
Attaquant : s'abonne à "Signals X Pro"
Attaquant : script Python avec 10 sessions parallèles
Attaquant : scrape tous les signaux en temps réel
Attaquant : revend les données sur un site concurrent
Durée : 48h pour scraper 3 mois de signaux
Détection actuelle : AUCUNE (pas de rate limit ni concurrency check)
```

#### F-04 : Fraude à l'Inscription Multiple
```
Titre : Création de comptes multiples pour période d'essai
Attaquant : crée 50 comptes avec des emails jetables
Attaquant : chaque compte a une session active
Attaquant : utilise les 50 comptes en parallèle
Impact : contournement de la limite d'essai + scraping massif
Détection actuelle : Rate limit 3 signups/h par IP (contournable via VPN)
```

#### F-05 : Admin Frauduleux
```
Titre : Admin vend l'accès à des comptes
Admin malveillant : active signalsAccessOverride sur comptes non autorisés
Admin malveillant : approuve des access requests fictives
Impact : fuite de signaux vers des non-abonnés
Détection actuelle : Audit logging, mais pas d'alerting automatique
```

### 17.2 Arbre de Décision Anti-Fraude

```
Connexion utilisateur
│
├── Email + Password OK
│   ├── Vérifier Rate Limit (IP + User)
│   │   └── Bloquer si > 5 tentatives/60s
│   │
│   ├── Vérifier Limite Sessions
│   │   ├── < Max → Continue
│   │   └── ≥ Max → Prompt "Révoquer ancienne session" ou Blocage
│   │
│   ├── Vérifier Appareil
│   │   ├── Connu + Trusted → Skip
│   │   ├── Connu + Non trusted → Check 2FA si plan premium
│   │   ├── Nouveau → Envoyer code vérification email
│   │   └── Suspect (VPN/Proxy) → Check 2FA obligatoire + alerte
│   │
│   ├── Vérifier 2FA
│   │   ├── Pas activé → Skip (recommander activation)
│   │   ├── Activé + Trusted device → Skip
│   │   └── Activé + Nouveau device → Valider TOTP
│   │
│   ├── Risk Scoring (Async)
│   │   ├── Impossible Travel Check
│   │   ├── IP Reputation Check
│   │   ├── Login Velocity Check
│   │   ├── Behavioral Score
│   │   └── Si Risk > 50 → Alerte email utilisateur
│   │       └── Si Risk > 80 → Flag compte + alerte admin
│   │
│   └── Audit + Security Notification
│       ├── Log SUCCESS avec device, IP, geo
│       └── Email si nouvel appareil ou nouvelle localisation
│
└── Session créée (bindée au device, à l'IP et au fingerprint)
```

---

## 18. Architecture Decision Records (ADRs)

### ADR-026 : Session Limitation par Plan

**Titre** : Limitation des sessions simultanées par niveau d'abonnement

**Contexte** : Les sessions illimitées permettent le partage de compte massif.

**Décision** : Implémenter une limite de sessions configurables par `SubscriptionPlan` :

| Plan | Sessions Max | Devices Max | 2FA |
|------|-------------|-------------|-----|
| Gratuit / Essai | 2 | 2 | Optionnelle |
| Standard | 3 | 3 | Optionnelle |
| Pro | 5 | 5 | Recommandée |
| Enterprise | 20 | 20 | Obligatoire |

**Implémentation** : Hooks Better Auth `session.create.before` pour vérifier la limite.

**Conséquences** :
- + : Bloque le partage massif
- + : Simple à implémenter
- - : Nécessite planId dans le hook session
- - : UX dégradée si mal communiqué (utilisateur frustré)

### ADR-027 : Device Fingerprinting Renforcé

**Titre** : Passage du fingerprint `ip|user-agent` à un fingerprint navigateur multi-facteurs

**Contexte** : Le fingerprint actuel (`${ip}|${user-agent}`) est trivial à contourner (même user-agent, IP partagée).

**Décision** : Adopter un fingerprint multi-signaux côté client :

```
Nouveau fingerprint = hash(
  userAgent
  + language
  + platform
  + screenResolution
  + timezone
  + fonts (system)
  + canvasFingerprint (hash)
  + webglRenderer
  + audioFingerprint
)
```

**Implémentation** :
- Client : Collection des signaux dans un script non-bloquant
- Envoi : Header `X-Device-Fingerprint` sur chaque requête API
- Hash : SHA-256 côté serveur avant stockage
- Stockage : Hash uniquement (pas de données brutes — RGPD)

**Conséquences** :
- + : Beaucoup plus difficile à contourner
- + : Pas de données personnelles stockées (hash)
- - : Légère augmentation payload requêtes
- - : Peut changer avec mise à jour navigateur (nécessite re-vérification)

### ADR-028 : 2FA - TOTP comme Méthode Primaire

**Titre** : Implémentation TOTP (Time-based One-Time Password) comme méthode 2FA primaire

**Contexte** : Aucune protection multi-facteur actuelle.

**Décision** :
- Primaire : TOTP (Google Authenticator, Authy, 1Password)
- Secondaire : Email OTP (fallback)
- SMS OTP : Non (coût, sécurité SS7)
- Push notification : Non (trop complexe pour MVP)

**Implémentation** : Plugin Better Auth `twoFactor` avec TOTP.

**Conséquences** :
- + : Standard ouvert, compatible toutes les apps
- + : Gratuit (pas de coût par SMS)
- - : Nécessite une application externe
- - : Perte d'accès si perte du secret (backup codes nécessaires)

### ADR-029 : Risk Scoring Asynchrone

**Titre** : Moteur de scoring de risque asynchrone qui ne bloque pas le flux de connexion

**Contexte** : Un scoring synchrone ralentit la connexion. Un scoring asynchrone permet d'analyser sans friction.

**Décision** :
- Scoring synchrone minimum : IP reputation + session limit + device trust (bloquant)
- Scoring asynchrone : Impossible travel + velocity + behavioral (post-connexion)
- Stockage : Score dans `Session.riskScore`, événements dans `SecurityEvent`
- Action : Si score > 80, flag session + alerte admin + email utilisateur

**Conséquences** :
- + : Pas de latence sur le login
- + : Analyse approfondie possible
- - : Fenêtre d'exposition entre login et détection
- - : Stockage supplémentaire

### ADR-030 : Notifications de Sécurité Obligatoires

**Titre** : Envoi obligatoire d'emails de sécurité pour les événements sensibles

**Contexte** : Aucune notification lors des connexions depuis de nouveaux appareils/localisations.

**Décision** : Envoyer un email de sécurité pour :
1. Nouvel appareil connecté (device fingerprint inconnu)
2. Nouvelle localisation géographique (pays différent du dernier login)
3. Connexion depuis IP suspecte (VPN, Tor, datacenter)
4. Changement de mot de passe
5. Activation/désactivation 2FA
6. Session révoquée
7. 3+ tentatives échouées

**Template email** (exemple) :
```
Sujet : 🔒 Nouvelle connexion à votre compte NBA

Bonjour {name},

Une connexion a été détectée sur votre compte :

📱 Appareil : {device}
🌍 Localisation : {country}, {city}
🕐 Date : {date}
🌐 IP : {ip}

Si c'était vous, vous pouvez ignorer cet email.
Sinon, révoquez cette session immédiatement :
[🔐 Révoquer la session]({revoke_link})

L'équipe NBA
```

**Conséquences** :
- + : Visibilité utilisateur sur l'activité du compte
- + : Dissuasion du partage
- + : Conformité RGPD (droit à l'information)
- - : Risque de fatigue email
- - : Coût email supplémentaire (Resend)

---

## 19. Risk Scoring Engine

### 19.1 Architecture du Moteur de Score

```
Login Request
    │
    ├── SYNC (bloquant, temps réel)
    │   ├── Rate Limit Check    → Score partiel 0-30
    │   ├── Session Limit Check → Score partiel 0-20
    │   ├── Device Trust Check  → Score partiel 0-30
    │   ├── 2FA Status         → Score partiel 0-20
    │   └── TOTAL SYNCHRONE    → Seuil: >50 → Bloquer/Challenge 2FA
    │
    └── ASYNC (post-connexion)
        ├── IP Reputation       → Score partiel 0-25
        ├── Geo Distance        → Score partiel 0-25
        ├── Login Velocity      → Score partiel 0-25
        ├── Behavioral Pattern  → Score partiel 0-25
        └── TOTAL ASYNCHRONE   → Seuil: >70 → Alerte + Flag
```

### 19.2 Facteurs de Risque

| Facteur | Poids | Sync | Méthode |
|---------|-------|------|---------|
| Rate limit exceeded | 30 | ✅ | Redis counter |
| Sessions > 80% max | 20 | ✅ | DB count |
| Unknown device | 30 | ✅ | Device check |
| 2FA not enabled | 10 | ✅ | User pref |
| IP = known VPN/Tor | 25 | ❌ | IP DB (MaxMind) |
| IP = datacenter | 15 | ❌ | IP DB (MaxMind) |
| Distance > 1000km en < 1h | 25 | ❌ | GeoIP calculation |
| > 5 logins depuis IPs diff en 1h | 20 | ❌ | Redis |
| Browser fingerprint mismatch | 15 | ❌ | Session compare |
| Login hour unusual | 10 | ❌ | User pattern |
| Multiple accounts from same IP | 10 | ❌ | Redis/Cache |

### 19.3 Seuils et Actions

| Niveau | Score | Action |
|--------|-------|--------|
| **Faible** | 0-30 | Allow, log |
| **Moyen** | 31-50 | Allow, flag session, notify user |
| **Élevé** | 51-70 | Challenge 2FA, notify user, flag |
| **Critique** | 71-100 | Block if sync, alert if async, notify admin |

### 19.4 Implémentation

```typescript
// src/lib/security/risk-engine.ts

interface RiskFactor {
  name: string
  weight: number
  score: number // 0-100 normalisé
  reason?: string
}

interface RiskResult {
  totalScore: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: RiskFactor[]
  requiresChallenge: boolean
  shouldBlock: boolean
}

class RiskEngine {
  async evaluateSync(context: LoginContext): Promise<RiskResult> {
    const factors: RiskFactor[] = []
    
    // Rate limit
    const rateLimitScore = await this.checkRateLimit(context)
    factors.push({ name: 'rate_limit', weight: 30, ...rateLimitScore })
    
    // Session limit
    const sessionScore = await this.checkSessionLimit(context)
    factors.push({ name: 'session_limit', weight: 20, ...sessionScore })
    
    // Device trust
    const deviceScore = await this.checkDeviceTrust(context)
    factors.push({ name: 'device_trust', weight: 30, ...deviceScore })
    
    // 2FA
    const tfaScore = this.check2FA(context)
    factors.push({ name: 'two_factor', weight: 20, ...tfaScore })
    
    return this.calculate(factors)
  }
  
  async evaluateAsync(context: LoginContext): Promise<RiskResult> {
    // Post-login, non-blocking
    // Executed via queue/worker
  }
  
  private calculate(factors: RiskFactor[]): RiskResult {
    const weightedScore = factors.reduce(
      (sum, f) => sum + (f.score * f.weight / 100),
      0
    )
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    const totalScore = Math.round(weightedScore / totalWeight * 100)
    
    return {
      totalScore,
      level: totalScore <= 30 ? 'LOW'
        : totalScore <= 50 ? 'MEDIUM'
        : totalScore <= 70 ? 'HIGH'
        : 'CRITICAL',
      factors,
      requiresChallenge: totalScore > 50,
      shouldBlock: totalScore > 70,
    }
  }
}
```

---

## 20. Target Architecture Blueprint

### 20.1 Diagramme des Composants

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                      │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ Browser │  │ Mobile (PWA) │  │ API Client   │  │ WebSocket Client │   │
│  └────┬────┘  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘   │
│       │              │                 │                    │              │
│       └──────────────┴─────────────────┴────────────────────┘              │
│                              │ HTTP/WS                                     │
├──────────────────────────────┴─────────────────────────────────────────────┤
│                       GATEWAY LAYER (Cloudflare + Next.js Middleware)       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Rate Limit  │  │ CSRF Check  │  │ Device Check │  │ Session Check  │ │
│  │ (WAF+Redis) │  │ (Origin)    │  │ (Cookie)     │  │ (Cookie Valid) │ │
│  └─────────────┘  └──────────────┘  └──────────────┘  └────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│                         AUTHENTICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        AUTH GATEWAY                               │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────────┐   │   │
│  │  │ Login    │  │ Register     │  │ 2FA     │  │ Password    │   │   │
│  │  │ Handler  │  │ Handler      │  │ Handler │  │ Reset       │   │   │
│  │  └────┬─────┘  └──────┬───────┘  └────┬────┘  └──────┬──────┘   │   │
│  │       │               │               │             │           │   │
│  │       └───────────────┴───────────────┴─────────────┘           │   │
│  │                              │                                    │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                  BETTER AUTH CORE                         │  │   │
│  │  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐   │  │   │
│  │  │  │ Session │ │ Email/   │ │ Two    │ │ Database     │   │  │   │
│  │  │  │ Manager │ │ Password │ │ Factor │ │ Hooks        │   │  │   │
│  │  │  └─────────┘ └──────────┘ └────────┘ └──────┬───────┘   │  │   │
│  │  └──────────────────────────────────────────────┼───────────┘  │   │
│  └─────────────────────────────────────────────────┼──────────────┘   │
│                                                     │                  │
├─────────────────────────────────────────────────────┴──────────────────┤
│                       SECURITY LAYER                                    │
│  ┌────────────────────┐  ┌───────────────────┐  ┌──────────────────┐   │
│  │   FRAUD DETECTION  │  │   DEVICE MANAGER  │  │  SECURITY EVENTS │   │
│  │   ENGINE           │  │                   │  │  BUS             │   │
│  │  ┌──────────────┐  │  │ ┌───────────────┐ │  │ ┌────────────┐  │   │
│  │  │ IP Reputation│  │  │ │ Device        │ │  │ │ Event      │  │   │
│  │  │ Service      │  │  │ │ Registration  │ │  │ │ Collector  │  │   │
│  │  ├──────────────┤  │  │ ├───────────────┤ │  │ ├────────────┤  │   │
│  │  │ Geo Service  │  │  │ │ Device Trust  │ │  │ │ Alerting   │  │   │
│  │  ├──────────────┤  │  │ │ Level         │ │  │ │ Engine     │  │   │
│  │  │ Velocity     │  │  │ ├───────────────┤ │  │ ├────────────┤  │   │
│  │  │ Service      │  │  │ │ Fingerprint   │ │  │ │ Analytics  │  │   │
│  │  ├──────────────┤  │  │ │ Verification  │ │  │ └────────────┘  │   │
│  │  │ Behavior     │  │  │ └───────────────┘ │  └──────────────────┘   │
│  │  │ Service      │  │  └───────────────────┘                        │
│  │  └──────────────┘  │                                                │
│  └────────────────────┘  ┌───────────────────┐  ┌──────────────────┐   │
│                          │   2FA/MFA         │  │  SECURITY NOTIF  │   │
│  ┌────────────────────┐  │  SERVICE           │  │  SERVICE         │   │
│  │   SESSION MANAGER  │  │ ┌───────────────┐ │  │ ┌────────────┐  │   │
│  │                    │  │ │ TOTP Setup    │ │  │ │ New Device │  │   │
│  │ ┌───────────────┐  │  │ ├───────────────┤ │  │ │ Alert      │  │   │
│  │ │ Session Limit │  │  │ │ TOTP Verify   │ │  │ ├────────────┤  │   │
│  │ ├───────────────┤  │  │ ├───────────────┤ │  │ │ New Geo    │  │   │
│  │ │ Session       │  │  │ │ Email OTP     │ │  │ │ Alert      │  │   │
│  │ │ Binding       │  │  │ │ (Fallback)    │ │  │ ├────────────┤  │   │
│  │ ├───────────────┤  │  │ ├───────────────┤ │  │ │ Suspicious │  │   │
│  │ │ Token         │  │  │ │ Backup Codes  │ │  │ │ Login      │  │   │
│  │ │ Rotation      │  │  │ └───────────────┘ │  │ └────────────┘  │   │
│  │ └───────────────┘  │  └───────────────────┘  └──────────────────┘   │
│  └────────────────────┘                                                │
├────────────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                       │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ PostgreSQL (Neon)│  │   Redis      │  │  GeoIP DB (MaxMind)   │   │
│  │ ┌────────────┐   │  │ ┌─────────┐  │  │ ┌─────────────────┐   │   │
│  │ │ Sessions   │   │  │ │ Rate    │  │  │ │ IP to Country   │   │   │
│  │ ├────────────┤   │  │ │ Limits  │  │  │ ├─────────────────┤   │   │
│  │ │ Devices    │   │  │ ├─────────┤  │  │ │ IP to ASN       │   │   │
│  │ ├────────────┤   │  │ │ Pub/Sub │  │  │ ├─────────────────┤   │   │
│  │ │ Security   │   │  │ ├─────────┤  │  │ │ VPN/Proxy       │   │   │
│  │ │ Events     │   │  │ │ Queues  │  │  │ │ Detection       │   │   │
│  │ ├────────────┤   │  │ └─────────┘  │  │ └─────────────────┘   │   │
│  │ │ Security   │   │  └──────────────┘  └────────────────────────┘   │
│  │ │ Policies   │   │                                                 │
│  │ └────────────┘   │                                                 │
│  └──────────────────┘                                                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 20.2 Flux de Connexion Sécurisé (Cible)

```
Browser                          Server                          Services
   │                               │                               │
   │  POST /api/auth/sign-in      │                               │
   │  Headers:                    │                               │
   │    X-Device-Fingerprint      │                               │
   │    User-Agent                │                               │
   │    Cookie (if exists)        │                               │
   │──────────────────────────────►                               │
   │                               │  Rate Limit Check            │
   │                               │  ├── IP + Email combo        │
   │                               │  └── Window: 60s, Max: 5     │
   │                               │                               │
   │                               │  Device Detection            │
   │                               │  ├── Compute fingerprint     │
   │                               │  ├── Lookup in DB            │
   │                               │  ├── Known trusted → Skip    │
   │                               │  ├── Known untrusted → 2FA?  │
   │                               │  └── Unknown → Verification  │
   │                               │                               │
   │                               │  Session Limit Check         │
   │                               │  ├── Count active sessions   │
   │                               │  ├── Compare to plan limit   │
   │                               │  └── If full → Block/Prompt  │
   │                               │                               │
   │                               │  Better Auth SignIn          │
   │                               │  ├── Validate credentials    │
   │                               │  └── Create session          │
   │                               │                               │
   │                               │  Risk Scoring (Sync)         │
   │                               │  ├── Check factors           │
   │                               │  ├── If risk > 70 → Block    │
   │                               │  └── If risk > 50 → 2FA      │
   │                               │                               │
   │  Set-Cookie (session)         │                               │
   │  Set-Cookie (device_token)    │                               │
   │◄──────────────────────────────│                               │
   │                               │                               │
   │                               │  Risk Scoring (Async)        │
   │                               │  ├── Queue analysis job      │
   │                               │  └── Later → Update risk     │
   │                               │                               │
   │                               │  Security Notification       │
   │                               │  ├── IF new device → Email   │
   │                               │  └── IF new geo → Email      │
   │                               │                               │
```

---

## 21. Database Schema Changes

### 21.1 Models à Ajouter/Modifier

```prisma
// ════════════════════════════════════════
//  Enhanced Session (MODIFIER)
// ════════════════════════════════════════

model Session {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // ── NEW FIELDS ──
  deviceId      String?  @map("device_id") @db.Uuid
  riskScore     Int      @default(0) @map("risk_score")
  riskLevel     String   @default("LOW") @map("risk_level")     // LOW | MEDIUM | HIGH | CRITICAL
  country       String?  @map("country")                        // GeoIP
  city          String?  @map("city")
  latitude      Float?   @map("latitude")
  longitude     Float?   @map("longitude")
  isHighRisk    Boolean  @default(false) @map("is_high_risk")
  riskReason    String?  @map("risk_reason")
  fingerprint   String?  @map("fingerprint")                    // hash du fingerprint navigateur
  lastRotation  DateTime? @map("last_rotation")                 // dernière rotation de token

  user   User    @relation(fields: [userId], references: [id])
  device Device? @relation(fields: [deviceId], references: [id])

  @@index([userId])
  @@index([expiresAt])
  @@index([deviceId])
  @@index([riskLevel])
  @@map("sessions")
}

// ════════════════════════════════════════
//  Enhanced Device (MODIFIER)
// ════════════════════════════════════════

model Device {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  name         String?
  fingerprint  String   @map("fingerprint")                    // hash du fingerprint navigateur
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  deviceType   String?  @map("device_type")
  brand        String?  @map("brand")
  model        String?  @map("model")
  os           String?  @map("os")
  browser      String?  @map("browser")
  lastSeenAt   DateTime @default(now()) @map("last_seen_at")

  // ── NEW FIELDS ──
  trustLevel   DeviceTrustLevel @default(UNKNOWN) @map("trust_level")
  riskScore    Int              @default(0) @map("risk_score")
  is2faBypassed Boolean         @default(false) @map("is_2fa_bypassed")
  firstSeenAt  DateTime         @map("first_seen_at")
  trustedUntil DateTime?        @map("trusted_until")           // Durée de confiance limitée
  lastCountry  String?          @map("last_country")

  // Flags de détection
  flagVpn      Boolean @default(false) @map("flag_vpn")
  flagProxy    Boolean @default(false) @map("flag_proxy")
  flagTor      Boolean @default(false) @map("flag_tor")
  flagDatacenter Boolean @default(false) @map("flag_datacenter")

  // Relation sessions
  sessions Session[]

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, fingerprint])
  @@index([userId])
  @@index([fingerprint])
  @@index([trustLevel])
  @@map("devices")
}

enum DeviceTrustLevel {
  UNKNOWN         // Jamais vu
  PENDING         // Code envoyé, pas encore vérifié
  VERIFIED        // Code vérifié, pas encore trusted
  TRUSTED         // Appareil de confiance (2FA bypass possible)
  SUSPICIOUS      // Comportement suspect
  BLOCKED         // Bloqué par admin ou automatiquement
}

// ════════════════════════════════════════
//  Security Policy (NOUVEAU)
// ════════════════════════════════════════

model SecurityPolicy {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String?  @unique @map("user_id") @db.Uuid    // NULL = politique globale
  maxSessions     Int      @default(5) @map("max_sessions")
  maxDevices      Int      @default(3) @map("max_devices")
  require2fa      Boolean  @default(false) @map("require_2fa")
  enforceEmailOTP Boolean  @default(false) @map("enforce_email_otp")
  deviceTrustDays Int      @default(30) @map("device_trust_days")

  // Restrictions géographiques
  allowedCountries String[] @default([]) @map("allowed_countries")
  blockedCountries String[] @default([]) @map("blocked_countries")
  allowedIps       String[] @default([]) @map("allowed_ips")
  blockedIps       String[] @default([]) @map("blocked_ips")
  blockVpn         Boolean  @default(true) @map("block_vpn")
  blockTor         Boolean  @default(true) @map("block_tor")
  blockProxy       Boolean  @default(true) @map("block_proxy")

  // Notifications
  notifyNewDevice   Boolean @default(true) @map("notify_new_device")
  notifyNewLocation Boolean @default(true) @map("notify_new_location")
  notifySuspicious  Boolean @default(true) @map("notify_suspicious")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User? @relation(fields: [userId], references: [id])

  @@map("security_policies")
}

// ════════════════════════════════════════
//  Security Event (NOUVEAU)
// ════════════════════════════════════════

enum SecurityEventType {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGIN_NEW_DEVICE
  LOGIN_NEW_LOCATION
  LOGIN_SUSPICIOUS_IP
  LOGIN_SESSION_LIMIT
  LOGIN_BLOCKED
  DEVICE_VERIFIED
  DEVICE_TRUSTED
  DEVICE_REVOKED
  DEVICE_BLOCKED
  TWOFA_ENABLED
  TWOFA_DISABLED
  TWOFA_FAILED
  TWOFA_BYPASSED
  PASSWORD_CHANGED
  PASSWORD_RESET
  EMAIL_CHANGED
  SESSION_REVOKED
  SESSION_EXPIRED
  SECURITY_ALERT
  ADMIN_ACTION
}

enum SecuritySeverity {
  INFO
  WARNING
  HIGH
  CRITICAL
}

model SecurityEvent {
  id        String            @id @default(uuid()) @db.Uuid
  userId    String            @map("user_id") @db.Uuid
  type      SecurityEventType
  severity  SecuritySeverity
  details   Json              @db.JsonB                           // Données spécifiques à l'événement
  ipAddress String?           @map("ip_address")
  userAgent String?           @map("user_agent")
  deviceId  String?           @map("device_id") @db.Uuid
  sessionId String?           @map("session_id") @db.Uuid
  country   String?
  city      String?
  latitude  Float?
  longitude Float?
  riskScore Int               @default(0) @map("risk_score")
  notified  Boolean           @default(false)                     // Email de notification envoyé ?

  user    User    @relation(fields: [userId], references: [id])
  device  Device? @relation(fields: [deviceId], references: [id])

  @@index([userId, createdAt])
  @@index([type, createdAt])
  @@index([severity, createdAt])
  @@index([userId, type])
  @@index([createdAt])
  @@map("security_events")
}

// ════════════════════════════════════════
//  2FA Records (NOUVEAU)
// ════════════════════════════════════════

model TwoFactorBackupCode {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  code      String                                       // Hashé !
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("two_factor_backup_codes")
}

// ════════════════════════════════════════
//  Login Attempt (NOUVEAU - pour velocity)
// ════════════════════════════════════════

model LoginAttempt {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid              // NULL si échec (email inconnu)
  email     String                                         // Email tenté
  success   Boolean
  ipAddress String   @map("ip_address")
  userAgent String?  @map("user_agent")
  deviceId  String?  @map("device_id") @db.Uuid
  country   String?
  createdAt DateTime @default(now()) @map("created_at")

  user   User?   @relation(fields: [userId], references: [id])
  device Device? @relation(fields: [deviceId], references: [id])

  @@index([userId, createdAt])
  @@index([email, createdAt])
  @@index([ipAddress, createdAt])
  @@index([createdAt])
  @@map("login_attempts")
}

// ════════════════════════════════════════
//  Enhanced SubscriptionPlan (MODIFIER)
// ════════════════════════════════════════

model SubscriptionPlan {
  // ... existing fields ...

  // ── NEW FIELDS ──
  maxSessions Int @default(5) @map("max_sessions")
  maxDevices  Int @default(3) @map("max_devices")
  require2fa  Boolean @default(false) @map("require_2fa")
}
```

### 21.2 Migration Strategy

```
Phase 2a : Session limit + Device detection (1 semaine)
├── Ajouter colonnes à Session, Device
├── Créer SecurityPolicy
├── Créer LoginAttempt
└── Migration : ALTER TABLE + CREATE TABLE

Phase 2b : 2FA + Notifications (1 semaine)
├── Créer TwoFactorBackupCode
├── Créer SecurityEvent
└── Migration : CREATE TABLE

Phase 2c : Risk scoring (1 semaine)
├── Ajouter colonnes Device (flags IP)
└── Migration : ALTER TABLE

Phase 2d : Plan limits (1 semaine)
├── Ajouter colonnes SubscriptionPlan
└── Migration : ALTER TABLE
```

---

## 22. Implémentation : Session Manager

### 22.1 Service Layer

```typescript
// src/lib/security/session-manager.ts

export class SessionManager {
  private readonly prisma: PrismaClient
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  
  async getActiveSessionCount(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    })
  }
  
  async checkSessionLimit(userId: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    oldestSession?: Session
  }> {
    const [count, policy] = await Promise.all([
      this.getActiveSessionCount(userId),
      this.getSecurityPolicy(userId),
    ])
    
    const limit = policy?.maxSessions ?? 5
    
    if (count >= limit) {
      // Trouver la plus vieille session pour suggestion de révocation
      const oldestSession = await this.prisma.session.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'asc' },
      })
      
      return { allowed: false, current: count, limit, oldestSession }
    }
    
    return { allowed: true, current: count, limit }
  }
  
  async revokeOldestSession(userId: string): Promise<void> {
    const oldest = await this.prisma.session.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    })
    if (oldest) {
      await this.prisma.session.delete({ where: { id: oldest.id } })
    }
  }
  
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
        expiresAt: { gt: new Date() },
      },
    })
    return result.count
  }
  
  private async getSecurityPolicy(userId: string): Promise<SecurityPolicy | null> {
    // D'abord la politique utilisateur, puis plan, puis globale
    const [userPolicy, user] = await Promise.all([
      this.prisma.securityPolicy.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          accessRequests: {
            where: { status: 'APPROVED' },
            include: { plan: true },
            take: 1,
          },
        },
      }),
    ])
    
    if (userPolicy) return userPolicy
    
    // Fallback sur les limites du plan
    if (user?.accessRequests[0]?.plan) {
      return {
        maxSessions: user.accessRequests[0].plan.maxSessions ?? 5,
        maxDevices: user.accessRequests[0].plan.maxDevices ?? 3,
        require2fa: user.accessRequests[0].plan.require2fa ?? false,
      } as SecurityPolicy
    }
    
    return null
  }
}
```

### 22.2 Better Auth Hook

```typescript
// Dans src/lib/auth.ts

import { SessionManager } from './security/session-manager'

const sessionManager = new SessionManager(prisma)

export const auth = betterAuth({
  // ... existing config ...
  
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Vérifier la limite de sessions
          const check = await sessionManager.checkSessionLimit(session.userId)
          
          if (!check.allowed) {
            // Option 1: Auto-revoke la plus vieille
            if (process.env.AUTO_REVOKE_OLDEST_SESSION === 'true') {
              await sessionManager.revokeOldestSession(session.userId)
              return session
            }
            
            // Option 2: Bloque avec message clair
            throw new Error(
              `Limite de ${check.limit} sessions atteinte (${check.current} actives). ` +
              `Révoquez une session depuis votre tableau de bord ou activez "Se souvenir de moi" ` +
              `pour prolonger votre session actuelle.`
            )
          }
          
          return session
        },
      },
    },
    user: {
      // existing hooks...
    },
  },
  
  // Plugin 2FA
  plugins: [
    nextCookies(),
    // twoFactor() // → Décommenter quand prêt
  ],
})
```

---

## 23. Implémentation : Device Manager

### 23.1 Client-Side Fingerprint Collection

```typescript
// src/lib/security/fingerprint.ts

/**
 * Collecte les signaux de fingerprint navigateur.
 * Non-bloquant : le résultat arrive après le rendu initial.
 * Le fingerprint est envoyé via header sur les requêtes API.
 */
export async function collectFingerprint(): Promise<string> {
  const signals = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: (navigator as any).platform || '',
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    touchSupport: 'ontouchstart' in window,
    // Canvas fingerprint
    canvas: await getCanvasFingerprint(),
    // WebGL
    webgl: getWebGLFingerprint(),
    // Audio
    audio: await getAudioFingerprint(),
    // Fonts (via measureText)
    fonts: getFontFingerprint(),
    // Hardware
    hardware: {
      cores: navigator.hardwareConcurrency || 0,
      memory: (navigator as any).deviceMemory || 0,
    },
  }
  
  const data = JSON.stringify(signals)
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getCanvasFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 50
  const ctx = canvas.getContext('2d')!
  
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillStyle = '#f60'
  ctx.fillRect(0, 0, 200, 50)
  ctx.fillStyle = '#069'
  ctx.fillText('NBA', 2, 15)
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
  ctx.fillText('Security', 4, 30)
  
  return canvas.toDataURL()
}

function getWebGLFingerprint(): string {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) return 'no-webgl'
  
  const renderer = gl.getParameter(gl.RENDERER)
  const vendor = gl.getParameter(gl.VENDOR)
  return `${vendor}|${renderer}`
}

async function getAudioFingerprint(): Promise<string> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = ctx.createOscillator()
  const analyser = ctx.createAnalyser()
  oscillator.connect(analyser)
  return 'audio-supported'
}

function getFontFingerprint(): string {
  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
    'Verdana', 'Georgia', 'Palatino', 'Garamond',
    'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
  ]
  const base = document.createElement('span')
  base.textContent = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  base.style.position = 'absolute'
  base.style.left = '-9999px'
  base.style.fontSize = '72px'
  document.body.appendChild(base)
  
  const available = fonts.filter(font => {
    base.style.fontFamily = `"${font}", monospace`
    const width1 = base.offsetWidth
    base.style.fontFamily = `"${font}2", monospace`
    const width2 = base.offsetWidth
    return width1 !== width2
  })
  
  document.body.removeChild(base)
  return available.join(',')
}
```

### 23.2 Service Device Renforcé

```typescript
// src/lib/security/device-manager.ts

export class DeviceManager {
  private readonly prisma: PrismaClient
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  
  async detectAndHandleDevice(
    userId: string,
    fingerprint: string,
    context: RequestContext
  ): Promise<DeviceResult> {
    const existing = await this.prisma.device.findUnique({
      where: { userId_fingerprint: { userId, fingerprint } },
    })
    
    if (existing) {
      // Appareil connu - mise à jour
      const updated = await this.updateDevice(existing.id, context)
      return {
        device: updated,
        isNew: false,
        trustLevel: updated.trustLevel,
        action: updated.trustLevel === 'TRUSTED' ? 'ALLOW'
          : updated.trustLevel === 'SUSPICIOUS' ? 'CHALLENGE_2FA'
          : 'ALLOW',
      }
    }
    
    // Nouvel appareil - vérification requise
    const ipInfo = await this.getIpInfo(context.ip)
    
    const newDevice = await this.prisma.device.create({
      data: {
        userId,
        fingerprint,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        deviceType: context.deviceType,
        brand: context.brand,
        model: context.model,
        os: context.os,
        browser: context.browser,
        trustLevel: ipInfo.isSuspicious ? 'SUSPICIOUS' : 'PENDING',
        firstSeenAt: new Date(),
        riskScore: ipInfo.riskScore,
        flagVpn: ipInfo.isVpn,
        flagProxy: ipInfo.isProxy,
        flagTor: ipInfo.isTor,
        flagDatacenter: ipInfo.isDatacenter,
        lastCountry: ipInfo.country,
      },
    })
    
    await this.sendVerificationCode(userId, context.email)
    
    await this.createSecurityEvent('LOGIN_NEW_DEVICE', userId, {
      deviceId: newDevice.id,
      trustLevel: newDevice.trustLevel,
    }, context)
    
    return {
      device: newDevice,
      isNew: true,
      trustLevel: newDevice.trustLevel,
      action: 'VERIFY',
    }
  }
  
  async verifyDevice(userId: string, fingerprint: string, code: string): Promise<boolean> {
    // Vérifier le code
    const verification = await this.prisma.deviceVerification.findFirst({
      where: {
        userId,
        deviceFingerprint: fingerprint,
        verificationCode: code,
        expiresAt: { gte: new Date() },
        verifiedAt: null,
      },
    })
    
    if (!verification) return false
    
    await this.prisma.deviceVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    })
    
    // Mettre à jour le trust level
    await this.prisma.device.update({
      where: { userId_fingerprint: { userId, fingerprint } },
      data: {
        trustLevel: 'VERIFIED',
        trustedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
    })
    
    return true
  }
  
  async trustDevice(userId: string, fingerprint: string): Promise<void> {
    await this.prisma.device.update({
      where: { userId_fingerprint: { userId, fingerprint } },
      data: {
        trustLevel: 'TRUSTED',
        trustedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }
  
  private async getIpInfo(ip: string): Promise<IpInfo> {
    // Utiliser MaxMind GeoIP ou API externe
    // Pour le MVP, parsing simple
    return {
      country: null,
      city: null,
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      riskScore: 0,
      isSuspicious: false,
    }
  }
  
  private async updateDevice(deviceId: string, context: RequestContext) {
    const ipInfo = await this.getIpInfo(context.ip)
    
    const updateData: any = {
      lastSeenAt: new Date(),
      ipAddress: context.ip,
      userAgent: context.userAgent,
      deviceType: context.deviceType,
      brand: context.brand,
      model: context.model,
      os: context.os,
      browser: context.browser,
    }
    
    // Mettre à jour les flags IP si l'IP est suspecte
    if (ipInfo.isSuspicious) {
      updateData.flagVpn = ipInfo.isVpn
      updateData.flagProxy = ipInfo.isProxy
      updateData.flagTor = ipInfo.isTor
      updateData.flagDatacenter = ipInfo.isDatacenter
      updateData.riskScore = Math.max(updateData.riskScore ?? 0, ipInfo.riskScore)
      
      // Si l'appareil était TRUSTED mais que l'IP est suspecte, rétrograder
      if (ipInfo.riskScore > 50) {
        updateData.trustLevel = 'SUSPICIOUS'
      }
    }
    
    return this.prisma.device.update({
      where: { id: deviceId },
      data: updateData,
    })
  }
}

interface DeviceResult {
  device: Device
  isNew: boolean
  trustLevel: string
  action: 'ALLOW' | 'VERIFY' | 'CHALLENGE_2FA' | 'BLOCK'
}
```

---

## 24. Implémentation : 2FA/MFA

```typescript
// src/lib/security/two-factor.ts

import { auth } from '../auth'

export class TwoFactorService {
  async setup(userId: string): Promise<{ secret: string; qrCode: string }> {
    return auth.api.twoFactor.generateTOTP({ userId })
  }
  
  async enable(userId: string, code: string): Promise<boolean> {
    await auth.api.twoFactor.activateTOTP({ userId, code })
    return true
  }
  
  async disable(userId: string, code: string): Promise<boolean> {
    await auth.api.twoFactor.deactivateTOTP({ userId, code })
    return true
  }
  
  async verify(userId: string, code: string): Promise<boolean> {
    return auth.api.twoFactor.verifyTOTP({ userId, code })
  }
  
  async getBackupCodes(userId: string): Promise<string[]> {
    return auth.api.twoFactor.getBackupCodes({ userId })
  }
  
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    return auth.api.twoFactor.verifyBackupCode({ userId, code })
  }
}

// Middleware 2FA
export async function require2FA(userId: string, device: Device): Promise<boolean> {
  if (device.trustLevel === 'TRUSTED' && device.is2faBypassed) {
    return true // Skip 2FA for trusted devices
  }
  return false // Require 2FA
}
```

---

## 25. Implémentation : Security Notifications

```typescript
// src/lib/security/notification-service.ts

export class SecurityNotificationService {
  private readonly email: EmailService
  
  constructor(email: EmailService) {
    this.email = email
  }
  
  async notifyNewDevice(
    user: { name: string; email: string },
    device: { name: string | null; browser: string | null; os: string | null },
    location: { country: string | null; city: string | null; ip: string },
    revokeLink: string,
  ): Promise<void> {
    await this.email.send(
      user.email,
      {
        subject: '🔒 Nouvel appareil connecté à votre compte NBA',
        html: `
          <h2>Bonjour ${user.name},</h2>
          <p>Un nouvel appareil a été connecté à votre compte :</p>
          <ul>
            <li>Appareil : ${device.name || device.browser || 'Inconnu'} ${device.os ? `(${device.os})` : ''}</li>
            <li>Localisation : ${[location.city, location.country].filter(Boolean).join(', ') || 'Inconnue'}</li>
            <li>IP : ${location.ip}</li>
            <li>Date : ${new Date().toLocaleString('fr-FR')}</li>
          </ul>
          <p>Si c'était vous, ignorez cet email.</p>
          <p>Sinon, <a href="${revokeLink}">révoquez cette session immédiatement</a>.</p>
        `,
      },
    )
  }
  
  async notifySuspiciousLogin(
    user: { name: string; email: string },
    details: { device: string; location: string; ip: string; reason: string },
  ): Promise<void> {
    // Email avec ton plus urgent
  }
  
  async notifyPasswordChanged(user: { name: string; email: string }): Promise<void> {
    // Email de confirmation
  }
  
  async notify2FAChanged(user: { name: string; email: string }, enabled: boolean): Promise<void> {
    // Email activation/désactivation 2FA
  }
  
  async sendWeeklyDigest(userId: string): Promise<void> {
    // Résumé hebdomadaire des événements de sécurité
  }
}
```

---

## 26. Plan de Migration Progressive

### Phase 2a : Fondations (Semaine 1-2)

**Objectif** : Bloquer le partage de compte massif immédiatement.

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Migrations DB (Session + Device + SecurityPolicy + LoginAttempt) | Schéma mis à jour |
| 2-3 | Session Manager + Limite de sessions | Hook Better Auth |
| 3-4 | Device detection enforcement sur login | `detectNewDevice()` activé |
| 4-5 | Device verification flow (email code) | API + UI vérification |
| 5-7 | Tests + Déploiement progressif (5% → 25% → 100%) | Feature flag |

**Feature Flag** : `SESSION_LIMIT_ENABLED`

**Rollback** : Désactiver le hook `session.create.before`

**KPI** : Nombre de sessions par utilisateur, taux de blocage, support tickets

### Phase 2b : Notifications + 2FA (Semaine 3-4)

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Security Event model + service | Events logging |
| 2-3 | New device email notification | Email template + service |
| 3-4 | 2FA setup UI + API (TOTP) | Better Auth twoFactor |
| 4-5 | Backup codes + recovery flow | UI backup codes |
| 5-7 | Tests + Déploiement progressif | Feature flag |

**Feature Flag** : `2FA_ENABLED`

### Phase 2c : Risk Scoring (Semaine 5-6)

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Risk Engine (sync) | Module risk scoring |
| 2-3 | IP reputation service (MaxMind) | GeoIP + VPN detection |
| 3-4 | Impossible travel detection | Async worker |
| 4-5 | Behavioral profiling | Pattern analysis |
| 5-7 | Tests + Déploiement | Feature flag |

**Feature Flag** : `RISK_SCORING_ENABLED`

### Phase 2d : Plan Enforcement + Admin (Semaine 7-8)

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Plan limits (maxSessions, maxDevices, require2fa) | SubscriptionPlan update |
| 2-3 | Admin security dashboard | Security events UI |
| 3-4 | Admin abuse monitoring | Alerting on suspicious patterns |
| 4-5 | Security policy per user | SecurityPolicy CRUD |
| 5-7 | Tests + Déploiement final | Full rollout |

---

## 27. Tests de Sécurité

### 27.1 Scénarios E2E

```typescript
// tests/security/account-sharing.test.ts

describe('Account Sharing Prevention', () => {
  describe('Session Limits', () => {
    it('should block login when session limit is reached', async () => {
      const user = await createUser()
      const plan = await createPlan({ maxSessions: 2 })
      await assignPlan(user, plan)
      
      // Create 2 sessions (max)
      await login(user, { device: 'device-1' })
      await login(user, { device: 'device-2' })
      
      // 3rd login should fail
      const result = await login(user, { device: 'device-3' })
      expect(result.status).toBe(429)
      expect(result.body.code).toBe('SESSION_LIMIT_REACHED')
    })
    
    it('should allow login after revoking oldest session', async () => {
      const user = await createUser()
      const plan = await createPlan({ maxSessions: 2 })
      await assignPlan(user, plan)
      
      await login(user, { device: 'device-1' })
      await login(user, { device: 'device-2' })
      
      // Revoke oldest and retry
      await revokeOldestSession(user)
      const result = await login(user, { device: 'device-3' })
      expect(result.status).toBe(200)
    })
  })
  
  describe('Device Detection', () => {
    it('should require verification on first login from new device', async () => {
      const user = await createUser()
      
      // Login from unknown device
      const result = await login(user, { fingerprint: 'new-fp' })
      expect(result.body.requiresDeviceVerification).toBe(true)
      expect(result.body.action).toBe('VERIFY')
    })
    
    it('should allow login from trusted device without 2FA', async () => {
      const user = await createUser()
      const device = await createTrustedDevice(user)
      
      const result = await login(user, { fingerprint: device.fingerprint })
      expect(result.body.requiresDeviceVerification).toBe(false)
      expect(result.body.requires2FA).toBe(false)
    })
    
    it('should detect suspicious IP and require 2FA', async () => {
      const user = await createUser()
      const device = await createTrustedDevice(user)
      
      const result = await login(user, {
        fingerprint: device.fingerprint,
        ip: '1.2.3.4', // Known VPN IP
      })
      expect(result.body.requires2FA).toBe(true)
    })
  })
  
  describe('2FA', () => {
    it('should require TOTP code after setup', async () => {
      const user = await createUser()
      await setup2FA(user)
      
      const result = await login(user, { device: 'new-device' })
      expect(result.body.requires2FA).toBe(true)
      
      const verify = await verify2FA(user, generateTOTP(user.twoFactorSecret))
      expect(verify.status).toBe(200)
    })
    
    it('should accept backup code when TOTP unavailable', async () => {
      const user = await createUser()
      const backupCodes = await setup2FA(user)
      
      const result = await login(user, { device: 'new-device' })
      const verify = await verify2FAWithBackup(user, backupCodes[0])
      expect(verify.status).toBe(200)
    })
  })
  
  describe('Risk Scoring', () => {
    it('should flag impossible travel', async () => {
      const user = await createUser()
      
      // Login from Paris
      await login(user, { ip: 'paris-ip', device: 'device-1' })
      
      // Login from Tokyo 5 minutes later (impossible)
      const result = await login(user, { ip: 'tokyo-ip', device: 'device-2' })
      
      expect(result.body.riskLevel).toBe('HIGH')
      expect(result.body.requires2FA).toBe(true)
    })
    
    it('should block critical risk login', async () => {
      const user = await createUser()
      
      // Multiple failed attempts from different IPs
      for (const ip of ['ip-1', 'ip-2', 'ip-3', 'ip-4']) {
        await failedLogin(user, { ip })
      }
      
      const result = await login(user, { ip: 'ip-5', correctPassword: true })
      expect(result.status).toBe(403)
      expect(result.body.code).toBe('LOGIN_BLOCKED')
    })
  })
  
  describe('Security Notifications', () => {
    it('should send email on new device login', async () => {
      const user = await createUser()
      
      await login(user, { device: 'brand-new-device' })
      
      const emails = await getEmailsSentTo(user.email)
      expect(emails).toContainEqual(
        expect.objectContaining({
          subject: expect.stringContaining('Nouvel appareil'),
        })
      )
    })
    
    it('should NOT send email on trusted device login', async () => {
      const user = await createUser()
      const device = await createTrustedDevice(user)
      
      await login(user, { fingerprint: device.fingerprint })
      
      const emails = await getEmailsSentTo(user.email)
      expect(emails).not.toContainEqual(
        expect.objectContaining({
          subject: expect.stringContaining('Nouvel appareil'),
        })
      )
    })
  })
})
```

### 27.2 Tests de Charge

```typescript
// tests/performance/session-limit.test.ts

describe('Session Limit Performance', () => {
  it('should handle 1000 concurrent session checks under 200ms', async () => {
    const users = Array.from({ length: 1000 }, (_, i) => createUser())
    
    const start = Date.now()
    const results = await Promise.all(
      users.map(user => checkSessionLimit(user.id))
    )
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(200)
    results.forEach(r => expect(r.allowed).toBe(true))
  })
  
  it('should not degrade under concurrent login storm', async () => {
    const user = await createUser()
    const plan = await createPlan({ maxSessions: 100 })
    await assignPlan(user, plan)
    
    // 50 concurrent logins
    const logins = Array.from({ length: 50 }, (_, i) =>
      login(user, { device: `device-${i}` })
    )
    
    const results = await Promise.allSettled(logins)
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    // All should succeed (limit is 100)
    expect(succeeded).toBe(50)
    expect(failed).toBe(0)
  })
})
```

### 27.3 Tests de Simulation de Fraude

| Test | Scénario | Résultat Attendu |
|------|----------|-----------------|
| Partage identifiants | 10 utilisateurs, 1 compte | Session bloquée dès la 6e |
| Cookie sharing | Même cookie depuis 2 IPs | Détection fingerprint mismatch |
| VPN login | Connexion depuis IP VPN connue | 2FA requis + email alerte |
| Bot scraping | 50 requêtes/min API signals | Rate limit + flag bot |
| Password sharing | Changement IP toutes les 5min | Score risque critique |
| Account farming | 10 comptes depuis même IP | Rate limit signup |
| Revente accès | Sessions depuis 5 pays en 1h | Impossible travel détecté |

---

## 28. Monitoring & Alerting

### 28.1 Métriques Clés

| Métrique | Source | Seuil Alerte | Action |
|----------|--------|-------------|--------|
| `sessions_per_user_avg` | DB | > 3 | Investigation |
| `sessions_per_user_max` | DB | > 10 | Alerte admin |
| `new_devices_per_hour` | DB | > 100 | Alerte sécurité |
| `login_blocked_rate` | App | > 5% | Review rate limits |
| `2fa_failure_rate` | App | > 20% | Possible attaque |
| `risk_score_avg` | App | > 50 | Alerte tendance |
| `security_events_high` | DB | > 10/h | Investigation |
| `impossible_travel_count` | App | > 5/h | Possible credential sharing |

### 28.2 Dashboard Sécurité (Grafana)

```
┌──────────────────────────────────────────────────────────────────┐
│  SECURITY DASHBOARD                    🟢 Status: Healthy       │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ Sessions Actives     │  │ Appareils Uniques    │              │
│ │ 1,234                │  │ 892                  │              │
│ │ Moy: 2.1/user        │  │ Moy: 1.6/user        │              │
│ └──────────────────────┘  └──────────────────────┘              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ Sessions Bloquées    │  │ Alertes Sécurité     │              │
│ │ 56 (dernière 24h)    │  │ 12 (dernière 24h)    │              │
│ │ +12% vs hier         │  │ -5% vs hier          │              │
│ └──────────────────────┘  └──────────────────────┘              │
├──────────────────────────────────────────────────────────────────┤
│ Événements de Sécurité (24h)                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ LOGIN_NEW_DEVICE    ████████████░░░░░░  45                 │  │
│ │ LOGIN_BLOCKED       ████░░░░░░░░░░░░░░  12                 │  │
│ │ TWOFA_FAILED        ██░░░░░░░░░░░░░░░░   3                 │  │
│ │ SUSPICIOUS_LOGIN    ██████░░░░░░░░░░░░  18                 │  │
│ │ DEVICE_VERIFIED     ██████████████░░░░  52                 │  │
│ └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ Top IPs Suspectes (24h)                                         │
│ 185.234.x.x : 23 tentatives (🇷🇺 RU, VPN)                       │
│ 103.45.x.x  : 15 tentatives (🇨🇳 CN, Datacenter)                │
│ 5.255.x.x   : 8 tentatives  (🇸🇪 SE, Tor Exit)                  │
└──────────────────────────────────────────────────────────────────┘
```

### 28.3 Alerting PagerDuty/OpsGenie

| Alerte | Priorité | Channel | Délai |
|--------|----------|---------|-------|
| Session limit atteinte > 100 users | P3 | Slack | 5 min |
| Impossible travel détecté | P3 | Slack | Immédiat |
| 2FA failure rate > 20% | P2 | Slack + SMS | 5 min |
| Bruteforce détecté (> 100 failed/h) | P2 | PagerDuty | Immédiat |
| Admin fraud action | P1 | PagerDuty + SMS | Immédiat |

---

## 29. Sécurité des Cookies

### Configuration Cible

```typescript
// Dans src/lib/auth.ts

export const auth = betterAuth({
  // ... existing config ...
  
  advanced: {
    cookies: {
      sessionToken: {
        name: '__Host-better-auth.session_token',  // Préfixe __Host- (nécessite Secure + Path=/)
        attributes: {
          httpOnly: true,
          sameSite: 'strict',                      // STRICT au lieu de LAX
          secure: true,                             // Forcer HTTPS
          path: '/',
          maxAge: 60 * 60 * 24 * 7,                 // 7 jours
        },
      },
    },
  },
})
```

---

## 30. Roadmap Finale

```
Semaine 1-2  ████████░░░░░░░░░░░░  Phase 2a : Session Limit + Device Detection
Semaine 3-4  ████████████░░░░░░░░  Phase 2b : 2FA + Notifications
Semaine 5-6  ████████████████░░░░  Phase 2c : Risk Scoring
Semaine 7-8  ████████████████████  Phase 2d : Plan Enforcement + Admin

Jalons :
✓ Semaine 2 : Partage de compte bloqué (limite sessions + device check)
✓ Semaine 4 : 2FA disponible + alertes email
✓ Semaine 6 : Détection fraude automatique
✓ Semaine 8 : Protection complète + monitoring
```

### Risques Résiduels Après Implémentation

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| Partage compte familial (2-3 pers.) | Élevée | Faible | Limite sessions > 3 utilisateurs |
| Cookie volé via XSS | Faible | Élevée | HttpOnly + CSP + Cookie rotation |
| 2FA phishing | Faible | Moyenne | TOTP + email verification |
| IP reputation bypass | Moyenne | Moyenne | Multi-facteurs (pas que IP) |
| Admin frauduleux | Faible | Élevée | Double validation + audit logging |
| Comptes multiples même personne | Élevée | Faible | KYC enforcement + device fingerprint |

---

## 31. Conclusion

### Synthèse Architecture Cible

```
AVANT (Phase 1)                       APRÈS (Phase 2)
┌──────────────────┐                  ┌──────────────────────────────┐
│ Login → Session   │                  │ Login → Rate Limit           │
│ Session → ∞       │                  │       → Session Limit Check  │
│ Device → Optional │                  │       → Device Check         │
│ 2FA → None        │                  │       → 2FA Check            │
│ Fraud → None      │                  │       → Risk Scoring (sync)  │
│ Alert → None      │                  │       → Session Created      │
└──────────────────┘                  │       → Risk Scoring (async) │
                                       │       → Security Notification │
                                       └──────────────────────────────┘
```

### Scores Cibles

| Critère | Avant | Après |
|---------|-------|-------|
| Session Management | 2/10 | 9/10 |
| Device Management | 3/10 | 9/10 |
| 2FA/MFA | 0/10 | 9/10 |
| Anomaly Detection | 0/10 | 8/10 |
| Security Notifications | 1/10 | 9/10 |
| Rate Limiting | 7/10 | 8/10 |
| Audit | 6/10 | 9/10 |
| **TOTAL** | **2.7/10** | **8.7/10** |

### Bénéfices Attendus

- **Revenue Protection** : Empêche le partage de compte massif (estimation : +30% de conversion)
- **Trust** : Les utilisateurs légitimes sont notifiés des connexions suspectes
- **Compliance** : Conformité RGPD/GDPR avec traçabilité complète
- **Operations** : Visibilité totale sur les patterns de connexion
- **Scale** : Architecture prête pour des centaines de milliers d'utilisateurs

---

---
---

# APPENDIX A — SECURITY STATE MACHINE

## A.1 Device Trust State Machine

```
                        ┌──────────────────────────────────────┐
                        │          UNKNOWN                      │
                        │  Premier fingerprint vu              │
                        └────────────┬─────────────────────────┘
                                     │ Login attempt
                                     ▼
                        ┌──────────────────────────────────────┐
                        │       PENDING_VERIFICATION            │
                        │  Code de vérification envoyé par     │
                        │  email, en attente de validation     │
                        └────────────┬─────────────────────────┘
                                     │ Code valide saisi
                                     ▼
                        ┌──────────────────────────────────────┐
                        │           VERIFIED                    │
                        │  Appareil vérifié, trust limité      │
                        │  2FA peut être requis                │
                        └────────────┬─────────────────────────┘
                                     │ "Trust this device" coché
                                     │ + 30 jours sans incident
                                     ▼
                        ┌──────────────────────────────────────┐
                        │           TRUSTED                     │
                        │  2FA bypass possible                  │
                        │  Pas d'alerte sur login               │
                        │  Expire après N jours                 │
                        └────┬─────────────────┬───────────────┘
                             │                 │
                 Comportement│ suspect         │ IP suspecte
                             ▼                 ▼
                ┌──────────────────────┐  ┌──────────────────────┐
                │     SUSPICIOUS       │  │     CHALLENGED       │
                │  Score risque > 50   │  │  2FA requis          │
                │  Flag pour review    │  │  Si échec → BLOCKED  │
                │  Dégradé depuis      │  │  Si succès → TRUSTED │
                │  TRUSTED             │  └──────────┬───────────┘
                └──────────┬───────────┘             │
                           │                         │ Succès
                           │  Admin action           ▼
                           ▼                  ┌──────────────────┐
                ┌──────────────────────┐       │    TRUSTED      │
                │       BLOCKED        │       └──────────────────┘
                │  Bloqué par admin    │
                │  ou automatiquement  │
                └──────────────────────┘
```

### A.1.1 Transitions Documentées

| # | De | Vers | Condition | Action | Quién |
|---|----|------|-----------|--------|-------|
| T1 | UNKNOWN | PENDING_VERIFICATION | Nouveau device fingerprint détecté au login | Envoyer code email, créer SecurityEvent NEW_DEVICE | DeviceManager |
| T2 | PENDING_VERIFICATION | VERIFIED | Code de vérification valide saisi | Marquer device VERIFIED, créer SecurityEvent DEVICE_VERIFIED | DeviceManager |
| T3 | PENDING_VERIFICATION | BLOCKED | 3+ tentatives de code invalide | Bloquer device, alerte admin, email utilisateur | FraudEngine |
| T4 | VERIFIED | TRUSTED | "Trust this device" coché + N jours sans incident + score risque < 20 | Définir trustedUntil, bypass 2FA optionnel | DeviceManager |
| T5 | TRUSTED | VERIFIED | Expiration du trustedUntil (N jours) | Trust expire, 2FA à nouveau requis | Cron/SessionRefresh |
| T6 | TRUSTED | SUSPICIOUS | IP suspecte (VPN/Tor) OU comportement anormal | Dégradé, créer SecurityEvent, alerte utilisateur | FraudEngine |
| T7 | VERIFIED | SUSPICIOUS | Score risque > 50 | Flag, créer SecurityEvent | FraudEngine |
| T8 | SUSPICIOUS | CHALLENGED | Login suivant | 2FA requis, créer SecurityEvent | AuthGateway |
| T9 | CHALLENGED | TRUSTED | 2FA validé avec succès | Restaurer TRUSTED, reset compteur | DeviceManager |
| T10 | CHALLENGED | BLOCKED | 2FA échoué 3 fois | Bloquer, alerte utilisateur + admin | DeviceManager |
| T11 | SUSPICIOUS | BLOCKED | Admin action OU score risque > 90 | Bloquer, notification | Admin |
| T12 | BLOCKED | VERIFIED | Admin débloque manuellement | Réinitialiser, créer SecurityEvent | Admin |
| T13 | ANY | BLOCKED | Détection automatique (impossible travel + credential stuffing) | Blocage immédiat, P1 alerte | FraudEngine |
| T14 | VERIFIED | VERIFIED | Mise à jour ip/user-agent normale | Update lastSeenAt, ipAddress, country | DeviceManager |

### A.1.2 Guard Conditions

Chaque transition est protégée par des **guard conditions** :

```
Transition T4 (VERIFIED → TRUSTED) :
  GUARD : device.riskScore < 20
       && device.age > 30 days
       && user.trustDeviceConsent === true
       && no security_events(severity >= HIGH) in 30 days

Transition T6 (TRUSTED → SUSPICIOUS) :
  GUARD : ipInfo.isVpn === true
       || ipInfo.isTor === true
       || geoDistance > 1000km from lastSeenAt
       || loginVelocity > 10/hour

Transition T11 (SUSPICIOUS → BLOCKED) :
  GUARD : riskScore > 90
       || admin.blockDevice === true
       || 3+ CHALLENGED failures in 24h
```

---

## A.2 Session State Machine

```
                  ┌──────────────┐
                  │   ACTIVE     │
                  │  Session     │
                  │  valide      │
                  └──────┬───────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
       Expiration    Logout      Suspicious
            │            │       activity
            ▼            ▼            ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  EXPIRED   │ │  REVOKED   │ │ CHALLENGED │
    │  TTL atteint│ │ Logout     │ │ Risk > 50 │
    └────────────┘ │  explicite │ │ 2FA req    │
                   └────────────┘ └──────┬─────┘
                        │               │
                        │          ┌────┴────┐
                        │          │  Succès │  Échec
                        │          ▼         ▼
                        │    ┌──────────┐ ┌──────────┐
                        │    │  ACTIVE  │ │  BLOCKED │
                        │    │ (renewed)│ │          │
                        │    └──────────┘ └──────────┘
                        │
                   ┌────┴────┐
                   │ ROTATED │
                   │ Nouveau  │
                   │ token    │
                   └─────────┘
```

### A.2.1 Transitions Session

| # | De | Vers | Condition | Action |
|---|----|------|-----------|--------|
| S1 | ACTIVE | EXPIRED | expiresAt atteint | Netoyage cron, SecurityEvent |
| S2 | ACTIVE | REVOKED | Logout explicite ou révocation admin | Delete session, WebSocket disconnect |
| S3 | ACTIVE | CHALLENGED | Risk score > 50 post-création | Flag session, 2FA requis |
| S4 | CHALLENGED | ACTIVE | 2FA validé | Unflag, continue |
| S5 | CHALLENGED | BLOCKED | 2FA échoué | Delete session, SecurityEvent |
| S6 | ACTIVE | ROTATED | updateAge atteint (24h) | Nouveau token, ancien invalidé |
| S7 | ROTATED | ACTIVE | Rotation réussie | Continue avec nouveau token |

---

## A.3 2FA State Machine

```
                  ┌──────────────┐
                  │   DISABLED   │
                  └──────┬───────┘
                         │ Setup TOTP
                         ▼
                  ┌──────────────┐
                  │   SETUP      │
                  │ (pending     │
                  │  verification)│
                  └──────┬───────┘
                         │ Verify code
                         ▼
                  ┌──────────────┐
                  │    ACTIVE    │
                  └──────┬───────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
       Disable       Lost device   N attempts
            │            │            │
            ▼            ▼            ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  DISABLED  │ │  RECOVERY  │ │  LOCKED    │
    │  Vérification│ │  Backup   │ │  Trop     │
    │  mot de     │ │  codes    │ │  d'échecs │
    │  passe      │ └──────┬─────┘ └──────┬─────┘
    └────────────┘        │               │
                     Code valide      Attente
                          ▼           délai
                  ┌──────────────┐
                  │    ACTIVE    │
                  └──────────────┘
```

---

## A.4 State Machine Engine (Spec)

```typescript
// src/lib/security/state-machine.ts

type DeviceState = 
  | 'UNKNOWN' 
  | 'PENDING_VERIFICATION' 
  | 'VERIFIED' 
  | 'TRUSTED' 
  | 'SUSPICIOUS' 
  | 'CHALLENGED' 
  | 'BLOCKED'

type SessionState = 
  | 'ACTIVE' 
  | 'EXPIRED' 
  | 'REVOKED' 
  | 'CHALLENGED' 
  | 'BLOCKED' 
  | 'ROTATED'

type TwoFAState = 
  | 'DISABLED' 
  | 'SETUP' 
  | 'ACTIVE' 
  | 'RECOVERY' 
  | 'LOCKED'

interface Transition<S> {
  from: S | S[]
  to: S
  guard: () => Promise<boolean> | boolean
  onTransition: () => Promise<void>
  metadata: {
    id: string
    description: string
    requiresAdmin: boolean
    notifyUser: boolean
    notifyAdmin: boolean
    severity: SecuritySeverity
  }
}

class StateMachine<S extends string> {
  private transitions: Map<string, Transition<S>>
  
  constructor(initialState: S) {
    this.transitions = new Map()
  }
  
  registerTransition(transition: Transition<S>): void {
    const key = this.transitionKey(transition.from, transition.to)
    this.transitions.set(key, transition)
  }
  
  async transition(
    current: S,
    target: S,
    context: TransitionContext
  ): Promise<{ success: boolean; newState: S; reason?: string }> {
    const key = this.transitionKey(current, target)
    const t = this.transitions.get(key)
    
    if (!t) {
      return { success: false, newState: current, reason: 'INVALID_TRANSITION' }
    }
    
    const guardResult = await t.guard()
    if (!guardResult) {
      return { success: false, newState: current, reason: 'GUARD_FAILED' }
    }
    
    await t.onTransition()
    
    // Log security event
    await this.logTransition(current, target, t, context)
    
    return { success: true, newState: target }
  }
  
  private transitionKey(from: S | S[], to: S): string {
    const fromStr = Array.isArray(from) ? from.sort().join('|') : from
    return `${fromStr}->${to}`
  }
}
```

---

# APPENDIX B — SEQUENCE DIAGRAMS

## B.1 Login Flow (Complet)

```
Browser                    Cloudflare              Next.js                 BetterAuth              SessionManager          DeviceManager           RiskEngine              Database                Notification
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │ POST /api/auth/sign-in   │                       │                        │                       │                       │                       │                       │                       │
   │──────────────────────────►                        │                        │                       │                       │                       │                       │                       │
   │                          │──────────────────────►│                        │                       │                       │                       │                       │                       │
   │                          │                       │───────────────────────►│                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │  1. Rate Limit Check   │                       │                       │                       │                       │                       │
   │                          │                       │◄──────────────────────►│                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │  2. Device Detect      │                       │                       │                       │                       │                       │
   │                          │                       │──────────────────────────────►                 │                       │                       │                       │                       │
   │                          │                       │                        │                       │  ┌────────────────────────────────────────────┐ │                       │                       │
   │                          │                       │                        │                       │  │ 2.1 Lookup fingerprint in devices table  │ │                       │                       │
   │                          │                       │                        │                       │  │ 2.2 If new → INSERT, trustLevel=PENDING │ │                       │                       │
   │                          │                       │                        │                       │  │ 2.3 If known → UPDATE lastSeenAt       │ │                       │                       │
   │                          │                       │                        │                       │  └────────────────────────────────────────────┘ │                       │                       │
   │                          │                       │                        │                       │                       │──────────────────────►│                       │                       │
   │                          │                       │                        │                       │                       │◄──────────────────────│                       │                       │
   │                          │                       │                        │                       │◄──────────────────────│                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │  3. Session Limit      │                       │                       │                       │                       │                       │
   │                          │                       │────────────────────────►│                       │                       │                       │                       │                       │
   │                          │                       │                        │  ┌────────────────────────────────────────────┐ │                       │                       │                       │
   │                          │                       │                        │  │ 3.1 COUNT active sessions for user       │ │                       │                       │                       │
   │                          │                       │                        │  │ 3.2 Compare to plan.maxSessions          │ │                       │                       │                       │
   │                          │                       │                        │  │ 3.3 If full → RETURN 429 or suggest     │ │                       │                       │                       │
   │                          │                       │                        │  │     revoke oldest                        │ │                       │                       │                       │
   │                          │                       │                        │  └────────────────────────────────────────────┘ │                       │                       │                       │
   │                          │                       │◄────────────────────────│                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │  4. Validate Creds     │                       │                       │                       │                       │                       │
   │                          │                       │────────────────────────►│                       │                       │                       │                       │                       │
   │                          │                       │                        │  ┌────────────────────────────────────────────┐                       │                       │                       │
   │                          │                       │                        │  │ 4.1 better-auth signInEmail              │                       │                       │                       │
   │                          │                       │                        │  │ 4.2 Check email/password hash (bcrypt)  │                       │                       │                       │
   │                          │                       │                        │  │ 4.3 On fail → LOGIN_FAILED event       │                       │                       │                       │
   │                          │                       │                        │  └────────────────────────────────────────────┘                       │                       │                       │
   │                          │                       │◄────────────────────────│                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │  5. Risk Score (Sync)  │                       │                       │                       │                       │                       │
   │                          │                       │────────────────────────────────────────────────────────────────────►│                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │  ┌──────────────────┐  │                       │                       │
   │                          │                       │                        │                       │                       │                       │  │ 5.1 IP reputation │  │                       │                       │
   │                          │                       │                        │                       │                       │                       │  │ 5.2 Login velocity│  │                       │                       │
   │                          │                       │                        │                       │                       │                       │  │ 5.3 Device trust  │  │                       │                       │
   │                          │                       │                        │                       │                       │                       │  └──────────────────┘  │                       │                       │
   │                          │                       │◄────────────────────────────────────────────────────────────────────│                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │  6. Create Session     │                       │                       │                       │                       │                       │
   │                          │                       │────────────────────────►│                       │                       │                       │                       │                       │
   │                          │                       │                        │  INSERT INTO sessions───────────────────────────────────────────────────────────►│                       │
   │                          │                       │                        │  (token, userId, deviceId, ipAddress,                                        │                       │                       │
   │                          │                       │                        │   userAgent, country, riskScore, fingerprint)                                │                       │                       │
   │                          │                       │◄────────────────────────│                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │  Set-Cookie (session)    │                       │                        │                       │                       │                       │                       │                       │
   │◄─────────────────────────│───────────────────────│                        │                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │  7. ASYNC: Risk Score    │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │   Queue risk analysis  │                       │                       │                       │                       │                       │
   │                          │                       │────────────────────────►│                       │                       │                       │                       │                       │
   │                          │                       │                        │  ┌──────────────────┐  │                       │                       │                       │                       │
   │                          │                       │                        │  │ 7.1 Impossible   │  │                       │                       │                       │                       │
   │                          │                       │                        │  │     travel check  │  │                       │                       │                       │                       │
   │                          │                       │                        │  │ 7.2 IP reputation  │  │                       │                       │                       │                       │
   │                          │                       │                        │  │ 7.3 Behavioral    │  │                       │                       │                       │                       │
   │                          │                       │                        │  │     profiling     │  │                       │                       │                       │                       │
   │                          │                       │                        │  └──────────────────┘  │                       │                       │                       │                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │  8. NOTIFY if new device │                       │                        │                       │                       │                       │                       │                       │
   │                          │                       │                        │──────────────────────────────────────────────────────────────────────────────────────►│                       │
   │                          │                       │                        │                       │                       │                       │                       │                       │
   │  Email (new device)      │                       │                        │                       │                       │                       │                       │                       │
   │◄─────────────────────────────────────────────────│                        │                       │                       │                       │                       │                       │
```

## B.2 Logout Flow

```
Browser                    Next.js                 BetterAuth              SessionManager          WebSocket               Database
   │                          │                        │                       │                       │                       │
   │ POST /api/auth/sign-out  │                        │                       │                       │                       │
   │─────────────────────────►│                        │                       │                       │                       │
   │                          │───────────────────────►│                       │                       │                       │
   │                          │                        │──────────────────────►│                       │                       │
   │                          │                        │                       │                       │                       │
   │                          │                        │  1. Revoke Session    │                       │                       │
   │                          │                        │───────────────────────►│──────────────────────►│                       │
   │                          │                        │                       │  UPDATE sessions       │                       │
   │                          │                        │                       │  SET expiresAt = now() │                       │
   │                          │                        │                       │────────────────────────────────────────────►│
   │                          │                        │                       │                       │                       │
   │                          │                        │  2. Disconnect WS     │                       │                       │
   │                          │                        │                       │──────────────────────►│                       │
   │                          │                        │                       │                       │  socket.disconnect()  │
   │                          │                        │                       │                       │──────────────────────►│
   │                          │                        │                       │                       │◄──────────────────────│
   │                          │                        │                       │◄──────────────────────│                       │
   │                          │                        │◄──────────────────────│                       │                       │
   │                          │◄───────────────────────│                       │                       │                       │
   │                          │                        │                       │                       │                       │
   │  Set-Cookie (max-age=0)  │                        │                       │                       │                       │
   │◄─────────────────────────│                        │                       │                       │                       │
   │                          │                        │                       │                       │                       │
   │  3. ASYNC: SecurityEvent │                        │                       │                       │                       │
   │                          │──────────────────────────────────────────────────────────────────────────────────────────►│
   │                          │                        │                       │                       │  INSERT security_event│
   │                          │                        │                       │                       │  (SESSION_REVOKED)   │
```

## B.3 New Device Detection Flow

```
Browser                    Next.js                 DeviceManager           Notification            Database                Email
   │                          │                        │                       │                       │                       │
   │ POST /api/auth/sign-in   │                        │                       │                       │                       │
   │─────────────────────────►│                        │                       │                       │                       │
   │                          │───────────────────────►│                       │                       │                       │
   │                          │                        │                       │                       │                       │
   │                          │  1. Fingerprint Check  │                       │                       │                       │
   │                          │  Header: X-Device-Fp   │                       │                       │                       │
   │                          │───────────────────────►│                       │                       │                       │
   │                          │                        │  SELECT device        │                       │                       │
   │                          │                        │  WHERE fingerprint= ? │                       │                       │
   │                          │                        │────────────────────────────────────────────────►│                       │
   │                          │                        │◄────────────────────────────────────────────────│                       │
   │                          │                        │                       │                       │                       │
   │                          │                        │  NOT FOUND            │                       │                       │
   │                          │                        │  → trustLevel=PENDING │                       │                       │
   │                          │                        │  → INSERT NEW DEVICE  │                       │                       │
   │                          │                        │────────────────────────────────────────────────►│                       │
   │                          │                        │                       │                       │                       │
   │                          │  2. Send Verification  │                       │                       │                       │
   │                          │───────────────────────►│──────────────────────►│                       │                       │
   │                          │                        │                       │────────────────────────────────────────────►│
   │                          │                        │                       │                       │                       │
   │  Response: {             │                        │                       │                       │                       │
   │    requiresDeviceVerif:  │                        │                       │                       │                       │
   │      true,               │                        │                       │                       │                       │
   │    action: "VERIFY"      │                        │                       │                       │                       │
   │  }                       │                        │                       │                       │                       │
   │◄─────────────────────────│                        │                       │                       │                       │
   │                          │                        │                       │                       │                       │
   │  3. User checks email    │                        │                       │                       │                       │
   │  ───── CODE: 482931 ────│                        │                       │                       │                       │
   │                          │                        │                       │                       │                       │
   │  4. Submit code          │                        │                       │                       │                       │
   │ POST /api/auth/device/   │                        │                       │                       │                       │
   │   verify                 │                        │                       │                       │                       │
   │─────────────────────────►│───────────────────────►│                       │                       │                       │
   │                          │                        │  SELECT verification  │                       │                       │
   │                          │                        │  WHERE code = 482931  │                       │                       │
   │                          │                        │────────────────────────────────────────────────►│                       │
   │                          │                        │◄────────────────────────────────────────────────│                       │
   │                          │                        │                       │                       │                       │
   │                          │                        │  UPDATE device        │                       │                       │
   │                          │                        │  SET trustLevel=      │                       │                       │
   │                          │                        │      VERIFIED         │                       │                       │
   │                          │                        │────────────────────────────────────────────────►│                       │
   │                          │                        │                       │                       │                       │
   │  Response: { ok: true }  │                        │                       │                       │                       │
   │◄─────────────────────────│                        │                       │                       │                       │
```

## B.4 Session Expiration & Rotation Flow

```
Time                                                    Database                    Cron/Worker             SessionManager
 │                                                        │                            │                       │
 ├── Session Created (t=0)                                │                            │                       │
 │   expiresAt = t + 7 days                               │                            │                       │
 │   updateAge = t + 24h                                  │                            │                       │
 │                                                        │                            │                       │
 ├── t + 24h (Update Age reached)                         │                            │                       │
 │                                                        │                            │                       │
 │   Request with session cookie                           │                            │                       │
 │───────────────────────────────────────────────────────►│                            │                       │
 │                                                        │  Check updateAge            │                       │
 │                                                        │◄──────────────────────────►│                       │
 │                                                        │                            │                       │
 │                                                        │  ┌──────────────────────┐  │                       │
 │                                                        │  │ Session Rotation     │  │                       │
 │                                                        │  │ 1. Generate new token│  │                       │
 │                                                        │  │ 2. UPDATE token      │  │                       │
 │                                                        │  │ 3. Set-Cookie new    │  │                       │
 │                                                        │  │ 4. SecurityEvent     │  │                       │
 │                                                        │  └──────────────────────┘  │                       │
 │                                                        │                            │                       │
 │   Set-Cookie (new token)                                │                            │                       │
 │◄───────────────────────────────────────────────────────│                            │                       │
 │                                                        │                            │                       │
 ├── t + 7 days (Expiration)                              │                            │                       │
 │                                                        │                            │                       │
 │                                                        │  Cron: cleanup expired    │                       │
 │                                                        │───────────────────────────►│                       │
 │                                                        │                            │                       │
 │                                                        │  DELETE FROM sessions      │                       │
 │                                                        │  WHERE expiresAt < now()   │                       │
 │                                                        │──────────────────────────────────────────────────►│
 │                                                        │                            │                       │
 │                                                        │  INSERT security_event     │                       │
 │                                                        │  (SESSION_EXPIRED)         │                       │
 │                                                        │──────────────────────────────────────────────────►│
```

## B.5 Password Reset Flow

```
Browser                    Next.js                 BetterAuth              Notification            Database
   │                          │                        │                       │                       │
   │ 1. Request Reset         │                        │                       │                       │
   │ POST /auth/forgot-pw    │                        │                       │                       │
   │─────────────────────────►│───────────────────────►│                       │                       │
   │                          │                        │  INSERT verification  │                       │
   │                          │                        │  (token, expiresAt)   │                       │
   │                          │                        │──────────────────────────────────────────────►│
   │                          │───────────────────────►│──────────────────────►│                       │
   │                          │                        │                       │  Email with reset     │
   │                          │                        │                       │  link                 │
   │  Email (reset link)      │                        │                       │                       │
   │◄─────────────────────────│                        │                       │                       │
   │                          │                        │                       │                       │
   │ 2. Click Reset Link      │                        │                       │                       │
   │ GET /reset-password?     │                        │                       │                       │
   │   token=xxx              │                        │                       │                       │
   │─────────────────────────►│                        │                       │                       │
   │                          │───────────────────────►│  Verify token          │                       │
   │                          │                        │──────────────────────────────────────────────►│
   │                          │                        │◄──────────────────────────────────────────────│
   │                          │◄───────────────────────│                       │                       │
   │  Form (new password)     │                        │                       │                       │
   │◄─────────────────────────│                        │                       │                       │
   │                          │                        │                       │                       │
   │ 3. Submit New Password   │                        │                       │                       │
   │ POST /reset-password     │                        │                       │                       │
   │─────────────────────────►│───────────────────────►│                       │                       │
   │                          │                        │  UPDATE account       │                       │
   │                          │                        │  SET password (hash)  │                       │
   │                          │                        │──────────────────────────────────────────────►│
   │                          │                        │                       │                       │
   │                          │  4. Revoke all         │                       │                       │
   │                          │     OTHER sessions     │                       │                       │
   │                          │───────────────────────►│──────────────────────────────────────────────►│
   │                          │                        │  DELETE sessions      │                       │
   │                          │                        │  WHERE userId = ?     │                       │
   │                          │                        │  AND id != current    │                       │
   │                          │                        │──────────────────────────────────────────────►│
   │                          │                        │                       │                       │
   │                          │───────────────────────►│──────────────────────►│  Email confirmation   │
   │                          │                        │                       │  "Password changed"   │
   │  Redirect /login         │                        │                       │                       │
   │◄─────────────────────────│                        │                       │                       │
```

## B.6 Session Revocation Flow

```
Browser Client A            Browser Client B        Next.js                 SessionManager          WebSocket               Database
   │                              │                      │                       │                       │                       │
   │  Client A revokes session    │                      │                       │                       │                       │
   │  DELETE /api/sessions/{id}   │                      │                       │                       │                       │
   │─────────────────────────────►│                      │──────────────────────►│                       │                       │
   │                              │                      │                       │                       │                       │
   │                              │                      │  1. Verify ownership  │                       │                       │
   │                              │                      │  session.userId ===   │                       │                       │
   │                              │                      │  current.userId       │                       │                       │
   │                              │                      │──────────────────────►│                       │                       │
   │                              │                      │                       │  DELETE session       │                       │
   │                              │                      │                       │────────────────────────────────────────────────►│
   │                              │                      │                       │                       │                       │
   │                              │                      │  2. Notify Client B   │                       │                       │
   │                              │                      │                       │──────────────────────►│                       │
   │                              │                      │                       │                       │  socket.to(room)      │
   │                              │                      │                       │                       │  .emit("session:      │
   │                              │                      │                       │                       │   revoked")           │
   │                              │                      │                       │                       │────► Client B         │
   │                              │                      │                       │                       │                       │
   │  Response: 200               │                      │                       │                       │                       │
   │◄─────────────────────────────│                      │                       │                       │                       │
   │                              │                      │                       │                       │                       │
   │                              │  Client B redirect   │                       │                       │                       │
   │                              │◄──────────────────────────────────────────────────────────────────────│                       │
   │                              │  to /login           │                       │                       │                       │
```

---

# APPENDIX C — EVENT DRIVEN ARCHITECTURE

## C.1 Event Bus Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EVENT BUS (Redis Pub/Sub + BullMQ)                         │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          SECURITY EVENT TOPICS                                   │  │
│  │                                                                                  │  │
│  │  sec:auth:login:success       ───► SessionService, DeviceService, Analytics      │  │
│  │  sec:auth:login:failed        ───► FraudEngine, RateLimiter, Notifications       │  │
│  │  sec:auth:login:blocked       ───► Alerting, AdminNotification, Analytics        │  │
│  │  sec:auth:2fa:enabled         ───► SecurityService, Audit, UserNotification      │  │
│  │  sec:auth:2fa:failed          ───► FraudEngine, RateLimiter, Alerting             │  │
│  │  sec:session:created          ───► SessionManager, Analytics, Quota               │  │
│  │  sec:session:revoked          ───► SessionManager, WebSocket, Audit              │  │
│  │  sec:session:expired          ───► SessionManager, CleanupWorker                  │  │
│  │  sec:session:limit_reached    ───► SessionManager, Notification, Admin           │  │
│  │  sec:device:new               ───► DeviceManager, Notification, FraudEngine      │  │
│  │  sec:device:verified          ───► DeviceManager, TrustService                    │  │
│  │  sec:device:suspicious        ───► FraudEngine, Notification, AdminAlert          │  │
│  │  sec:device:blocked           ───► AdminNotification, UserEmail, Support          │  │
│  │  sec:risk:high                ───► FraudEngine, Notification, AdminPanel          │  │
│  │  sec:risk:critical            ───► PagerDuty, AdminSMS, UserEmail                 │  │
│  │  sec:admin:action             ───► Audit, AdminNotification, SecurityEvent        │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## C.2 Event Schema

```typescript
// src/lib/security/events.ts

interface SecurityEvent {
  id: string
  timestamp: string                      // ISO 8601
  version: number                        // Schema version
  
  // Core
  topic: SecurityTopic
  type: SecurityEventType
  severity: SecuritySeverity
  
  // Actor
  userId: string
  sessionId?: string
  deviceId?: string
  impersonatorId?: string                // If admin impersonating
  
  // Context
  ipAddress: string
  userAgent: string
  fingerprint: string
  country?: string
  city?: string
  latitude?: number
  longitude?: number
  
  // Risk
  riskScore: number
  riskFactors: RiskFactor[]
  
  // Metadata
  requestId: string                      // Correlation ID
  featureFlags: Record<string, boolean>  // Active FF at time of event
  
  // Payload
  details: Record<string, unknown>
  
  // Chain
  previousEventId?: string               // For event sourcing
  correlationId: string                  // Trace across services
}

enum SecurityTopic {
  AUTH_LOGIN = 'sec:auth:login',
  AUTH_2FA = 'sec:auth:2fa',
  AUTH_PASSWORD = 'sec:auth:password',
  SESSION = 'sec:session',
  DEVICE = 'sec:device',
  RISK = 'sec:risk',
  ADMIN = 'sec:admin',
  ALERT = 'sec:alert',
}
```

## C.3 Event Handlers

```typescript
// src/lib/security/event-handlers.ts

class SecurityEventHandler {
  private handlers: Map<SecurityTopic, EventHandler[]>
  private queue: BullQueue
  
  constructor(queue: BullQueue) {
    this.handlers = new Map()
    this.queue = queue
    this.registerDefaults()
  }
  
  private registerDefaults(): void {
    // LOGIN SUCCESS
    this.on('sec:auth:login:success', async (event) => {
      await Promise.all([
        this.sessionService.updateLastActivity(event.userId, event.sessionId!),
        this.deviceService.updateLastSeen(event.deviceId!, event.ipAddress),
        this.analytics.trackLogin(event.userId, event.country),
        this.fraudEngine.recordSuccessfulLogin(event),
        this.quotaService.checkSessionQuota(event.userId),
      ])
    })
    
    // LOGIN FAILED
    this.on('sec:auth:login:failed', async (event) => {
      await Promise.all([
        this.rateLimiter.increment(`failed:${event.ipAddress}`),
        this.fraudEngine.recordFailedLogin(event),
        this.analytics.trackFailedLogin(event),
      ])
      
      // Alert if suspicious pattern
      const attempts = await this.rateLimiter.get(`failed:${event.ipAddress}`)
      if (attempts >= 5) {
        await this.queue.add('security:alert', {
          type: 'BRUTEFORCE_DETECTED',
          ip: event.ipAddress,
          attempts,
          userId: event.userId,
        })
      }
    })
    
    // NEW DEVICE
    this.on('sec:device:new', async (event) => {
      await Promise.all([
        this.notificationService.notifyNewDevice(event),
        this.fraudEngine.analyzeNewDevice(event),
        this.adminPanel.addDeviceForReview(event.deviceId!),
      ])
    })
    
    // HIGH RISK
    this.on('sec:risk:high', async (event) => {
      await Promise.all([
        this.notificationService.notifySuspiciousLogin(event),
        this.adminPanel.flagForReview(event.userId),
        this.sessionService.flagSession(event.sessionId!),
      ])
    })
    
    // CRITICAL RISK
    this.on('sec:risk:critical', async (event) => {
      await Promise.all([
        this.sessionService.revokeAllSessions(event.userId, event.sessionId),
        this.notificationService.notifyAccountCompromised(event),
        this.adminPanel.triggerIncidentResponse(event),
        this.pagerDuty.triggerAlert({
          severity: 'critical',
          title: `Compte compromis: ${event.userId}`,
          details: event.details,
        }),
      ])
    })
  }
  
  async emit(event: SecurityEvent): Promise<void> {
    // 1. Publish to Redis Pub/Sub (real-time)
    await this.publishToRedis(event)
    
    // 2. Queue for async processing
    await this.queue.add(event.topic, event, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    })
    
    // 3. Persist to database
    await this.persistEvent(event)
  }
  
  private on(topic: string, handler: EventHandler): void {
    const handlers = this.handlers.get(topic) || []
    handlers.push(handler)
    this.handlers.set(topic, handlers)
  }
}
```

## C.4 Event Flow Diagram

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Source   │    │   Event Bus  │    │  Handlers    │    │  Side Effects│
│          │    │              │    │              │    │              │
│  Login   │───►│ sec:auth:    │───►│ SessionSvc   │───►│ DB Update    │
│  Handler │    │ login:success│    │ DeviceSvc    │───►│ DB Update    │
│          │    │              │    │ FraudEngine  │───►│ Async Queue  │
│          │    │              │    │ Analytics    │───►│ StatsD       │
│          │    │              │    │ Notification │───►│ Email        │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘

┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Device  │    │   Event Bus  │    │  Handlers    │    │  Side Effects│
│ Manager  │    │              │    │              │    │              │
│          │───►│ sec:device:  │───►│ Notification │───►│ Email        │
│          │    │ new          │    │ FraudEngine  │───►│ Risk Score   │
│          │    │              │    │ AdminPanel   │───►│ UI Update    │
│          │    │              │    │ DeviceSvc    │───►│ Trust Update │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘

┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Risk    │    │   Event Bus  │    │  Handlers    │    │  Side Effects│
│  Engine  │    │              │    │              │    │              │
│          │───►│ sec:risk:    │───►│ PagerDuty    │───►│ SMS          │
│  HIGH    │    │ high         │    │ Notification │───►│ Email        │
│          │    │              │    │ SessionSvc   │───►│ Flag Session │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘

┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Risk    │    │   Event Bus  │    │  Handlers    │    │  Side Effects│
│  Engine  │    │              │    │              │    │              │
│          │───►│ sec:risk:    │───►│ PagerDuty    │───►│ P1 Incident  │
│ CRITICAL │    │ critical     │    │ SessionSvc   │───►│ Revoke All   │
│          │    │              │    │ Admin        │───►│ Alert Team   │
│          │    │              │    │ User         │───►│ Force Logout │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

# APPENDIX D — DOMAIN DRIVEN DESIGN (DDD)

## D.1 Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NBA PLATFORM                                     │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   IDENTITY       │  │  AUTHENTICATION │  │    SECURITY             │  │
│  │   CONTEXT        │  │  CONTEXT        │  │    CONTEXT              │  │
│  │                  │  │                 │  │                         │  │
│  │  User            │  │  Session        │  │  Device                 │  │
│  │  Account         │  │  LoginAttempt   │  │  SecurityEvent          │  │
│  │  Role            │  │  TwoFactorCode  │  │  SecurityPolicy         │  │
│  │  Permission      │  │  BackupCode     │  │  DeviceFingerprint      │  │
│  │                  │  │  OAuthProvider  │  │  RiskScore              │  │
│  └────────┬────────┘  └───────┬─────────┘  └──────────┬──────────────┘  │
│           │                   │                        │                 │
│  ┌────────┴───────────────────┴────────────────────────┴──────────────┐  │
│  │                    SHARED KERNEL                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │  │
│  │  │ AuditLog │ │ Message  │ │ Email    │ │ Notification         │  │  │
│  │  │          │ │ Queue    │ │ Service  │ │ Service              │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   SUBSCRIPTION  │  │    SIGNALS      │  │    NOTIFICATION         │  │
│  │   CONTEXT       │  │    CONTEXT      │  │    CONTEXT              │  │
│  │                  │  │                 │  │                         │  │
│  │  Subscription   │  │  Signal          │  │  Notification           │  │
│  │   Plan           │  │  SignalAudience  │  │  NotificationDelivery  │  │
│  │  AccessRequest   │  │  SignalVersion  │  │  PushSubscription      │  │
│  │  PlanFeature     │  │  SignalRead     │  │  EmailEvent            │  │
│  │                  │  │  SignalTemplate │  │                         │  │
│  └────────┬────────┘  └───────┬─────────┘  └─────────────────────────┘  │
│           │                   │                        │                 │
│  ┌────────┴───────────────────┴────────────────────────┴──────────────┐  │
│  │                    SHARED INFRASTRUCTURE                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │  │
│  │  │ Database │ │ Redis    │ │ MinIO    │ │ Docker/K8s           │  │  │
│  │  │ (Prisma) │ │ (Cache)  │ │ (Storage)│ │ (Deployment)         │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   ADMINISTRATION│  │   ANALYTICS     │  │    REPORTING            │  │
│  │   CONTEXT       │  │   CONTEXT       │  │    CONTEXT              │  │
│  │                  │  │                 │  │                         │  │
│  │  AdminAction    │  │  Metric         │  │  Report                 │  │
│  │  Impersonation  │  │  Dashboard      │  │  Export                 │  │
│  │  Moderation     │  │  KPI            │  │  DataPoint              │  │
│  │  Support        │  │  Chart          │  │  Schedule               │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## D.2 Security Context — Domain Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SECURITY CONTEXT (Bounded Context)               │
│                                                                      │
│  ┌──────────────── AGGREGATES ────────────────┐                     │
│  │                                            │                     │
│  │  ┌─────────────────────────────────────┐   │                     │
│  │  │         DEVICE (Aggregate Root)      │   │                     │
│  │  │  - id: DeviceId (Value Object)      │   │                     │
│  │  │  - userId: UserId                   │   │                     │
│  │  │  - fingerprint: FingerprintHash      │   │                     │
│  │  │  - trustLevel: DeviceTrustLevel      │   │                     │
│  │  │  - riskScore: RiskScore             │   │                     │
│  │  │  - ipAddress: IpAddress             │   │                     │
│  │  │  - deviceInfo: DeviceInfo (VO)      │   │                     │
│  │  │  - trustedUntil: DateTime           │   │                     │
│  │  │  - flags: IpFlags (VO)              │   │                     │
│  │  │                                     │   │                     │
│  │  │  + verify(code): Result             │   │                     │
│  │  │  + trust(): void                    │   │                     │
│  │  │  + markSuspicious(reason): void     │   │                     │
│  │  │  + block(): void                    │   │                     │
│  │  └─────────────────────────────────────┘   │                     │
│  │                                            │                     │
│  │  ┌─────────────────────────────────────┐   │                     │
│  │  │      SESSION (Aggregate Root)        │   │                     │
│  │  │  - id: SessionId (VO)               │   │                     │
│  │  │  - userId: UserId                   │   │                     │
│  │  │  - token: SessionToken (VO)         │   │                     │
│  │  │  - deviceId: DeviceId               │   │                     │
│  │  │  - riskScore: RiskScore             │   │                     │
│  │  │  - ipAddress: IpAddress             │   │                     │
│  │  │  - geoLocation: GeoLocation (VO)     │   │                     │
│  │  │  - expiresAt: DateTime              │   │                     │
│  │  │  - state: SessionState              │   │                     │
│  │  │                                     │   │                     │
│  │  │  + revoke(): void                   │   │                     │
│  │  │  + rotate(): SessionToken           │   │                     │
│  │  │  + flagHighRisk(reason): void       │   │                     │
│  │  └─────────────────────────────────────┘   │                     │
│  │                                            │                     │
│  │  ┌─────────────────────────────────────┐   │                     │
│  │  │      SECURITY_EVENT (Aggregate Root) │   │                     │
│  │  │  - id: EventId (VO)                 │   │                     │
│  │  │  - userId: UserId                   │   │                     │
│  │  │  - type: SecurityEventType          │   │                     │
│  │  │  - severity: SecuritySeverity       │   │                     │
│  │  │  - context: EventContext (VO)        │   │                     │
│  │  │  - riskScore: RiskScore             │   │                     │
│  │  │  - details: EventDetails (VO)       │   │                     │
│  │  │  - notified: boolean                │   │                     │
│  │  └─────────────────────────────────────┘   │                     │
│  └────────────────────────────────────────────┘                     │
│                                                                      │
│  ──────── VALUE OBJECTS ────────                                     │
│                                                                      │
│  DeviceId(value: string)            FingerprintHash(value: string)    │
│  SessionId(value: string)           IpAddress(value: string)          │
│  UserId(value: string)              GeoLocation(lat, lng, country)  │
│  SessionToken(value: string)        RiskScore(value: 0-100)          │
│  EventId(value: string)             DeviceInfo(ua, type, os, etc.)   │
│  EventContext(ip, ua, fp, geo)      IpFlags(vpn, tor, proxy, dc)    │
│  EventDetails(type, payload)        TrustLevel(state, expiresAt)     │
│                                                                      │
│  ──────── DOMAIN SERVICES ────────                                   │
│                                                                      │
│  DeviceManager          SessionManager          RiskEngine           │
│  ├ registerDevice       ├ createSession         ├ evaluateSync      │
│  ├ verifyDevice         ├ revokeSession         ├ evaluateAsync     │
│  ├ trustDevice          ├ checkQuota            ├ calculateScore    │
│  ├ blockDevice          ├ rotateSession         └ getFactors        │
│  └ getIpInfo            └ listSessions                              │
│                                                                      │
│  TwoFactorService       SecurityNotifService    FraudEngine         │
│  ├ setup                ├ notifyNewDevice       ├ detectSharing     │
│  ├ enable               ├ notifySuspicious      ├ detectScraping    │
│  ├ disable              ├ notifyPasswordReset    ├ detectBot         │
│  ├ verify               ├ sendWeeklyDigest      └ detectCredStuff   │
│  └ generateBackupCodes  └ notifyAdmin                                │
│                                                                      │
│  ──────── REPOSITORIES ────────                                      │
│                                                                      │
│  DeviceRepository       SessionRepository      SecurityEventRepo    │
│  ├ findByFingerprint    ├ findByUserId          ├ findByUser        │
│  ├ findByUser           ├ findActive            ├ findByType        │
│  ├ save                 ├ countActive           ├ findBySeverity    │
│  └ delete               └ save                  └ save              │
│                                                                      │
│  ──────── DOMAIN EVENTS ────────                                     │
│                                                                      │
│  DeviceRegistered       SessionCreated         HighRiskDetected    │
│  DeviceVerified         SessionRevoked         CriticalRiskAlert   │
│  DeviceFlagged          SessionExpired         SecurityNotified    │
│  DeviceBlocked          QuotaReached           AdminActionLogged   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## D.3 Domain Event Examples

```typescript
// src/lib/security/domain-events.ts

// ── Device Domain Events ──

class DeviceRegistered implements DomainEvent {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
    public readonly fingerprint: string,
    public readonly ipAddress: string,
    public readonly trustLevel: DeviceTrustLevel,
    public readonly timestamp: Date = new Date(),
  ) {}
  
  get topic(): string { return 'sec:device:new' }
  get aggregateId(): string { return this.deviceId }
}

class DeviceVerified implements DomainEvent {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
    public readonly method: 'EMAIL_CODE' | 'TOTP' | 'BACKUP_CODE',
    public readonly timestamp: Date = new Date(),
  ) {}
  
  get topic(): string { return 'sec:device:verified' }
  get aggregateId(): string { return this.deviceId }
}

// ── Session Domain Events ──

class SessionCreated implements DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly riskScore: number,
    public readonly ipAddress: string,
    public readonly country: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
  
  get topic(): string { return 'sec:session:created' }
  get aggregateId(): string { return this.sessionId }
}

class QuotaReached implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly currentSessions: number,
    public readonly maxSessions: number,
    public readonly oldestSessionId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
  
  get topic(): string { return 'sec:session:limit_reached' }
  get aggregateId(): string { return this.userId }
}

// ── Risk Domain Events ──

class HighRiskDetected implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly riskScore: number,
    public readonly factors: RiskFactor[],
    public readonly details: Record<string, unknown>,
    public readonly timestamp: Date = new Date(),
  ) {}
  
  get topic(): string { return 'sec:risk:high' }
  get aggregateId(): string { return this.sessionId }
}
```

---

# APPENDIX E — ABUSE DETECTION ENGINE

## E.1 Detection Categories

```
ABUSE DETECTION ENGINE
│
├── ACCOUNT_SHARING
│   ├── ConcurrentSessionsDetector
│   │   └── Plusieurs sessions actives depuis IPs différentes
│   ├── GeoVelocityDetector
│   │   └── Connexions depuis pays différents en < 1h
│   ├── DeviceCollisionDetector
│   │   └── Même fingerprint, users différents
│   └── SessionReuseDetector
│       └── Même session utilisée depuis IPs différentes
│
├── SIGNAL_RESELLING
│   ├── MassDownloadDetector
│   │   └── Téléchargement massif de signaux
│   ├── RapidAccessDetector
│   │   └── Accès à N signaux en < T secondes
│   └── DataExfiltrationDetector
│       └── Pattern de scraping automatisé
│
├── BOT_DETECTION
│   ├── HeadlessBrowserDetector
│   │   └── Détection de Puppeteer/Playwright/Selenium
│   ├── RequestPatternDetector
│   │   └── Patterns de requêtes non-humains
│   ├── RateLimitDetector
│   │   └── Requêtes exactement aux limites
│   └── CAPTCHAChallenge
│       └── Défi CAPTCHA si suspect
│
├── CREDENTIAL_STUFFING
│   ├── VelocityDetector
│   │   └── N tentatives depuis IPs différentes
│   ├── CommonPasswordDetector
│   │   └── Mots de passe de fuites connues
│   ├── EmailPatternDetector
│   │   └── Patterns d'emails jetables
│   └── TimingAttackDetector
│       └── Temps de réponse anormaux
│
├── IMPOSSIBLE_TRAVEL
│   ├── DistanceCalculator
│   │   └── Distance > vol max possible en temps écoulé
│   ├── TimeWindowAnalyzer
│   │   └── Fenêtre temporelle entre 2 connexions
│   └── HistoricalPatternAnalyzer
│       └── Écart par rapport aux habitudes
│
├── FINGERPRINT_COLLISION
│   ├── CollisionDetector
│   │   └── Même fingerprint, comptes différents
│   ├── EntropyAnalyzer
│   │   └── Fingerprint trop faible (peu de signaux)
│   └── SpoofingDetector
│       └── Signaux incohérents (ex: WebGL != OS)
│
└── MULTI_ACCOUNT
    ├── IPClusterDetector
    │   └── N comptes depuis même IP
    ├── DeviceClusterDetector
    │   └── N comptes depuis même fingerprint
    ├── EmailPatternDetector
    │   └── Pattern d'emails (nom+1, nom+2, etc.)
    └── BehavioralClusterDetector
        └── Mêmes horaires, mêmes features
```

## E.2 Detector Architecture

```typescript
// src/lib/security/abuse/detector.ts

interface DetectionResult {
  detected: boolean
  confidence: number         // 0-100
  category: AbuseCategory
  evidence: Evidence[]
  recommendation: 'NONE' | 'FLAG' | 'CHALLENGE' | 'BLOCK' | 'ALERT_ADMIN'
}

interface Evidence {
  type: string
  value: unknown
  weight: number
  description: string
}

abstract class AbuseDetector {
  abstract name: string
  abstract category: AbuseCategory
  abstract weight: number       // Importance relative
  abstract detect(context: DetectionContext): Promise<DetectionResult>
  
  protected createResult(
    detected: boolean,
    confidence: number,
    evidence: Evidence[],
    recommendation: DetectionResult['recommendation'] = 'NONE',
  ): DetectionResult {
    return {
      detected,
      confidence,
      category: this.category,
      evidence,
      recommendation,
    }
  }
}

// ── Specific Detectors ──

class ConcurrentSessionsDetector extends AbuseDetector {
  name = 'ConcurrentSessions'
  category = AbuseCategory.ACCOUNT_SHARING
  weight = 0.8
  
  async detect(context: DetectionContext): Promise<DetectionResult> {
    const sessions = await this.sessionRepo.findActiveByUser(context.userId)
    const uniqueIps = new Set(sessions.map(s => s.ipAddress))
    const uniqueDevices = new Set(sessions.map(s => s.deviceId))
    
    const evidence: Evidence[] = []
    let confidence = 0
    
    if (sessions.length > 3) {
      evidence.push({
        type: 'session_count',
        value: sessions.length,
        weight: 0.4,
        description: `${sessions.length} sessions actives simultanément`,
      })
      confidence += 30
    }
    
    if (uniqueIps.size > 2) {
      evidence.push({
        type: 'unique_ips',
        value: uniqueIps.size,
        weight: 0.3,
        description: `${uniqueIps.size} IPs différentes pour les sessions actives`,
      })
      confidence += 25
    }
    
    if (uniqueDevices.size > 2 && uniqueDevices.size === sessions.length) {
      evidence.push({
        type: 'unique_devices',
        value: uniqueDevices.size,
        weight: 0.3,
        description: `Chaque session depuis un appareil différent`,
      })
      confidence += 20
    }
    
    return this.createResult(
      confidence > 50,
      Math.min(confidence, 100),
      evidence,
      confidence > 70 ? 'CHALLENGE' : 'FLAG',
    )
  }
}

class ImpossibleTravelDetector extends AbuseDetector {
  name = 'ImpossibleTravel'
  category = AbuseCategory.IMPOSSIBLE_TRAVEL
  weight = 0.9
  
  async detect(context: DetectionContext): Promise<DetectionResult> {
    const lastSession = await this.sessionRepo.findLastByUser(context.userId)
    if (!lastSession?.latitude || !lastSession?.longitude) {
      return this.createResult(false, 0, [])
    }
    
    const current = context.geoLocation
    const distance = this.haversineDistance(
      lastSession.latitude, lastSession.longitude,
      current.latitude, current.longitude,
    )
    
    const timeDiff = (context.timestamp.getTime() - lastSession.createdAt.getTime()) / 1000 / 3600 // hours
    const maxTravelSpeed = 900 // km/h (commercial flight)
    const possibleDistance = timeDiff * maxTravelSpeed
    
    const evidence: Evidence[] = []
    
    if (distance > possibleDistance * 1.5) {
      evidence.push({
        type: 'impossible_distance',
        value: { distance, possibleDistance, timeDiff },
        weight: 0.8,
        description: `Distance ${Math.round(distance)}km impossible en ${Math.round(timeDiff)}h (max ${Math.round(possibleDistance)}km)`,
      })
      
      return this.createResult(true, 90, evidence, 'CHALLENGE')
    }
    
    return this.createResult(false, 0, [])
  }
  
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  private toRad(deg: number): number {
    return deg * Math.PI / 180
  }
}

// ── Orchestrator ──

class AbuseDetectionEngine {
  private detectors: AbuseDetector[] = []
  
  constructor() {
    this.register(new ConcurrentSessionsDetector(/*...*/))
    this.register(new ImpossibleTravelDetector(/*...*/))
    this.register(new GeoVelocityDetector(/*...*/))
    this.register(new DeviceCollisionDetector(/*...*/))
    this.register(new BotDetector(/*...*/))
    this.register(new CredentialStuffingDetector(/*...*/))
    this.register(new SessionReuseDetector(/*...*/))
    this.register(new MassDownloadDetector(/*...*/))
  }
  
  async analyze(context: DetectionContext): Promise<AggregatedResult> {
    const results = await Promise.all(
      this.detectors.map(d => d.detect(context))
    )
    
    const activeResults = results.filter(r => r.detected)
    const totalConfidence = activeResults.reduce(
      (sum, r) => sum + r.confidence * (r.category === context.primaryCategory ? 1.5 : 1),
      0
    )
    const avgConfidence = totalConfidence / activeResults.length
    
    const recommendation = this.getRecommendation(avgConfidence, activeResults)
    
    return {
      abused: activeResults.length > 0,
      confidence: Math.min(Math.round(avgConfidence), 100),
      results: activeResults,
      recommendation,
      primaryCategory: context.primaryCategory,
    }
  }
  
  private getRecommendation(
    confidence: number,
    results: DetectionResult[],
  ): DetectionResult['recommendation'] {
    if (confidence >= 80) return 'BLOCK'
    if (confidence >= 60) return 'CHALLENGE'
    if (confidence >= 30) return 'FLAG'
    if (results.some(r => r.recommendation === 'ALERT_ADMIN')) return 'ALERT_ADMIN'
    return 'NONE'
  }
}
```

---

# APPENDIX F — FEATURE FLAGS & ROLLBACK STRATEGY

## F.1 Feature Flag System

```typescript
// src/lib/security/feature-flags.ts

enum SecurityFeatureFlag {
  SESSION_LIMIT = 'security.session_limit',
  DEVICE_BINDING = 'security.device_binding',
  DEVICE_TRUST = 'security.device_trust',
  GEOLOCATION = 'security.geolocation',
  TWO_FA = 'security.2fa',
  OTP = 'security.otp',
  RISK_ENGINE = 'security.risk_engine',
  EMAIL_ALERT = 'security.email_alert',
  COOKIE_ROTATION = 'security.cookie_rotation',
  IMPOSSIBLE_TRAVEL = 'security.impossible_travel',
  IP_REPUTATION = 'security.ip_reputation',
  ABUSE_DETECTION = 'security.abuse_detection',
  AI_FRAUD = 'security.ai_fraud',
}

interface FeatureFlagConfig {
  flag: SecurityFeatureFlag
  enabled: boolean
  rolloutPercentage: number     // 0-100
  description: string
  owner: string
  createdAt: Date
  updatedAt: Date
  
  // Rollback
  rollbackProcedure: string
  maxFailureRate: number        // Auto-disable if failure rate > this
  cooldownMinutes: number       // Min time between toggle
}

class FeatureFlagManager {
  private flags: Map<SecurityFeatureFlag, boolean>
  private store: Redis
  
  constructor(store: Redis) {
    this.flags = new Map()
    this.store = store
    this.loadFromStore()
  }
  
  async isEnabled(flag: SecurityFeatureFlag, userContext?: UserContext): Promise<boolean> {
    const globalEnabled = this.flags.get(flag) ?? false
    if (!globalEnabled) return false
    
    // Gradual rollout
    if (userContext && this.flags.has(flag)) {
      const config = await this.getConfig(flag)
      if (config.rolloutPercentage < 100) {
        const userBucket = this.hashUser(userContext.userId) % 100
        if (userBucket >= config.rolloutPercentage) return false
      }
    }
    
    return true
  }
  
  async enable(flag: SecurityFeatureFlag, percentage: number = 100): Promise<void> {
    await this.store.set(`ff:${flag}`, JSON.stringify({
      enabled: true,
      rolloutPercentage: percentage,
      updatedAt: new Date(),
    }))
    this.flags.set(flag, true)
    
    await this.logFlagChange(flag, true)
  }
  
  async disable(flag: SecurityFeatureFlag): Promise<void> {
    await this.store.set(`ff:${flag}`, JSON.stringify({
      enabled: false,
      rolloutPercentage: 0,
      updatedAt: new Date(),
    }))
    this.flags.set(flag, false)
    
    await this.logFlagChange(flag, false)
  }
  
  private async logFlagChange(flag: SecurityFeatureFlag, enabled: boolean): Promise<void> {
    await prisma.securityEvent.create({
      data: {
        type: 'SECURITY_ALERT',
        severity: 'HIGH',
        details: {
          action: enabled ? 'FEATURE_FLAG_ENABLED' : 'FEATURE_FLAG_DISABLED',
          flag,
          triggeredBy: 'admin',
        },
      },
    })
  }
}
```

## F.2 Feature Flag Matrix

| Flag | Description | Phase | Auto-disable | Rollback |
|------|-------------|-------|-------------|----------|
| `SESSION_LIMIT` | Limite sessions simultanées | 2a | Failure rate > 5% | Désactiver hook session.create.before |
| `DEVICE_BINDING` | Session liée au device fingerprint | 2a | Session errors > 3% | Désactiver vérification fingerprint |
| `DEVICE_TRUST` | Trust level pour devices | 2a | Verification failure > 10% | Ignorer trust level |
| `GEOLOCATION` | GeoIP tracking | 2c | Geodata unavailable > 20% | Skip geo checks |
| `TWO_FA` | 2FA TOTP enabled | 2b | Support tickets > 50/j | Désactiver twoFactor plugin |
| `OTP` | Email OTP fallback | 2b | Email delivery > 5min | Fallback to TOTP only |
| `RISK_ENGINE` | Risk scoring sync | 2c | Latency > 200ms | Skip risk engine |
| `EMAIL_ALERT` | Security notifications | 2b | Bounce rate > 5% | Désactiver temporairement |
| `COOKIE_ROTATION` | Token rotation 24h | 2a | Rotation errors > 1% | Désactiver updateAge |
| `IMPOSSIBLE_TRAVEL` | Travel detection | 2c | False positives > 10% | Désactiver détection |
| `IP_REPUTATION` | IP reputation check | 2c | API unavailable | Fallback = allow |
| `ABUSE_DETECTION` | Abuse engine | 2d | CPU > 80% | Skip async analysis |
| `AI_FRAUD` | ML fraud detection | Future | Model accuracy < 80% | Fallback to rule engine |

## F.3 Rollback Procedures

```
┌──────────────────────────────────────────────────────────────────┐
│                    ROLLBACK PLAYBOOK                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CRITICAL: Session Limit Bug                                     │
│  ─────────────────────────────────                               │
│  Symptom: Legitimate users blocked from login                    │
│  Detection: Support tickets spike > 5x normal                    │
│  Action:                                                         │
│    1. ⚡ DISABLE feature flag SESSION_LIMIT                      │
│    2. 📋 Notify support team of known issue                      │
│    3. 🔍 Investigate root cause                                  │
│    4. ✅ Fix + test + re-enable gradually (5% → 25% → 100%)     │
│  Rollback Time: < 30 seconds (flag toggle)                       │
│                                                                  │
│  HIGH: 2FA Email OTP Down                                        │
│  ───────────────────────                                         │
│  Symptom: Users can't receive OTP emails                         │
│  Detection: Email delivery monitoring alert                      │
│  Action:                                                         │
│    1. ⚡ DISABLE OTP flag → fallback to TOTP only               │
│    2. 📋 Notify users to use authenticator app                   │
│    3. 🔍 Check Resend status                                    │
│    4. ✅ Re-enable when Resend recovers                          │
│  Rollback Time: < 30 seconds                                     │
│                                                                  │
│  MEDIUM: Risk Engine False Positives                             │
│  ──────────────────────────────────                              │
│  Symptom: High rate of legitimate logins flagged                 │
│  Detection: Risk score monitoring > 20% false positives          │
│  Action:                                                         │
│    1. ⚡ DISABLE RISK_ENGINE sync flag                          │
│    2. 📋 Keep async analysis running (non-blocking)              │
│    3. 🔍 Tune risk thresholds                                   │
│    4. ✅ Re-enable with adjusted thresholds                      │
│  Rollback Time: < 30 seconds                                     │
│                                                                  │
│  LOW: Geolocation Data Inaccurate                                │
│  ────────────────────────────────                                │
│  Symptom: Users flagged for wrong country                        │
│  Detection: Support tickets about "wrong location"               │
│  Action:                                                         │
│    1. 📋 Log incidents for later analysis                        │
│    2. 🔍 Check MaxMind DB accuracy                              │
│    3. 🔧 Update GeoIP database                                  │
│  Rollback Time: Not critical, can wait for fix                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

# APPENDIX G — SLO / SLA / KPI

## G.1 Service Level Objectives (SLO)

| Service | Metric | Target | Severity | Measurement |
|---------|--------|--------|----------|-------------|
| **Login API** | P95 latency | < 300ms | Critical | Request timings |
| **Session Check** | P95 latency | < 20ms | High | Redis/DB query |
| **Risk Engine (Sync)** | P95 latency | < 50ms | High | In-process |
| **Risk Engine (Async)** | P99 latency | < 5s | Medium | Queue processing |
| **Device Detection** | P95 latency | < 30ms | High | DB lookup |
| **2FA Verification** | P95 latency | < 200ms | High | TOTP computation |
| **Security Notification** | P99 latency | < 30s | Medium | Email queue |
| **Session Revocation** | P95 latency | < 100ms | High | DB + WS |
| **GeoIP Lookup** | P95 latency | < 10ms | Medium | MaxMind local DB |
| **Abuse Detection** | P99 latency | < 1s | Medium | Async worker |
| **Event Bus** | P99 latency | < 100ms | Medium | Redis Pub/Sub |
| **IP Reputation** | P95 latency | < 50ms | Low | API/DB |
| **Feature Flag Check** | P95 latency | < 5ms | Low | Redis get |
| **API Availability** | Uptime | 99.95% | Critical | Monitoring |
| **Auth Availability** | Uptime | 99.99% | Critical | Monitoring |

## G.2 Service Level Agreement (SLA)

| Promise | Target | Penalty |
|---------|--------|---------|
| Login < 500ms P99 | 99.9% of requests | Service credit |
| Auth availability | 99.99% uptime/month | 5% credit per 0.01% below |
| Session validity | 100% accurate (no false revoke) | Guaranteed |
| Security notification delivery | 99% within 30s | N/A (best effort) |
| 2FA accuracy | 100% correct verification | N/A |
| Data retention | Security events kept 12 months | Regulatory |

## G.3 Key Performance Indicators (KPIs)

### Security KPIs

| KPI | Formule | Cible | Alerte |
|-----|---------|-------|--------|
| **Average Sessions/User** | `total_sessions / total_users` | < 3 | > 5 |
| **Average Devices/User** | `total_devices / total_users` | < 2 | > 4 |
| **Session Limit Hit Rate** | `blocked_logins / total_logins` | < 5% | > 10% |
| **Blocked Accounts (daily)** | `count(LOGIN_BLOCKED)` | < 1% of users | > 5% |
| **False Positive Rate** | `(flags_reviewed - flags_confirmed) / flags_total` | < 5% | > 15% |
| **2FA Adoption Rate** | `users_with_2fa / total_users` | > 50% | < 20% |
| **2FA Success Rate** | `2fa_success / 2fa_attempts` | > 95% | < 80% |
| **Fraud Detected (weekly)** | `count(HIGH + CRITICAL events)` | Monitor trend | 3x weekly avg |
| **Account Sharing Rate** | `flagged_sharing / total_users` | < 2% | > 5% |
| **Revenue Saved (monthly)** | `estimated_sharers * plan_price` | Track | N/A |

### Operational KPIs

| KPI | Formule | Cible | Alerte |
|-----|---------|-------|--------|
| **Login P95 Latency** | `percentile(login_duration, 0.95)` | < 300ms | > 500ms |
| **Session Check P95** | `percentile(session_check, 0.95)` | < 20ms | > 50ms |
| **Security Events/h** | `count(events) / hour` | Monitor | > 1000/h |
| **Alert Response Time** | `time_to_first_action` | < 5min P1 | > 15min |
| **Support Tickets (security)** | `count(support_tickets)` | < 10/day | > 50/day |
| **Email Bounce Rate** | `bounced / sent` | < 2% | > 5% |

### Business KPIs

| KPI | Formule | Impact |
|-----|---------|--------|
| **Account Sharing Rate (Estimated)** | `(sessions > avg * 2) / total_users` | Revenue leakage |
| **Conversion Rate** | `trial → paid` | Anti-sharing increases conversion |
| **Churn Rate (security-related)** | `churned_due_to_security / total_churned` | User trust |
| **Customer Trust Score** | Survey | Brand value |
| **Support Cost / User** | `support_cost / total_users` | Efficiency |

## G.4 KPI Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  NBA Security KPIs Dashboard                   Last 24h │ 7d │30d│
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐               │
│ │ Sessions/User        │ │ Devices/User         │               │
│ │ 2.1 ↑ 0.3 vs 7d     │ │ 1.6 ↑ 0.2 vs 7d     │               │
│ │ 🟢 Target: < 3.0    │ │ 🟢 Target: < 2.0    │               │
│ └──────────────────────┘ └──────────────────────┘               │
│ ┌──────────────────────┐ ┌──────────────────────┐               │
│ │ 2FA Adoption         │ │ False Positive Rate  │               │
│ │ 34% ↑ 12% vs 7d     │ │ 3.2% ↓ 1.1% vs 7d   │               │
│ │ 🟡 Target: > 50%    │ │ 🟢 Target: < 5%     │               │
│ └──────────────────────┘ └──────────────────────┘               │
│ ┌──────────────────────┐ ┌──────────────────────┐               │
│ │ Login P95 Latency    │ │ Security Events/h    │               │
│ │ 245ms 🟢             │ │ 142 🟡               │               │
│ │ Target: < 300ms      │ │ Baseline: 120        │               │
│ └──────────────────────┘ └──────────────────────┘               │
├──────────────────────────────────────────────────────────────────┤
│ Session/User Distribution                                       │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 1 session   ██████████████████████████████████████████ 68% │  │
│ │ 2 sessions  ████████████████ 28%                         │  │
│ │ 3 sessions  ████ 7%                                      │  │
│ │ 4+ sessions █ 1% ← Potential sharers                     │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                │
│ Fraud Detection Trend (7 days)                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Mon ████████ 45                                            │  │
│ │ Tue ████████ 42                                            │  │
│ │ Wed ██████████ 52                                          │  │
│ │ Thu ███████ 38                                             │  │
│ │ Fri ██████████████ 72  ← Weekend effect?                   │  │
│ │ Sat ████████████ 58                                        │  │
│ │ Sun █████████ 48                                           │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

# APPENDIX H — AI FRAUD ENGINE (ARCHITECTURE)

## H.1 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                           AI FRAUD DETECTION ENGINE                               │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                           FEATURE PIPELINE                                  │  │
│  │                                                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │ USER FEATURES   │  │ SESSION FEATURES│  │ BEHAVIORAL FEATURES         │ │  │
│  │  │                 │  │                 │  │                             │ │  │
│  │  │ - account_age   │  │ - time_of_day   │  │ - mouse_movement_pattern    │ │  │
│  │  │ - email_domain  │  │ - day_of_week   │  │ - typing_speed             │ │  │
│  │  │ - has_2fa       │  │ - ip_reputation │  │ - scroll_pattern            │ │  │
│  │  │ - plan_tier     │  │ - device_trust  │  │ - click_pattern             │ │  │
│  │  │ - kyc_status    │  │ - geo_distance  │  │ - navigation_flow           │ │  │
│  │  │ - login_count   │  │ - browser_fp    │  │ - time_on_page              │ │  │
│  │  │ - failed_logins │  │ - session_age   │  │ - feature_usage_pattern     │ │  │
│  │  │ - previous_flags│  │ - risk_score    │  │ - api_call_frequency        │ │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                                        ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                          ENSEMBLE MODELS                                    │  │
│  │                                                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │  XGBoost Model  │  │  Random Forest  │  │  Neural Network (MLP)       │ │  │
│  │  │                 │  │                 │  │                             │ │  │
│  │  │  - Tabular data │  │  - Ensemble     │  │  - Deep features            │ │  │
│  │  │  - Fast (<10ms) │  │  - Robust       │  │  - Non-linear patterns      │ │  │
│  │  │  - Interpretable│  │  - Feature imp  │  │  - High accuracy            │ │  │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘ │  │
│  │           │                    │                           │                │  │
│  │           └────────────────────┴───────────────────────────┘                │  │
│  │                              │                                              │  │
│  │                              ▼                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                     ENSEMBLE AVERAGING                                │  │  │
│  │  │  score = (xgb * 0.4) + (rf * 0.3) + (nn * 0.3)                       │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                                        ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                       DECISION LAYER                                       │  │
│  │                                                                             │  │
│  │  score < 0.3 → 🟢 ALLOW (no action)                                       │  │
│  │  score 0.3-0.5 → 🟡 FLAG (log + monitor)                                  │  │
│  │  score 0.5-0.7 → 🟠 CHALLENGE (2FA required)                              │  │
│  │  score 0.7-0.9 → 🔴 BLOCK (notify user + admin)                           │  │
│  │  score > 0.9 → 🚨 CRITICAL (revoke all sessions + alert team)             │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                                        ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                       FEEDBACK LOOP                                        │  │
│  │                                                                             │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────────────────┐  │  │
│  │  │ Prediction│───►│ Outcome  │───►│ Label    │───►│ Model Retraining  │  │  │
│  │  │ Score    │    │ (review) │    │ (fraud?) │    │ (weekly)           │  │  │
│  │  └──────────┘    └──────────┘    └──────────┘    └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## H.2 Model Training Pipeline

```python
# ml/account_sharing/train.py

"""
ML Pipeline for Account Sharing Detection

Data Sources:
  - LoginAttempt (10M+ rows)
  - SecurityEvent (2M+ rows)
  - Session (500K+ rows)
  - Device (200K+ rows)

Features:
  - 45 engineered features
  - Categories: user, session, device, behavioral, temporal

Models:
  - XGBoost (primary, fast inference)
  - Random Forest (ensemble, robust)
  - MLP (deep patterns)

Evaluation:
  - Precision: > 0.95 (minimize false positives)
  - Recall: > 0.80 (catch actual fraud)
  - F1: > 0.87
  - AUC-ROC: > 0.95
"""

class AccountSharingModel:
    def __init__(self):
        self.xgb = XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.05,
            scale_pos_weight=10,  # Handle class imbalance
            eval_metric='auc',
        )
        self.rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_leaf=50,
            class_weight='balanced',
        )
        self.nn = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid'),
        ])
    
    def predict(self, features: np.array) -> tuple[float, dict]:
        xgb_score = self.xgb.predict_proba(features)[0, 1]
        rf_score = self.rf.predict_proba(features)[0, 1]
        nn_score = self.nn.predict(features, verbose=0)[0, 0]
        
        # Ensemble weighted average
        final_score = xgb_score * 0.4 + rf_score * 0.3 + nn_score * 0.3
        
        return final_score, {
            'xgb': float(xgb_score),
            'rf': float(rf_score),
            'nn': float(nn_score),
            'ensemble': float(final_score),
        }

# Feature Engineering
def engineer_features(login_context: dict) -> np.array:
    features = []
    
    # User features
    features.append(login_context['account_age_days'])
    features.append(hash_email_domain(login_context['email']))
    features.append(float(login_context['has_2fa']))
    features.append(encode_plan_tier(login_context['plan']))
    
    # Session features
    features.append(login_context['hour_of_day'])
    features.append(login_context['day_of_week'])
    features.append(float(login_context['is_weekend']))
    
    # Device features
    features.append(login_context['device_trust_score'])
    features.append(login_context['device_age_days'])
    
    # Behavioral
    features.append(login_context['logins_last_24h'])
    features.append(login_context['failed_logins_last_hour'])
    features.append(login_context['unique_ips_last_24h'])
    
    # Geo
    features.append(login_context['geo_distance_km'])
    features.append(login_context['country_risk_score'])
    
    return np.array(features).reshape(1, -1)
```

## H.3 Inference Service

```typescript
// src/lib/security/ai/inference.ts

/**
 * AI Fraud Detection Inference Service
 * 
 * Communicates with Python ML service via gRPC or REST.
 * Falls back to rule engine if ML service is unavailable.
 */
class AIFraudInferenceService {
  private mlClient: MLServiceClient
  private ruleEngine: AbuseDetectionEngine
  private feedbackQueue: BullQueue
  
  constructor() {
    this.mlClient = new MLServiceClient(process.env.ML_SERVICE_URL!)
    this.ruleEngine = new AbuseDetectionEngine()
    this.feedbackQueue = new BullQueue('ml-feedback')
  }
  
  async evaluate(context: LoginContext): Promise<AIFraudResult> {
    try {
      // Try ML model first (with timeout)
      const mlResult = await Promise.race([
        this.mlClient.predict(this.featurize(context)),
        this.timeout(100), // 100ms timeout for ML
      ])
      
      // Fallback: use rule engine
      const ruleResult = await this.ruleEngine.analyze(context)
      
      // Combine results
      const combinedScore = mlResult 
        ? mlResult.score * 0.6 + ruleResult.confidence * 0.01 * 0.4
        : ruleResult.confidence * 0.01
      
      return {
        score: combinedScore,
        level: this.scoreToLevel(combinedScore),
        mlScore: mlResult?.score,
        mlModels: mlResult?.models,
        ruleBased: ruleResult,
        source: mlResult ? 'ENSEMBLE' : 'RULES_ONLY',
      }
    } catch (error) {
      // Complete fallback to rule engine
      const ruleResult = await this.ruleEngine.analyze(context)
      return {
        score: ruleResult.confidence / 100,
        level: this.scoreToLevel(ruleResult.confidence / 100),
        ruleBased: ruleResult,
        source: 'RULES_ONLY',
        error: error.message,
      }
    }
  }
  
  async recordFeedback(
    predictionId: string,
    actualOutcome: 'FRAUD' | 'LEGITIMATE',
    reviewedBy?: string,
  ): Promise<void> {
    // Queue for batch retraining
    await this.feedbackQueue.add('feedback', {
      predictionId,
      actualOutcome,
      reviewedBy,
      timestamp: new Date(),
    })
  }
  
  private featurize(context: LoginContext): number[] {
    // Convert login context to feature vector
    // Must match Python feature engineering
    return [
      this.userFeatures(context),
      this.sessionFeatures(context),
      this.deviceFeatures(context),
      this.behavioralFeatures(context),
      this.geoFeatures(context),
    ].flat()
  }
  
  private scoreToLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 0.3) return 'LOW'
    if (score < 0.5) return 'MEDIUM'
    if (score < 0.7) return 'HIGH'
    return 'CRITICAL'
  }
  
  private timeout(ms: number): Promise<null> {
    return new Promise(resolve => setTimeout(() => resolve(null), ms))
  }
}

interface AIFraudResult {
  score: number              // 0-1
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  mlScore?: number
  mlModels?: Record<string, number>
  ruleBased: DetectionResult
  source: 'ENSEMBLE' | 'ML_ONLY' | 'RULES_ONLY'
  error?: string
}
```

## H.4 Behavioral Profiling

```typescript
// src/lib/security/ai/behavioral-profile.ts

/**
 * User behavioral profile.
 * Learns normal patterns over time.
 * Anomalies indicate potential account sharing.
 */
class BehavioralProfile {
  private readonly userId: string
  private readonly store: Redis
  
  // Learned patterns
  private loginTimes: number[] = []          // Hours of day (0-23)
  private loginDays: number[] = []            // Days of week (0-6)
  private loginCountries: Map<string, number> = new Map()
  private loginDevices: Map<string, number> = new Map()
  private sessionDuration: number[] = []
  private activeHours: Set<number> = new Set()
  private preferredFeatures: Set<string> = new Set()
  
  async learn(event: SecurityEvent): Promise<void> {
    const hour = new Date(event.timestamp).getHours()
    const day = new Date(event.timestamp).getDay()
    
    this.loginTimes.push(hour)
    this.loginDays.push(day)
    
    if (event.country) {
      this.loginCountries.set(
        event.country,
        (this.loginCountries.get(event.country) || 0) + 1,
      )
    }
    
    // Keep recent window (last 1000 events)
    if (this.loginTimes.length > 1000) {
      this.loginTimes.shift()
      this.loginDays.shift()
    }
    
    // Persist to Redis
    await this.save()
  }
  
  async isAnomalous(event: Partial<SecurityEvent>): Promise<AnomalyResult> {
    const anomalies: Anomaly[] = []
    
    // Time anomaly
    if (event.timestamp) {
      const hour = new Date(event.timestamp).getHours()
      const hourFreq = this.loginTimes.filter(h => h === hour).length / this.loginTimes.length
      if (hourFreq < 0.05 && this.loginTimes.length > 50) {
        anomalies.push({
          type: 'UNUSUAL_LOGIN_TIME',
          confidence: 1 - hourFreq,
          detail: `Login at hour ${hour} (normal: ${(hourFreq * 100).toFixed(1)}%)`,
        })
      }
    }
    
    // Country anomaly
    if (event.country && this.loginCountries.size > 0) {
      const maxCountry = [...this.loginCountries.entries()]
        .sort((a, b) => b[1] - a[1])[0][0]
      
      if (event.country !== maxCountry && this.loginCountries.get(event.country)! < 3) {
        anomalies.push({
          type: 'NEW_COUNTRY',
          confidence: 0.7,
          detail: `Login from new country: ${event.country} (usual: ${maxCountry})`,
        })
      }
    }
    
    // Multi-country anomaly (strong sharing signal)
    if (event.country) {
      const uniqueCountries = this.loginCountries.size
      if (uniqueCountries > 3 && this.loginTimes.length > 100) {
        anomalies.push({
          type: 'MULTI_COUNTRY_ACCESS',
          confidence: Math.min(0.5 + uniqueCountries * 0.1, 0.95),
          detail: `Account accessed from ${uniqueCountries} different countries`,
        })
      }
    }
    
    return {
      isAnomalous: anomalies.length > 0,
      anomalies,
      anomalyScore: anomalies.reduce((sum, a) => sum + a.confidence, 0) / Math.max(anomalies.length, 1),
    }
  }
  
  async getSharingRiskScore(): Promise<number> {
    const factors: number[] = []
    
    // 1. Multiple countries → high risk
    if (this.loginCountries.size > 1) {
      factors.push(Math.min(this.loginCountries.size * 15, 60))
    }
    
    // 2. Multiple devices → medium risk
    if (this.loginDevices.size > 2) {
      factors.push(Math.min((this.loginDevices.size - 2) * 20, 40))
    }
    
    // 3. 24h active (sign of shared account across timezones)
    if (this.activeHours.size > 16) {
      factors.push(30)
    }
    
    // 4. Concurrent sessions in different countries
    // (calculated externally, passed as factor)
    
    return Math.min(factors.reduce((a, b) => a + b, 0), 100)
  }
  
  private async save(): Promise<void> {
    const key = `behavior:${this.userId}`
    await this.store.setex(key, 90 * 24 * 60 * 60, JSON.stringify({
      loginTimes: this.loginTimes,
      loginDays: this.loginDays,
      loginCountries: [...this.loginCountries.entries()],
      loginDevices: [...this.loginDevices.entries()],
      activeHours: [...this.activeHours],
    }))
  }
}
```

---

## H.5 Model Monitoring

| Metric | Description | Target | Action if degraded |
|--------|-------------|--------|-------------------|
| **Model Accuracy** | Correct predictions / total | > 95% | Trigger retraining |
| **Precision** | True positives / (TP + FP) | > 95% | Adjust threshold |
| **Recall** | True positives / (TP + FN) | > 80% | Adjust threshold |
| **F1 Score** | 2 * (P * R) / (P + R) | > 0.87 | Full review |
| **AUC-ROC** | Area under ROC curve | > 0.95 | Retrain |
| **Prediction Latency** | P95 inference time | < 50ms | Optimize model |
| **False Positive Rate** | FP / total predictions | < 5% | Tune threshold |
| **Model Drift** | Feature distribution shift | < 0.1 KS test | Retrain |
| **Data Freshness** | Training data age | < 7 days | Scheduled retrain |

---

# APPENDIX I — COMPLETE SCORING MATRIX

## I.1 Architecture Maturity Scores

| Critère | Poids | Avant | Après | Justification Après |
|---------|-------|-------|-------|---------------------|
| Session Management | 15% | 2/10 | 9/10 | Limites par plan, binding device, rotation, révocation, rotation automatique |
| Device Management | 15% | 3/10 | 9/10 | State machine complète, fingerprint renforcé, trust levels, vérification |
| 2FA/MFA | 10% | 0/10 | 9/10 | TOTP + backup codes + trusted device bypass + recovery flow |
| Anomaly Detection | 10% | 0/10 | 8/10 | Impossible travel, IP reputation, velocity, behavioral profiling |
| Security Notifications | 10% | 1/10 | 9/10 | Nouvel appareil, nouvelle localisation, login suspect, digest hebdo |
| Rate Limiting | 10% | 7/10 | 9/10 | Multi-couche (IP, user, global), sliding window, Redis HA |
| Audit | 10% | 6/10 | 9/10 | Event bus, chaîne d'événements, traçabilité complète, integrity |
| Abuse Detection | 10% | 0/10 | 8/10 | 8+ détecteurs spécialisés, scores de confiance, recommandations |
| Feature Flags | 5% | 0/10 | 9/10 | Gradual rollout, auto-disable, toutes les protections toggleables |
| Rollback Strategy | 5% | 0/10 | 9/10 | Procédures documentées, temps de rollback < 30s |
| KPIs / SLO | 5% | 0/10 | 8/10 | 30+ KPIs, SLO par service, dashboard temps réel |
| AI Fraud (Future) | 5% | 0/10 | 6/10 | Architecture conçue, ML pipeline défini, feedback loop |
| **TOTAL PONDÉRÉ** | **100%** | **2.1/10** | **8.7/10** | |

## I.2 Implementation Priority vs Impact

```
Impact
  │
  │  SESSION_LIMIT ●═══════════● DEVICE_DETECTION
  │       (10x)                    (9x)
  │
  │  SECURITY_NOTIF ●══════● 2FA
  │       (7x)               (8x)
  │
  │  RISK_ENGINE ●════● ABUSE_DETECTION
  │       (5x)           (5x)
  │
  │  AI_FRAUD ●
  │       (2x)
  │
  └─────────────────────────────────────────────── Effort
     Low                              High
```

---

*Fin de l'Appendice — Architecture Complète, Phase 2*

*Prochaine étape : Création des documents spécialisés :*
*- MASTER_FRAUD_ENGINE.md (détection de fraude, scoring, IA)*
*- MASTER_AUTH_ARCHITECTURE.md (Better Auth, OAuth, sessions, MFA)*
*- MASTER_ZERO_TRUST_SECURITY.md (Never Trust, Always Verify, Least Privilege)*
