# MASTER SECURITY AUDIT — NeverBrokeAgain (NBA)

> **Date :** 2026-07-19
> **Périmètre :** `src/` (47k LOC hors généré), `prisma/`, `workers/`, `scripts/`, Docker, Compose, dépendances
> **Référentiels :** OWASP ASVS · OWASP Top 10 · OWASP API Top 10 · CWE Top 25 · CIS Controls
> **Méthode :** Revue de code exhaustive par équipe de sécurité (AppSec, DevSecOps, Pentest, Privacy, DB Sec)

---

## 1. RÉSUMÉ EXÉCUTIF

L'application NeverBrokeAgain présente un **niveau de sécurité globalement fragile**. Les bonnes pratiques Next.js/Prisma/BetterAuth sont suivies pour l'essentiel (cookies httpOnly, pas de raw SQL non protégé, RBAC serveur appliqué), mais **5 vulnérabilités CRITICAL et 12 HIGH** subsistent, principalement dues à des **erreurs de conception** (bypass CSRF, webhooks bloqués, sessions exposées) et des **secrets exposés** dans des scripts.

**Les problèmes les plus urgents à corriger avant toute mise en production :**
1. Injection de session admin (tous les tokens de session exposés aux admins)
2. Bypass CSRF via `startsWith` permettant de contourner toute protection POST/PUT/DELETE
3. CSRF bloque les webhooks (Resend + Telegram = 403 silencieux)
4. Webhook Telegram sans authentification (envoi de messages arbitraire possible)
5. `requirePermission` ne vérifie pas `isActive` (utilisateur suspendu conserve ses permissions)

---

## 2. SCORE GLOBAL DE SÉCURITÉ

| Domaine | Score (/100) | Niveau |
|---|---|---|
| Authentification | 62 | ⚠️ Faible |
| Autorisation (RBAC) | 55 | ⚠️ Faible |
| API Security | 58 | ⚠️ Faible |
| Validation & Injection | 78 | 🟡 Moyen |
| Gestion des secrets | 45 | 🔴 Critique |
| Infrastructure & Docker | 48 | 🔴 Critique |
| Sécurité frontend | 65 | 🟡 Moyen |
| Base de données | 52 | ⚠️ Faible |
| Confidentialité / RGPD | 48 | 🔴 Critique |
| Logging & Monitoring | 60 | 🟡 Moyen |
| **SCORE GLOBAL** | **56/100** | **⚠️ REFACTORING SÉCURITÉ INDISPENSABLE** |

---

## 3. MATRICE DES RISQUES

### 🔴 CRITICAL (5) — Correction obligatoire avant production

| # | Vulnérabilité | Impact | CVSS approx. |
|---|---|---|---|
| C1 | **Exposition des tokens de session aux admins** — `api/admin/security/sessions` retourne toutes les colonnes Session (dont `token`) sans `select` projection | Prise de contrôle de n'importe quel compte | 8.1 |
| C2 | **Bypass CSRF via `startsWith`** — `lib/csrf.ts:26` permet `origin.startsWith("https://access.signauxx.com")` → `access.signauxx.com.evil.com` accepté | CSRF sur tous les POST/PUT/DELETE | 7.4 |
| C3 | **Webhooks bloqués par CSRF** — `middleware.ts` applique CSRF global → Resend/Telegram reçoivent 403 (pas d'Origin/Referer navigateur) | Perte silencieuse de notifications email + Telegram | 7.5 |
| C4 | **Webhook Telegram sans authentification** — Aucune vérification de token secret, POST accepté de n'importe qui | Usurpation de messages Telegram, spam, déni de service | 8.1 |
| C5 | **Mot de passe DB production hardcodé** — `scripts/test-suite.sh:190-231` contient `npg_1p4AxYIEmkuj` + host Neon complet | Accès total à la base de production | 9.8 |

### 🟠 HIGH (10) — Correction prioritaire

| # | Vulnérabilité | Impact | CVSS approx. |
|---|---|---|---|
| H1 | **`requirePermission` bypass `isActive`** — `auth-utils.ts:48-70` ne vérifie jamais `user.isActive`. Utilisateur suspendu conserve toutes ses permissions (signals.create, admin.*) | Élévation de privilèges post-suspension | 7.6 |
| H2 | **Oracle d'énumération d'emails** — `api/auth/check-login` public, sans rate-limit, retourne `deleted`/`inactive`/`banned`/`ok` | Harvesting d'emails, attaques ciblées | 5.3 |
| H3 | **Spoofing d'IP via headers non fiables** — `auth.ts:66` trust `x-forwarded-for`/`x-real-ip`/`cf-connecting-ip` sans proxy de confiance | Bypass rate-limit, empoisonnement audit logs | 7.3 |
| H4 | **Changement de mot de passe ne révoque pas les sessions** — `change-password/route.ts:41-47` appelle `auth.api.changePassword()` sans `session.deleteMany()` | Session volée reste active après reset | 6.8 |
| H5 | **Aucun header de sécurité** — `next.config.ts` définit seulement `Cache-Control` + `Alt-Svc`. Pas de CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | Clickjacking, MIME-sniffing, XSS amplifié | 6.5 |
| H6 | **Redis exposé publiquement** — `compose.yml:74-75` bind `6379:6379` sur `0.0.0.0`. Redis sans `requirepass` localement | Accès non authentifié au cache/sessions | 7.0 |
| H7 | **Docker images tournent en root** — `Dockerfile:87` et `Dockerfile.worker:42` utilisent `USER root` en PID 1 | Escape conteneur facilité | 6.5 |
| H8 | **Backup copie `.env` complet** — `scripts/backup.sh:48-50` archive tout `.env` (DB, Redis, Resend, VAPID, tokens) vers B2 | Compromission B2 = toutes les clés | 7.5 |
| H9 | **`.env` envoyé à Sentry sans PII scrubbing** — `sentry.server.config.ts:1-22` pas de `beforeSend` redaction. Erreurs serveur avec corps de requête (emails, tokens) expédiées à Sentry | Fuite de données vers SaaS tiers | 6.5 |
| H10 | **Pas de rate-limit sur sign-in** — `api/auth/sign-in` ne wrap pas `rateLimitMiddleware` avant d'appeler better-auth | Brute-force facilité | 7.5 |

### 🟡 MEDIUM (12)

| # | Vulnérabilité |
|---|---|
| M1 | **Path traversal dans `storage/local.ts:33,42,52`** — `join(this.basePath, path)` n'utilise pas `path.resolve()`. `..` non filtré. Atténué car les noms de fichiers sont des UUID aujourd'hui |
| M2 | **Profile PUT sans validation** — `dashboard/profile/route.ts:40-51` extrait `name,phone,whatsapp,country,language` sans Zod |
| M3 | **Notification prefs sans validation** — `api/dashboard/notification-preferences/route.ts:44-66` spread non validé → injection JSONB |
| M4 | **Suppression de compte = soft-delete** — `delete-account/route.ts:55` appelle `softDeleteUser()`. `hardDeleteUser()` existe mais n'est jamais appelé. GDPR Art.17 non respecté |
| M5 | **SMTP password en clair dans la DB** — `admin/settings/route.ts:13-21` écrit `smtpPass` dans la table `settings` |
| M6 | **Backup non chiffré dans `/tmp`** — `scripts/backup.sh` dump DB sans compression ni GPG, écrit dans `/tmp/` (world-readable) |
| M7 | **Source maps production non désactivées** — `next.config.ts` pas de `productionSourceMaps: false` |
| M8 | **`execSync` dans la route admin crons** — `admin/crons/route.ts:64` exécute `crontab -l` |
| M9 | **KYC retention incohérente** — Page privacy dit 30 jours, `queue.ts` planifie 7 jours, mais les rows DB ne sont jamais purgées |
| M10 | **Audit logs contiennent du PII** — `audit.ts:11` met `userEmail` dans `searchText`. `email-status.ts:86,157,214` écrit des emails dans `AuditLog.details` (JSONB) |
| M11 | **Hijacking de push subscription** — `push/subscribe/route.ts:33-44` réassigne silencieusement un endpoint à un autre utilisateur |
| M12 | **`NEXT_PUBLIC_SENTRY_DSN`** exposé côté client — standard Sentry mais ajoute la surface d'attaque (tout visiteur peut envoyer des évènements falsifiés) |

### 🟢 LOW (8)

| # | Vulnérabilité |
|---|---|
| L1 | **howler.js CVE-2020-20712** — prototype pollution, version 2.2.4 (2.2.5 corrige) |
| L2 | **`console.warn` en production** — `use-socket.ts:99`, `push-notification-toggle.tsx:51,82` fuient des détails d'infrastructure |
| L3 | **Sonner versions dupliquées** — root `^2.0.3`, design-system `^1.7.0` → bundle les deux |
| L4 | **Cookie `secure` lié à `NODE_ENV`** — auth.ts:26 `secure: NODE_ENV === "production"`. Staging derrière HTTPS = secure:false |
| L5 | **Pas de cookie consent mechanism** — page cookies statique, pas de bannière interactive |
| L6 | **Superuser DB unique** — pas de séparation read/write, pas de least-privilege |
| L7 | **Pas de scan antivirus sur uploads** — `validate.ts` vérifie les magic bytes mais pas ClamAV |
| L8 | **`scheduleFileCleanup` dupliqué** — défini dans `workers/queue.ts:66` ET `src/lib/queue.ts:108`, risque de double file d'attente |

---

## 4. LISTE DÉTAILLÉE DES VULNÉRABILITÉS

### 🔴 C1 — Exposition des tokens de session aux admins

- **Fichier :** `src/app/api/admin/security/sessions/route.ts:10-17`
- **Gravité :** CRITICAL · CVSS 8.1
- **Description :** `prisma.session.findMany()` sans `select` → retourne toutes les colonnes du modèle `Session`, y compris le champ `token`. N'importe quel admin peut récupérer 50 tokens de session bruts et usurper l'identité de n'importe quel utilisateur.
- **Impact :** Prise de contrôle totale de comptes utilisateurs. Contournement complet de l'authentification.
- **Exploitabilité :** Triviale — requête GET authentifiée en tant qu'admin.
- **Cause racine :** Absence de projection `select` sur un modèle contenant des secrets.
- **Recommandation :** Ajouter `select: { id: true, userId: true, expiresAt: true, createdAt: true, updatedAt: true, ipAddress: true, userAgent: true, user: { select: { name: true, email: true } } }` — **ne jamais exposer le champ `token`**.

### 🔴 C2 — Bypass CSRF via `startsWith`

- **Fichier :** `src/lib/csrf.ts:26-27`
- **Gravité :** CRITICAL · CVSS 7.4
- **Description :** La vérification `origin.startsWith(o)` où `o` = `"https://access.signauxx.com"` accepte `https://access.signauxx.com.evil.com` comme origine valide. Un attaquant qui enregistre un sous-domaine sur son propre domaine peut contourner la protection CSRF pour tous les POST/PUT/DELETE.
- **Impact :** CSRF sur toutes les routes mutables (création de signaux, modification de profil, etc.)
- **Exploitabilité :** Modérée — nécessite l'enregistrement d'un domaine, mais totalement reproductible.
- **Cause racine :** Utilisation de `startsWith` au lieu d'une comparaison exacte d'origine.
- **Recommandation :** Remplacer par `new URL(origin).origin === o` (comparaison exacte).

### 🔴 C3 — Webhooks bloqués par le CSRF global

- **Fichier :** `src/middleware.ts:28-31` (csrfCheck global sur `/api/*`)
- **Gravité :** CRITICAL · CVSS 7.5
- **Description :** Le middleware applique désormais `csrfCheck` à toutes les routes `/api/*`. Les webhooks Resend (`/api/webhooks/resend`) et Telegram (`/api/telegram/webhook`) reçoivent des POST sans en-têtes `Origin`/`Referer` (requêtes serveur-à-serveur). Le `csrfCheck` modifié à l'Étape 0 **bloque désormais les requêtes sans Origin/Referer** avec un 403.
- **Impact :** Les webhooks Resend (notifications email, bounces, spam reports) et Telegram cessent de fonctionner. Perte silencieuse de toutes les notifications sortantes et de la boucle de feedback email.
- **Exploitabilité :** Automatique dès le déploiement du middleware modifié.
- **Cause racine :** Le fix CSRF de l'Étape 0 a corrigé le bypass sans Origin, mais n'a pas exclu les chemins webhook légitimes.
- **Recommandation :** Ajouter `/api/webhooks` et `/api/telegram` dans les `PUBLIC_PREFIXES` du middleware, OU créer une fonction `isWebhookPath()` qui bypass le CSRF.

### 🔴 C4 — Webhook Telegram sans authentification

- **Fichier :** `src/app/api/telegram/webhook/route.ts:5-86`
- **Gravité :** CRITICAL · CVSS 8.1
- **Description :** Aucune vérification de `X-Telegram-Bot-Api-Secret-Token` ou de signature HMAC. N'importe qui peut POST des payloads Telegram forgés → scan de TOUS les utilisateurs (`prisma.user.findMany()`), lecture des `telegram_chat_id`, et envoi de messages via le bot.
- **Impact :** Usurpation de messages Telegram, spam, déni de service, fuite de métadonnées utilisateur.
- **Exploitabilité :** Triviale — POST non authentifié.
- **Cause racine :** Oubli de la validation du secret token Telegram.
- **Recommandation :** Ajouter la validation `X-Telegram-Bot-Api-Secret-Token` en comparant avec `TELEGRAM_WEBHOOK_SECRET` (variable d'env à créer). Documenter dans le README.

### 🔴 C5 — Mot de passe DB production hardcodé

- **Fichier :** `scripts/test-suite.sh:190,231`
- **Gravité :** CRITICAL · CVSS 9.8
- **Description :** `PGPASSWORD="npg_1p4AxYIEmkuj"` avec l'host Neon complet, commité dans le repo. Toute personne ayant accès au repo (public ou privé) peut se connecter à la base de production, lire/modifier/supprimer toutes les données.
- **Impact :** Compromission totale de la base de données. Fuite de tous les emails, sessions, tokens, historiques.
- **Exploitabilité :** Triviale — le mot de passe est en clair dans un fichier versionné.
- **Cause racine :** Hardcodage de credentials dans un script de test.
- **Recommandation :** Rotation immédiate du mot de passe Neon. Supprimer `PGPASSWORD` du script. Utiliser `DATABASE_URL` depuis `.env` (déjà fait dans le reste de l'app). Ajouter `scripts/test-suite.sh` au `.gitignore` si des credentials y sont nécessaires, ou utiliser des variables d'environnement.

---

### 🟠 H1 — `requirePermission` bypass `isActive`

- **Fichier :** `src/lib/auth-utils.ts:48-70`
- **Gravité :** HIGH · CVSS 7.6
- **Description :** `requirePermission` appelle `requireAuth()` (qui retourne la session), puis fait un `user.findUnique` avec `select: { role: { permissions... } }` — **sans sélectionner `isActive`**. Contrairement à `requireRole` (ligne 42) et `requireActiveUser` (ligne 30) qui vérifient `isActive`, `requirePermission` laisse passer les utilisateurs suspendus.
- **Impact :** Un utilisateur suspendu conserve toutes les permissions RBAC (signals.create, kyc.review, broker.review, admin.*) jusqu'à expiration de sa session (7 jours).
- **Exploitabilité :** Moyenne — nécessite d'avoir été suspendu avec une session active.
- **Recommandation :** Ajouter `isActive: true` dans le `select` et vérifier dans la condition de rejet.

### 🟠 H2 — Oracle d'énumération d'emails

- **Fichier :** `src/app/api/auth/check-login/route.ts:1-42`
- **Gravité :** HIGH · CVSS 5.3
- **Description :** Route **publique, sans authentification, sans rate-limit** qui retourne des messages distincts pour chaque état de compte : `deleted`, `inactive`, `banned`, `ok`. Permet à un attaquant de valider des listes d'emails et d'identifier les comptes existants, bannis, ou supprimés.
- **Impact :** Reconnaissance, harvesting d'emails, attaques ciblées (credential stuffing, phishing).
- **Exploitabilité :** Triviale — GET sans auth.
- **Recommandation :** Uniformiser la réponse (toujours retourner `ok`). Ajouter `rateLimitMiddleware`. Si le comportement actuel est requis par l'UX de login, ajouter une protection CAPTCHA ou rate-limit très agressif (3 req/min/IP).

### 🟠 H3 — Spoofing d'IP via headers non fiables

- **Fichier :** `src/lib/auth.ts:66`
- **Gravité :** HIGH · CVSS 7.3
- **Description :** Better Auth est configuré pour truster `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip` comme source d'adresse IP. Sans proxy de confiance (nginx, Cloudflare) qui **écrase** ces headers, un attaquant peut injecter `X-Forwarded-For: 127.0.0.1` pour contourner les rate-limits (`rate-limit.ts:65`) et empoisonner les logs d'audit (`sign-in/route.ts:15`).
- **Impact :** Bypass rate-limit, empoisonnement des logs, potentiellement bypass de session IP-binding.
- **Exploitabilité :** Facile — il suffit d'ajouter un header HTTP.
- **Recommandation :** Ne truster ces headers que si l'application est derrière un reverse proxy **connu** (Cloudflare, Nginx). Ajouter une vérification : si `NODE_ENV === "production"` et pas de `CF-Ray` header, ignorer `cf-connecting-ip`. Sinon, utiliser `req.socket.remoteAddress` comme fallback.

### 🟠 H4 — Sessions non révoquées au changement de mot de passe

- **Fichier :** `src/app/api/dashboard/change-password/route.ts:41-47`
- **Gravité :** HIGH · CVSS 6.8
- **Description :** La route appelle `auth.api.changePassword()` mais ne supprime **aucune** session existante. Better Auth ne révoque pas automatiquement les autres sessions. Un attaquant avec un cookie de session volé conserve l'accès après que la victime a changé son mot de passe.
- **Impact :** Persistance d'accès non autorisé après reset de mot de passe.
- **Exploitabilité :** Moyenne — nécessite d'avoir volé un cookie de session au préalable.
- **Recommandation :** Après `auth.api.changePassword()`, exécuter `prisma.session.deleteMany({ where: { userId: session.user.id } })`. La route admin `members/route.ts:183-185` le fait déjà correctement — prendre exemple.

### 🟠 H5 — Aucun header de sécurité HTTP

- **Fichier :** `next.config.ts:19-38`
- **Gravité :** HIGH · CVSS 6.5
- **Description :** Le bloc `headers()` ne définit que `Cache-Control` et `Alt-Svc`. Absence totale de :
  - **CSP** — pas de Content-Security-Policy → XSS non mitigé
  - **HSTS** — pas de Strict-Transport-Security → downgrade attack possible
  - **X-Frame-Options** — clickjacking possible
  - **X-Content-Type-Options** — MIME-sniffing possible
  - **Referrer-Policy** — fuite de referrer
  - **Permissions-Policy** — APIs navigateur non restreintes
- **Impact :** Surface d'attaque élargie pour XSS, clickjacking, downgrade TLS, fuite d'information.
- **Recommandation :** Ajouter le bloc suivant dans `headers()` :

```ts
{
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains; preload",
},
{
  key: "X-Frame-Options",
  value: "DENY",
},
{
  key: "X-Content-Type-Options",
  value: "nosniff",
},
{
  key: "Referrer-Policy",
  value: "strict-origin-when-cross-origin",
},
{
  key: "Permissions-Policy",
  value: "camera=(), microphone=(), geolocation=()",
},
```

La CSP nécessite une analyse plus approfondie (inline scripts dans `layout.tsx`, styles Tailwind) — à traiter séparément.

### 🟠 H6 — Redis exposé publiquement

- **Fichier :** `compose.yml:74-75`
- **Gravité :** HIGH · CVSS 7.0
- **Description :** `ports: "6379:6379"` bind Redis sur `0.0.0.0`. Combiné à l'absence de `requirepass` (ou mot de passe faible), Redis est accessible sans authentification depuis le réseau.
- **Impact :** Accès non authentifié à toutes les données en cache, sessions, queue BullMQ.
- **Recommandation :** Remplacer `ports` par `expose: [6379]` (réseau Docker interne uniquement). Si l'accès externe est nécessaire (VPS2), utiliser un réseau overlay chiffré (WireGuard/Tailscale), pas une exposition directe.

### 🟠 H7 — Docker images en root

- **Fichier :** `Dockerfile:87`, `Dockerfile.worker:42`
- **Gravité :** HIGH · CVSS 6.5
- **Description :** Les deux images utilisent `USER root`. Bien qu'un utilisateur `nextjs` (uid 1001) soit créé, le PID 1 tourne en root et l'entrypoint drop via `su` (pas `gosu`/`tini`). En cas de RCE dans l'application, l'attaquant obtient les privilèges root dans le conteneur.
- **Impact :** Élévation de privilèges dans le conteneur, accès aux capabilities Linux complètes.
- **Recommandation :** Changer `USER nextjs` avant CMD/ENTRYPOINT. Utiliser `tini` comme init (PID 1). Ajouter `cap_drop: [ALL]` et `cap_add: [NET_BIND_SERVICE]` dans compose.

### 🟠 H8 — Backup copie `.env` complet vers B2

- **Fichier :** `scripts/backup.sh:48-50`
- **Gravité :** HIGH · CVSS 7.5
- **Description :** Le script de backup archive le fichier `.env` complet (DB, Redis, Resend, VAPID, tokens, clés) avec le dump DB dans une archive envoyée vers Backblaze B2.
- **Impact :** Compromission du bucket B2 = exfiltration de TOUS les secrets de production.
- **Recommandation :** Exclure `.env` du backup. Sauvegarder uniquement le dump DB. Si les credentials B2 sont dans `.env`, les passer via un fichier séparé (`b2_credentials`) monté comme secret Docker.

### 🟠 H9 — PII envoyé à Sentry sans scrubbing

- **Fichier :** `sentry.server.config.ts:1-22`
- **Gravité :** HIGH · CVSS 6.5
- **Description :** Aucune configuration `beforeSend` pour redacter les données sensibles. Les erreurs serveur capturent automatiquement les corps de requête, headers, et cookies — potentiellement contenant des emails, tokens, et données personnelles.
- **Impact :** Fuite de PII vers un SaaS tiers (Sentry). Non-conformité RGPD.
- **Recommandation :** Ajouter un `beforeSend` qui :
  1. Supprime les cookies de la capture
  2. Redacte les emails dans `request.body` et `request.headers`
  3. Supprime les champs `password`, `token`, `secret`

### 🟠 H10 — Pas de rate-limit wrapper sur sign-in

- **Fichier :** `src/app/api/auth/sign-in/route.ts:1-47`
- **Gravité :** HIGH · CVSS 7.5
- **Description :** La route délègue directement à `auth.api.signInEmail()` sans wrap `rateLimitMiddleware`. Better Auth a un rate-limit interne (`max:5/window:60`), mais le double wrapper (`rateLimitMiddleware` + better-auth) est plus résilient.
- **Impact :** Brute-force facilité si le rate-limit Better Auth est contourné ou mal configuré.
- **Recommandation :** Ajouter `await rateLimitMiddleware(req, "auth:signin")` avant l'appel à better-auth.

---

## 5. CARTOGRAPHIE DES SURFACES D'ATTAQUE

| Surface | Niveau de risque | Vecteurs | Impact |
|---|---|---|---|
| **API Admin** | 🔴 CRITICAL | Session tokens exposés (C1), `requirePermission` bypass (H1) | Prise de contrôle totale |
| **API Auth** | 🟠 HIGH | Oracle email (H2), IP spoofing (H3), no rate-limit (H10) | Reconnaissance, brute-force |
| **Webhooks** | 🔴 CRITICAL | CSRF bloque Resend/Telegram (C3), Telegram no auth (C4) | Perte notifications, usurpation |
| **CSRF** | 🔴 CRITICAL | Bypass startsWith (C2) | CSRF sur tout POST/PUT/DELETE |
| **Docker / Infra** | 🟠 HIGH | Root containers (H7), Redis public (H6), backup secrets (H8) | Escape, exfiltration |
| **Base de données** | 🟡 MEDIUM | Hardcoded password (C5), pas de least-privilege (L6), PII en clair (M10) | Compromission DB |
| **Frontend** | 🟡 MEDIUM | Pas de CSP/HSTS (H5), source maps (M7), Sentry DSN public (M12) | XSS, clickjacking |
| **Fichiers** | 🟡 MEDIUM | Path traversal local.ts (M1), pas d'antivirus (L7) | Lecture arbitraire |
| **Confidentialité** | 🟠 HIGH | Soft-delete uniquement (M4), KYC retention floue (M9) | Non-conformité RGPD |
| **Dépendances** | 🟢 LOW | howler CVE (L1), sonner dupliqué (L3) | Prototype pollution |

---

## 6. DETTE DE SÉCURITÉ

| Dette | Sévérité | Effort correctif | Risque cumulé |
|---|---|---|---|
| Absence de CSP | HIGH | 2-3 jours (analyse inline scripts + rollout) | XSS non mitigé |
| Sessions non révoquées | HIGH | 1 jour (3 routes à corriger) | Persistance post-compromission |
| Absence de MFA/2FA | MEDIUM | 5-7 jours (Better Auth TOTP) | Credential stuffing |
| Pas de rotation de clés | MEDIUM | Variable | Compromission latente |
| Tests de sécurité inexistants | HIGH | Continu | Régression |
| Pas de WAF | LOW | 1 jour (Cloudflare rules) | DDoS, injection |
| Pas de monitoring de sécurité | MEDIUM | 3-5 jours | Détection tardive |

---

## 7. PLAN DE REMÉDIATION

### 🔴 Quick Wins (< 1 jour, aucun risque de régression)

| # | Action | Fichiers | Correction |
|---|---|---|---|
| Q1 | Fix session token leak | `admin/security/sessions/route.ts` | Ajouter `select` sans `token` |
| Q2 | Fix CSRF startsWith | `lib/csrf.ts:26-27` | `new URL(origin).origin === o` |
| Q3 | Fix webhooks bloqués par CSRF | `middleware.ts` | Ajouter `/api/webhooks`, `/api/telegram` dans `PUBLIC_PREFIXES` |
| Q4 | Fix Telegram webhook auth | `api/telegram/webhook/route.ts` | Valider `X-Telegram-Bot-Api-Secret-Token` |
| Q5 | Rotation + suppression mot de passe DB | `scripts/test-suite.sh` + Neon | Supprimer `PGPASSWORD` du script |
| Q6 | Fix `requirePermission` isActive | `lib/auth-utils.ts:48-70` | Ajouter `select: { isActive: true }` + vérifier |
| Q7 | Ajouter headers sécurité | `next.config.ts` | HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy |
| Q8 | Fix Redis exposure | `compose.yml:74-75` | `expose:` au lieu de `ports:` |

### 🟠 Court terme (< 1 semaine)

| # | Action | Fichiers |
|---|---|---|
| S1 | Révoquer sessions au changement de mot de passe | `change-password/route.ts`, `members/route.ts` |
| S2 | Uniformiser check-login (anti-énumération) | `check-login/route.ts` |
| S3 | Fix IP spoofing (header trust) | `auth.ts:66` |
| S4 | Docker non-root + capabilities drop | `Dockerfile`, `Dockerfile.worker`, `compose.yml` |
| S5 | Backup sans .env | `scripts/backup.sh` |
| S6 | Sentry PII scrubbing | `sentry.server.config.ts` |
| S7 | Rate-limit sur sign-in | `api/auth/sign-in/route.ts` |
| S8 | Production source maps disabled | `next.config.ts` |
| S9 | Chiffrer le backup DB | `scripts/backup.sh` |

### 🟡 Moyen terme (< 1 mois)

| # | Action |
|---|---|
| M1 | CSP (Content-Security-Policy) avec analyse des inline scripts Tailwind |
| M2 | Implémenter hard-delete GDPR (self-service) |
| M3 | Validation Zod systématique sur tous les PUT/PATCH |
| M4 | Nettoyage automatique des audit logs (rétention configurable) |
| M5 | Rotation des clés API (DB password, Resend, VAPID) si jamais exposées |
| M6 | Séparer les rôles DB (read-only app user vs admin migration user) |

### 🔵 Long terme (< 3 mois)

| # | Action |
|---|---|
| L1 | Monitoring sécurité (Sentry alerts, Cloudflare WAF, fail2ban) |
| L2 | Tests de sécurité automatisés (OWASP ZAP, npm audit en CI, secret scanning) |
| L3 | MFA/2FA (Better Auth TOTP plugin) |
| L4 | Audit de sécurité trimestriel |
| L5 | Chiffrement au repos pour PII (pgcrypto ou application-level) |
| L6 | Container image scanning (Trivy, Docker Scout) |

---

## 8. CHECKLIST DE VALIDATION AVANT PRODUCTION

| # | Item | Statut |
|---|---|---|
| 1 | Session tokens non exposés aux admins | ❌ Non conforme |
| 2 | CSRF protège tous les POST/PUT/DELETE | ⚠️ Fix H2 + H3 requis |
| 3 | Webhooks fonctionnels (Resend, Telegram) | ❌ Bloqués par CSRF |
| 4 | Webhook Telegram authentifié | ❌ Non conforme |
| 5 | Aucun secret dans le code source | ❌ test-suite.sh |
| 6 | Rate-limiting sur toutes les routes sensibles | ⚠️ Sign-in manquant |
| 7 | Headers de sécurité (CSP, HSTS, XFO, XCTO) | ❌ Aucun |
| 8 | Docker non-root | ❌ root |
| 9 | Redis non exposé publiquement | ❌ 0.0.0.0:6379 |
| 10 | Sessions révoquées au changement de mot de passe | ❌ Non |
| 11 | Anti-énumération d'emails | ❌ Oracle actif |
| 12 | Sentry PII scrubbing | ❌ Non |
| 13 | Backup chiffré sans secrets | ❌ Non |
| 14 | Permissions vérifient isActive | ❌ requirePermission |
| 15 | Hard-delete GDPR disponible | ❌ Non |
| 16 | .env dans .gitignore | ✅ Conforme |
| 17 | Cookies httpOnly + secure + sameSite | ✅ Conforme |
| 18 | Pas de raw SQL non protégé | ✅ Conforme |
| 19 | RBAC serveur sur toutes les routes admin | ✅ Conforme |
| 20 | BullBoard protégé par auth | ✅ Conforme |

**Conformité : 4/20 ✅ · 2/20 ⚠️ · 14/20 ❌**

---

## 9. SCÉNARIOS D'ATTAQUE (Pentest théorique)

### Scénario 1 : Prise de contrôle admin → tous les utilisateurs
1. Compromission d'un compte admin (phishing, credential stuffing via H2 oracle + H10 pas de rate-limit)
2. GET `/api/admin/security/sessions` → obtention de 50 tokens de session (C1)
3. Usurpation d'identité de n'importe quel utilisateur avec son token
4. Accès à toutes les données, signaux, messages

### Scénario 2 : CSRF → publication de signal frauduleux
1. L'attaquant enregistre `nba-signauxx.com` et configure `access.signauxx.com.nba-signauxx.com`
2. Il héberge une page malveillante qui POST vers `/api/admin/signals` avec un faux signal
3. Le `origin.startsWith("https://access.signauxx.com")` accepte l'origine (C2)
4. Un admin visite la page → signal frauduleux publié sans son consentement
5. Distribution à tous les membres → manipulation de marché

### Scénario 3 : Webhook Telegram → spam de tous les utilisateurs liés
1. L'attaquant découvre l'URL du webhook Telegram (endpoint public)
2. POST un payload forgé avec `message.text = "/start"` et `message.chat.id = <victim_id>` (C4)
3. La route scanne `prisma.user.findMany()` → relie le chat_id à un utilisateur
4. L'attaquant peut maintenant envoyer des messages arbitraires via le bot
5. Ou pire : POST massif → déni de service / spam de tous les utilisateurs Telegram

### Scénario 4 : Suspension bypass → admin conserve ses droits
1. Un admin est suspendu (`isActive = false`)
2. Sa session est encore valide (7 jours, H4 pas de révocation)
3. Il peut continuer à utiliser les routes protégées par `requirePermission` (H1)
4. Il crée, modifie, publie des signaux, gère les utilisateurs — pendant 7 jours

### Scénario 5 : Password reset → l'attaquant garde l'accès
1. L'attaquant vole un cookie de session (MITM, XSS, accès physique)
2. La victime change son mot de passe
3. Les sessions existantes ne sont pas révoquées (H4)
4. L'attaquant conserve l'accès indéfiniment (jusqu'à expiration naturelle à 7 jours)

---

## 10. VERDICT FINAL

### ❌ Déploiement interdit tant que les vulnérabilités critiques ne sont pas corrigées

**Justification :**
- 5 vulnérabilités CRITICAL dont 1 exposant tous les tokens de session et 1 bypass CSRF complet
- 10 vulnérabilités HIGH dont l'absence totale de headers de sécurité et un oracle d'énumération d'emails
- 14/20 items de la checklist de production non conformes
- Score global de sécurité : **56/100**

**Conditions minimales pour un GO production :**
1. Quick Wins Q1-Q8 corrigés (session tokens, CSRF, webhooks, headers)
2. Court terme S1-S4 corrigés (révocation sessions, anti-énumération, Docker non-root, backup)
3. Rotation de TOUS les secrets exposés (DB password, Resend API key, VAPID keys)

**Après correction des Quick Wins + Court terme :** GO avec réserves (Moyen terme requis sous 30 jours pour GDPR + CSP).

---

*Rapport généré par l'équipe de sécurité NBA — 2026-07-19.*
*Références : OWASP ASVS 4.0.3 · OWASP Top 10 2021 · OWASP API Top 10 2023 · CWE Top 25 2024*
