# Cahier des Charges Securite — MASTER_SECURITY_REQUIREMENTS.md

> **Document de Reference** — Version 1.0.0  
> **Classification** : Interne — Confidentiel  
> **Derniere mise a jour** : 2026-07-22  
> **Stack** : Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis (ioredis), Socket.IO, BullMQ  
> **Documents relies** : `MASTER_ZERO_TRUST_SECURITY.md`, `MASTER_ACCOUNT_SHARING_PREVENTION_AUDIT.md`, `MASTER_FRAUD_ENGINE.md`, `MASTER_AUTH_ARCHITECTURE.md`

---

## Table des Matieres

1. [Introduction & Perimetre](#1-introduction--perimetre)
2. [Regles Fondamentales & Contraintes](#2-regles-fondamentales--contraintes)
3. [OWASP Top 10 — Exigences Detaillees](#3-owasp-top-10--exigences-detaillees)
4. [NIST SP 800-63 — Exigences d'Identite Numerique](#4-nist-sp-800-63--exigences-didentite-numerique)
5. [Better Auth — Exigences Specifiques](#5-better-auth--exigences-specifiques)
6. [Next.js — Exigences de Securite](#6-nextjs--exigences-de-securite)
7. [Securite des Sessions](#7-securite-des-sessions)
8. [Securite des API](#8-securite-des-api)
9. [Securite des WebSocket](#9-securite-des-websocket)
10. [Securite des Donnees](#10-securite-des-donnees)
11. [Securite de l'Infrastructure](#11-securite-de-linfrastructure)
12. [Securite des Tiers & Dependances](#12-securite-des-tiers--dependances)
13. [Regles de Developpement Securise](#13-regles-de-developpement-securise)
14. [Exigences de Chiffrement & Gestion des Secrets](#14-exigences-de-chiffrement--gestion-des-secrets)
15. [Exigences de Conformite (RGPD / ISO 27001 / SOC 2)](#15-exigences-de-conformite-rgpd--iso-27001--soc-2)
16. [Exigences de Journalisation & Audit](#16-exigences-de-journalisation--audit)
17. [Exigences de Tests & Verification](#17-exigences-de-tests--verification)
18. [Exigences de Reponse aux Incidents](#18-exigences-de-reponse-aux-incidents)
19. [Matrice de Maturite & Objectifs](#19-matrice-de-maturite--objectifs)
20. [Glossaire & References](#20-glossaire--references)

---

## 1. Introduction & Perimetre

### 1.1 Portee

Ce document definit l'ensemble des exigences de securite obligatoires pour la plateforme NBA (Next.js Basketball Analytics). Il constitue le cahier des charges securite de reference pour tous les developpements, migrations, et operations.

**Perimetre couvert :**
- Application web (Next.js 16, React 19)
- API REST (Next.js API routes)
- WebSocket temps reel (Socket.IO)
- Base de donnees (PostgreSQL via Prisma)
- Cache & files d'attente (Redis, BullMQ)
- Stockage fichiers (S3 / MinIO)
- Authentification (Better Auth)
- Workers & jobs asynchrones
- Infrastructure Docker / PM2
- Pipeline CI/CD

**Perimetre exclu :** Securite physique des datacenters, securite des postes utilisateurs finaux.

### 1.2 Principes Directeurs

| Principe | Description | Imposition |
|----------|-------------|:----------:|
| **Zero Trust** | Aucune requete, utilisateur, ou composant n'est trusted par defaut | OBLIGATOIRE |
| **Defense in Depth** | Multiples couches de securite independantes | OBLIGATOIRE |
| **Least Privilege** | Chaque entite a le minimum de permissions necessaires | OBLIGATOIRE |
| **Secure by Default** | La securite est la configuration par defaut | OBLIGATOIRE |
| **Privacy by Design** | La protection des donnees est integree dans la conception | OBLIGATOIRE |
| **Fail Secure** | En cas d'erreur, le systeme refuse l'acces par defaut | OBLIGATOIRE |
| **Auditabilite** | Chaque action critique est journalisee et horodatee | OBLIGATOIRE |
| **Separation des pouvoirs** | Personne ne peut agir seul sur une action critique | RECOMMANDE |

### 1.3 Niveaux d'Exigence

| Label | Signification |
|-------|---------------|
| **OBLIGATOIRE** | Violation = non-conformite bloquante. Doit etre implemente avant mise en production |
| **IMPERATIF** | Violation = risque majeur. Tolerance zero | 
| **HAUTE** | Violation = risque significatif. Doit etre justifie et compense |
| **MOYENNE** | Bonne pratique. Objectif de securite a atteindre |
| **RECOMMANDE** | Amelioration continue. A implementer si ressources disponibles |

### 1.4 Classification des Donnees

| Classe | Definition | Exemples |
|--------|------------|----------|
| **PUBLIC** | Donnees librement accessibles | Noms d'ecrans, avatars |
| **INTERNE** | Donnees internes non sensibles | Logs applicatifs, metriques |
| **CONFIDENTIEL** | Donnees utilisateur protegees | Emails, signaux trading, historique navigation |
| **SENSIBLE** | Donnees hautement protegees | Mots de passe, tokens, 2FA secrets, IP, empreintes |
| **CRITIQUE** | Donnees a valeur legale | Logs d'audit, consentements, transactions |

---

## 2. Regles Fondamentales & Contraintes

### 2.1 Regles Absolues (Tolerance Zero)

```
RE-001 [OBLIGATOIRE] Aucun mot de passe, secret, token, ou clef ne doit etre stocke
         en clair dans le code source, les variables d'environnement commitees,
         ou les artefacts de build.

RE-002 [OBLIGATOIRE] Aucune donnee sensible ne doit transiter en clair sur le reseau.
         TLS 1.3 minimum obligatoire pour toutes les communications externes.

RE-003 [OBLIGATOIRE] Aucun secret ne doit apparaitre dans les logs, erreurs,
         traces de debogage, ou reponses API.

RE-004 [OBLIGATOIRE] L'authentification multi-facteurs (MFA) DOIT etre disponible
         pour tous les utilisateurs et OBLIGATOIRE pour les roles admin.

RE-005 [OBLIGATOIRE] Toutes les entrees utilisateur DOIVENT etre validees et assainies.

RE-006 [OBLIGATOIRE] Toutes les requetes API sensibles DOIVENT etre rate-limitees.

RE-007 [OBLIGATOIRE] Les mots de passe DOIVENT etre haches avec bcrypt (rounds >= 12).

RE-008 [OBLIGATOIRE] Les sessions DOIVENT expirer et etre revocables.

RE-009 [OBLIGATOIRE] Les cookies de session DOIVENT etre HttpOnly, Secure, SameSite=Lax.

RE-010 [OBLIGATOIRE] Aucune donnee SENSIBLE ou CRITIQUE ne doit etre exposee
         au client (navigateur) sans necessite fonctionnelle.
```

### 2.2 Contraintes Techniques

| ID | Contrainte | Source | Impact |
|----|------------|--------|--------|
| CT-001 | Next.js 16 — Server Components par defaut | Architecture | Toute donnee sensible doit rester cote serveur |
| CT-002 | Better Auth 1.6.20 — Plugin system | Auth | Exigences de securite portees par les plugins |
| CT-003 | Prisma 7 — PostgreSQL (Neon) | DB | Migrations gerees, pas de raw SQL non valide |
| CT-004 | Redis — ioredis | Cache/Queue | Donnees en memoire transitoires, TTL obligatoire |
| CT-005 | BullMQ — Jobs asynchrones | Queue | Donnees sensibles dans les jobs -> chiffrement |
| CT-006 | Socket.IO 4.8 — Redis adapter | WS | Auth HMAC obligatoire pour toute connexion |
| CT-007 | Docker — Multi-stage builds | Deploiement | Pas de secrets dans les couches intermediaires |
| CT-008 | PM2 — Process management | Prod | Logs rotates, pas de secrets dans les logs |

### 2.3 Regles de Developpement

#### 2.3.1 Regles Obligatoires

```
RD-001 [OBLIGATOIRE] Toute PR DOIT inclure les tests de securite correspondants
         aux modifications.

RD-002 [OBLIGATOIRE] Toute route API DOIT avoir un rate limiting configure.

RD-003 [OBLIGATOIRE] Toute nouvelle dependance DOIT etre auditee (npm audit, Snyk).

RD-004 [OBLIGATOIRE] Les secrets DOIVENT etre injectes via variables d'environnement,
         jamais hardcodes.

RD-005 [OBLIGATOIRE] Les migrations Prisma DOIVENT etre revues par un pair
         avant execution.

RD-006 [OBLIGATOIRE] Les requetes SQL DOIVENT utiliser l'ORM (Prisma) —
         pas de raw SQL sauf exception documentee et approuvee.

RD-007 [OBLIGATOIRE] Toute manipulation de donnees sensibles DOIT etre loggee
         dans la chaine d'audit.

RD-008 [OBLIGATOIRE] Les sessions DOIVENT etre liees a un fingerprint appareil
         et une IP (au moins un des deux).
```

#### 2.3.2 Regles de Code

```
RC-001 [OBLIGATOIRE] TypeScript strict mode active (strict: true dans tsconfig.json).

RC-002 [OBLIGATOIRE] ESLint avec regles de securite (eslint-config-next).

RC-003 [OBLIGATOIRE] Zod pour la validation de toutes les entrees API.

RC-004 [OBLIGATOIRE] Pas de any — les types DOIVENT etre explicites.

RC-005 [OBLIGATOIRE] Pas de console.log en production (Pino logger obligatoire).

RC-006 [OBLIGATOIRE] Les erreurs DOIVENT etre capturees et loggees,
         mais jamais exposees au client avec leurs details.

RC-007 [OBLIGATOIRE] Les fetch vers des services externes DOIVENT avoir
         un timeout (AbortSignal.timeout).

RC-008 [OBLIGATOIRE] Pas de eval(), new Function(), ou equivalents.

RC-009 [HAUTE] Les boucles externes (webhooks, callbacks) DOIVENT avoir
         un circuit breaker.

RC-010 [OBLIGATOIRE] Les mutations Prisma DOIVENT etre transactionnelles
         ($transaction) quand plusieurs operations sont liees.
```

#### 2.3.3 Regles CI/CD

```
RCI-001 [OBLIGATOIRE] Toute PR DOIT passer lint + typecheck + tests.

RCI-002 [OBLIGATOIRE] npm audit execute sur chaque build — echec si
         vulnerabilite CRITICAL non resolue.

RCI-003 [OBLIGATOIRE] Les secrets CI DOIVENT etre injectes via
         variables de CI (GitHub Secrets), jamais dans les fichiers.

RCI-004 [OBLIGATOIRE] Les artifacts de build NE DOIVENT PAS contenir
         de fichiers .env, .map (sauf Sentry), ou secrets.

RCI-005 [HAUTE] Scan de vulnerabilites (Trivy / Snyk) sur les images Docker.

RCI-006 [MOYENNE] Analyse SAST (SonarQube / Semgrep) sur chaque commit.
```

---

## 3. OWASP Top 10 — Exigences Detaillees

### 3.1 A01: Broken Access Control

**Exigences :**

```
OWASP-001 [OBLIGATOIRE] Chaque endpoint DOIT verifier les droits d'acces
         AVANT d'executer la logique metier.

OWASP-002 [OBLIGATOIRE] Le middleware Next.js DOIT proteger les routes
         admin et onboarding par verification de session.

OWASP-003 [OBLIGATOIRE] Les roles DOIVENT etre hierarchiques et verifies
         a chaque requete (RBAC via Better Auth admin plugin).

OWASP-004 [OBLIGATOIRE] Pas d'IDOR (Insecure Direct Object Reference) :
         chaque acces a une ressource DOIT verifier l'appartenance.

OWASP-005 [OBLIGATOIRE] Les fonctions admin DOIVENT etre protegees par
         requireRole(["SUPER_ADMIN", "ADMIN"]).

OWASP-006 [HAUTE] Principe de moindre privilege applique aux API :
         un utilisateur ne peut acceder qu'aux ressources qui lui
         appartiennent ou qui lui sont explicitement partagees.

OWASP-007 [OBLIGATOIRE] Les WebSocket DOIVENT verifier les droits
         de l'utilisateur pour chaque room rejointe.

OWASP-008 [OBLIGATOIRE] La suppression de compte DOIT invalider
         tous les tokens et sessions actifs.
```

### 3.2 A02: Cryptographic Failures

**Exigences :**

```
OWASP-009 [OBLIGATOIRE] TLS 1.3 obligatoire en production.
         TLS 1.2 accepte en fallback (desactiver TLS 1.0/1.1).

OWASP-010 [OBLIGATOIRE] Mots de passe haches avec bcrypt (rounds >= 12).

OWASP-011 [OBLIGATOIRE] Tokens JWT signes avec HMAC-SHA256 (minimum).

OWASP-012 [OBLIGATOIRE] Cookies session avec Secure flag + SameSite=Lax.

OWASP-013 [OBLIGATOIRE] Chiffrement au repos pour les tokens OAuth
         (accessToken/refreshToken) en base de donnees.

OWASP-014 [OBLIGATOIRE] Chiffrement en transit pour toutes les communications
         Redis, PostgreSQL, Socket.IO en production.

OWASP-015 [HAUTE] Utiliser une clef de chiffrement differente pour
         chaque environnement (dev / staging / production).

OWASP-016 [OBLIGATOIRE] Les secrets de chiffrement DOIVENT avoir
         au moins 32 caracteres (256 bits).

OWASP-017 [OBLIGATOIRE] Utiliser timingSafeEqual pour les comparaisons
         de signatures cryptographiques.
```

### 3.3 A03: Injection

**Exigences :**

```
OWASP-018 [OBLIGATOIRE] Toutes les entrees utilisateur DOIVENT etre validees
         avec Zod avant traitement.

OWASP-019 [OBLIGATOIRE] Prisma ORM obligatoire — pas de raw SQL
         sauf exception documentee avec validation stricte.

OWASP-020 [OBLIGATOIRE] Les entrees utilisateur NE DOIVENT JAMAIS etre
         concatenees dans des commandes shell, requetes SQL, ou URLs.

OWASP-021 [OBLIGATOIRE] CSP header avec default-src 'self' pour
         prevenir les injections XSS.

OWASP-022 [OBLIGATOIRE] Pas de dangerouslySetInnerHTML en React
         sauf exception documentee avec assainissement DOMPurify.

OWASP-023 [OBLIGATOIRE] Les parametres d'URL DOIVENT etre valides
         avant d'etre utilises dans des requetes ou redirections.

OWASP-024 [OBLIGATOIRE] Les headers de requete (User-Agent, Referer, etc.)
         NE DOIVENT PAS etre stockes sans validation prealable.
```

### 3.4 A04: Insecure Design

**Exigences :**

```
OWASP-025 [OBLIGATOIRE] Toute nouvelle fonctionnalite DOIT avoir une
         analyse de securite (threat modeling) avant developpement.

OWASP-026 [OBLIGATOIRE] Les limites de sessions par plan DOIVENT etre
         enforcees cote serveur (pas uniquement cote client).

OWASP-027 [OBLIGATOIRE] Les rate limits DOIVENT etre multi-couche :
         Cloudflare (WAF) -> Better Auth -> App (Redis) -> Business.

OWASP-028 [OBLIGATOIRE] Les tentatives de connexion echouees DOIVENT
         etre limitees et loggees.

OWASP-029 [OBLIGATOIRE] Les mots de passe DOIVENT avoir une politique
         de complexite enforcee cote serveur.

OWASP-030 [HAUTE] Les fonctionnalites de debogage / admin DOIVENT etre
         desactivees en production.

OWASP-031 [OBLIGATOIRE] Les webhooks DOIVENT verifier la signature
         de l'emetteur avant traitement.
```

### 3.5 A05: Security Misconfiguration

**Exigences :**

```
OWASP-032 [OBLIGATOIRE] Headers de securite obligatoires sur toutes les reponses :
         - Content-Security-Policy
         - Strict-Transport-Security (max-age=31536000; includeSubDomains; preload)
         - X-Frame-Options (DENY)
         - X-Content-Type-Options (nosniff)
         - Referrer-Policy (strict-origin-when-cross-origin)
         - Permissions-Policy (camera=(), microphone=(), geolocation=())

OWASP-033 [OBLIGATOIRE] Les erreurs NE DOIVENT PAS exposer de details
         techniques en production (stack traces, chemins, versions).

OWASP-034 [OBLIGATOIRE] Les CORS DOIVENT etre configures avec une
         liste blanche d'origins, pas de wildcard.

OWASP-035 [OBLIGATOIRE] Les comptes par defaut DOIVENT etre supprimes
         ou desactives.

OWASP-036 [OBLIGATOIRE] Les services inutiles DOIVENT etre desactives
         (WebSocket si WS_ENABLED=false, etc.).

OWASP-037 [OBLIGATOIRE] Les en-tetes de requete sensibles DOIVENT etre
         nettoyes des logs (Authorization, Cookie, Set-Cookie).

OWASP-038 [HAUTE] HSTS preload list — soumettre le domaine apres validation.
```

### 3.6 A06: Vulnerable and Outdated Components

**Exigences :**

```
OWASP-039 [OBLIGATOIRE] npm audit execute sur chaque build.
         Pas de deploiement avec des vulnerabilites CRITICAL non resolues.

OWASP-040 [OBLIGATOIRE] Les dependances DOIVENT etre mises a jour
         selon le cycle de securite :
         - CRITICAL : 48h
         - HIGH : 7 jours  
         - MEDIUM : 30 jours
         - LOW : 90 jours

OWASP-041 [OBLIGATOIRE] Version pinning pour les dependances critiques
         (better-auth, next, prisma, ioredis).

OWASP-042 [HAUTE] Scan des images Docker avec Trivy / Snyk.

OWASP-043 [HAUTE] Renovate / Dependabot automatise pour les mises a jour.

OWASP-044 [MOYENNE] SBOM (Software Bill of Materials) genere a chaque release.
```

### 3.7 A07: Identification and Authentication Failures

**Exigences :**

```
OWASP-045 [OBLIGATOIRE] MFA disponible pour tous les utilisateurs,
         obligatoire pour les roles ADMIN et SUPER_ADMIN.

OWASP-046 [OBLIGATOIRE] Rate limiting strict sur les endpoints
         d'authentification (/sign-in, /sign-up, /forgot-password).

OWASP-047 [OBLIGATOIRE] Politique de mot de passe enforcee :
         - Minimum 10 caracteres
         - Majuscule, minuscule, chiffre, caractere special
         - Pas de repetitions 3+ fois
         - Pas de mots de passe communs (liste noire)
         - Verification breach (Have I Been Pwned API)

OWASP-048 [OBLIGATOIRE] Les tokens de session DOIVENT etre invalides
         lors du changement de mot de passe.

OWASP-049 [OBLIGATOIRE] Les tentatives de connexion echouees DOIVENT
         etre limitees (cf. §9.1).

OWASP-050 [OBLIGATOIRE] Les sessions inactives DOIVENT expirer
         (idle timeout par plan).

OWASP-051 [OBLIGATOIRE] Les comptes suspendus / supprimes DOIVENT
         voir leurs sessions immediatement revoquees.

OWASP-052 [OBLIGATOIRE] Les tokens de reset de mot de passe DOIVENT
         expirer apres 1h et etre a usage unique.
```

### 3.8 A08: Software and Data Integrity Failures

**Exigences :**

```
OWASP-053 [OBLIGATOIRE] Toutes les mises a jour de dependances DOIVENT
         etre verifiees (checksum / signature) quand disponible.

OWASP-054 [OBLIGATOIRE] Les webhooks entrants DOIVENT etre valides
         par signature HMAC (ex: Resend webhook secret).

OWASP-055 [OBLIGATOIRE] Les artifacts de build DOIVENT etre signes
         pour les releases.

OWASP-056 [HAUTE] Verification d'integrite des pipelines CI/CD
         (pas de modification non autorisee des scripts).

OWASP-057 [OBLIGATOIRE] La chaine d'audit DOIT etre infalsifiable
         (hash chain — chaque entree contient le hash de la precedente).

OWASP-058 [MOYENNE] Signature des commits Git (GPG) pour les
         committers autorises.
```

### 3.9 A09: Security Logging and Monitoring Failures

**Exigences :**

```
OWASP-059 [OBLIGATOIRE] Tous les evenements de securite critiques DOIVENT
         etre logges avec un niveau de severite.

OWASP-060 [OBLIGATOIRE] Les logs de securite DOIVENT inclure :
         - Timestamp (ISO 8601)
         - User ID (si applicable)
         - IP source
         - Type d'evenement
         - Action
         - Resultat (succes/echec)

OWASP-061 [OBLIGATOIRE] Les logs NE DOIVENT PAS contenir de donnees
         sensibles (mots de passe, tokens, cookies).

OWASP-062 [OBLIGATOIRE] Les tentatives echouees DOIVENT etre
         alerter en temps reel (PagerDuty / Slack pour CRITICAL).

OWASP-063 [OBLIGATOIRE] Retention des logs de securite :
         - Evenements CRITICAL : 1 an minimum
         - Evenements HIGH : 6 mois
         - Evenements MEDIUM : 3 mois
         - Logs applicatifs : 30 jours

OWASP-064 [OBLIGATOIRE] Les logs DOIVENT etre centralises (Loki / ELK)
         et indexes pour recherche rapide.

OWASP-065 [HAUTE] Alerting configure sur les evenements anormaux :
         - > 5% de taux d'echec login
         - > 1 tentative de hijacking / heure
         - Pic de rate limit
```

### 3.10 A10: Server-Side Request Forgery (SSRF)

**Exigences :**

```
OWASP-066 [OBLIGATOIRE] Les URLs fournies par l'utilisateur NE DOIVENT
         PAS etre fetch directement sans validation.

OWASP-067 [OBLIGATOIRE] Les fetch sortants DOIVENT etre limites
         a une liste blanche de domaines autorises.

OWASP-068 [OBLIGATOIRE] Les redirects automatiques lors de fetch
         DOIVENT etre desactives (redirect: 'manual').

OWASP-069 [OBLIGATOIRE] Les adresses IP privees (10.x.x.x, 172.16-31.x.x,
         192.168.x.x, 127.x.x.x) DOIVENT etre bloquees dans les
         fetch sortants.

OWASP-070 [HAUTE] Un proxy HTTP sortant DOIT etre utilise pour
         isoler les requetes sortantes du reseau interne.

OWASP-071 [OBLIGATOIRE] Les webhooks Telegram DOIVENT valider
         le secret token (X-Telegram-Bot-Api-Secret-Token).
```

---

## 4. NIST SP 800-63 — Exigences d'Identite Numerique

### 4.1 Niveau d'Assurance (IAL/AAL)

La plateforme NBA cible les niveaux suivants :

| Niveau | Cible | Description |
|--------|:-----:|-------------|
| IAL | 2 | Verification d'identite avec preuves documentaires (KYC) |
| AAL | 2+ | MFA obligatoire pour admin, fortement recommande pour tous |
| FAL | 2 | Federation avec signature et chiffrement |

### 4.2 Exigences NIST Detaillees

```
NIST-001 [OBLIGATOIRE] Les mots de passe DOIVENT etre compares aux
         bases de mots de passe compromis (HIBP API).

NIST-002 [OBLIGATOIRE] Aucune exigence de changement periodique
         de mot de passe (NIST deconseille le rotage force).

NIST-003 [OBLIGATOIRE] Verifier l'identite par email OU telephone
         avant d'autoriser les actions sensibles (changement email,
         reset 2FA, etc.).

NIST-004 [OBLIGATOIRE] Les tentatives de verification echouees
         DOIVENT etre limitees (rate limiting + captcha).

NIST-005 [OBLIGATOIRE] Memorized Secret Verifiers :
         - Minimum 10 caracteres
         - Maximum 128 caracteres
         - Accepter tous les caracteres ASCII et Unicode
         - Hache avec bcrypt (rounds >= 12)
         - Sale individuellement

NIST-006 [OBLIGATOIRE] Afficher une notification a l'utilisateur
         apres chaque connexion reussie (appareil, heure, IP).

NIST-007 [HAUTE] Les sessions DOIVENT expirer apres inactivite
         (30 minutes pour free, jusqu'a 4h pour VIP).

NIST-008 [OBLIGATOIRE] Les sessions DOIVENT etre revocables
         individuellement ou en masse par l'utilisateur et l'admin.

NIST-009 [OBLIGATOIRE] Les cookies de session DOIVENT etre lies
         a un appareil (device fingerprint).

NIST-010 [OBLIGATOIRE] OAuth 2.0 avec PKCE (Authorization Code Flow)
         pour les providers externes — pas de Implicit Flow.
```

### 4.3 Verification Multi-Facteurs (AAL2+)

```
NIST-011 [OBLIGATOIRE] Au moins deux facteurs distincts :
         - Quelque chose que vous savez (mot de passe)
         - Quelque chose que vous avez (TOTP, email OTP)
         - Quelque chose que vous etes (biometrie — futur)

NIST-012 [OBLIGATOIRE] TOTP avec les parametres suivants :
         - Algorithme : SHA1
         - Digits : 6
         - Period : 30 secondes
         - Window : 1 (tolerance 30s avant/apres)

NIST-013 [OBLIGATOIRE] Codes de recuperation (backup codes) :
         - Minimum 8 codes
         - Stockes hashes (SHA-256)
         - Usage unique
         - Regenerables par l'utilisateur

NIST-014 [OBLIGATOIRE] Limiter les tentatives de verification 2FA :
         - 5 tentatives par fenetre de 5 minutes
         - Blocage temporaire apres echecs
```

---

## 5. Better Auth — Exigences Specifiques

### 5.1 Configuration Obligatoire

```
BA-001 [OBLIGATOIRE] Plugin twoFactor active avec TOTP + Email OTP.

BA-002 [OBLIGATOIRE] Plugin admin active avec roles hierarchiques.

BA-003 [OBLIGATOIRE] nextCookies() plugin pour Next.js integration.

BA-004 [OBLIGATOIRE] Rate limiting configure pour tous les endpoints
         d'authentification (cf. config dans auth.ts).

BA-005 [OBLIGATOIRE] Cookie prefixe __Secure- en production.

BA-006 [OBLIGATOIRE] trustedOrigins strictement defini.

BA-007 [OBLIGATOIRE] BETTER_AUTH_SECRET >= 32 caracteres.

BA-008 [OBLIGATOIRE] Session expiresIn = 7 jours max.

BA-009 [OBLIGATOIRE] Session updateAge = 24h (rotation cookie).

BA-010 [OBLIGATOIRE] Password policy enforced :
         - minLength = 10
         - requireUppercase = true
         - requireLowercase = true
         - requireNumbers = true
         - requireSpecialChars = true
```

### 5.2 Hooks Obligatoires

```
BA-011 [OBLIGATOIRE] databaseHooks.user.create.before :
         - Verifier email banni
         - Purger soft-deleted user si existant

BA-012 [OBLIGATOIRE] databaseHooks.user.create.after :
         - Envoyer email de bienvenue
         - Logger la creation

BA-013 [OBLIGATOIRE] databaseHooks.session.create.before :
         - Verifier limite de sessions concurrentes
         - Evict session la plus ancienne si limite depassee

BA-014 [OBLIGATOIRE] databaseHooks.session.create.after :
         - Cache session dans Redis (TTL: 7 jours)
```

### 5.3 Sessions & Tokens

```
BA-015 [OBLIGATOIRE] Les sessions DOIVENT inclure :
         - deviceFingerprint
         - ipAddress
         - userAgent
         - isBoundToDevice (true par defaut)
         - lastVerifiedAt
         - suspiciousFlags

BA-016 [OBLIGATOIRE] Rotation de session :
         - Ancienne session blacklistee dans Redis
         - Nouveau token genere a chaque rotation
         - Blacklist TTL = 24h

BA-017 [OBLIGATOIRE] Revocation de session :
         - Suppression en base
         - Blacklist dans Redis (TTL: 7 jours)
         - Log d'audit avec raison

BA-018 [OBLIGATOIRE] Les sessions concurrentes sont limitees par plan :
         - FREE: 1, STANDARD: 3, PRO: 5, VIP: 5, ADMIN: 5, SUPER_ADMIN: 10
```

### 5.4 OAuth

```
BA-019 [OBLIGATOIRE] OAuth avec PKCE (Authorization Code + PKCE).

BA-020 [OBLIGATOIRE] Account linking avec verification :
         - Pas de linking si le compte OAuth est deja lie a un autre user
         - Pas de linking si l'email differe (allowDifferentEmails: false)

BA-021 [OBLIGATOIRE] Tokens OAuth chiffres au repos en base.

BA-022 [HAUTE] Refresh tokens OAuth automatiques (refreshOAuthToken).
```

---

## 6. Next.js — Exigences de Securite

### 6.1 Configuration Serveur

```
NX-001 [OBLIGATOIRE] output: "standalone" pour isolation des fichiers.

NX-002 [OBLIGATOIRE] productionBrowserSourceMaps: false.

NX-003 [OBLIGATOIRE] Server Components par defaut — minimiser les
         Client Components.

NX-004 [OBLIGATOIRE] Pas de donnees sensibles dans les props entrees
         dans les Client Components.

NX-005 [OBLIGATOIRE] Les Server Actions DOIVENT valider l'authentification
         et les permissions avant execution.

NX-006 [OBLIGATOIRE] Les Server Actions DOIVENT utiliser "use server"
         et etre protegees contre les soumissions non autorisees.

NX-007 [OBLIGATOIRE] Les API routes DOIVENT avoir un rate limiting explicite.
```

### 6.2 Middleware

```
NX-008 [OBLIGATOIRE] Le middleware DOIT :
         - Ajouter les headers de securite a toutes les reponses
         - Verifier la session pour les routes protegees
         - Rediriger les utilisateurs non authentifies
         - Verifier le mode maintenance

NX-009 [OBLIGATOIRE] Routes publiques listees explicitement
         (PUBLIC_PREFIXES, PUBLIC_PATHS).

NX-010 [OBLIGATOIRE] CSRF check pour toutes les mutations API.

NX-011 [OBLIGATOIRE] Cache-Control: no-store pour les pages protegees.
```

### 6.3 Headers de Securite

```
NX-012 [OBLIGATOIRE] Content-Security-Policy :
         - default-src 'self'
         - script-src 'self' 'unsafe-inline' (Next.js requirement)
         - style-src 'self' 'unsafe-inline'
         - img-src 'self' data: https:
         - font-src 'self'
         - connect-src 'self' [domaines autorises]
         - frame-src 'none'
         - object-src 'none'
         - base-uri 'self'
         - form-action 'self'

NX-013 [OBLIGATOIRE] Strict-Transport-Security: max-age=31536000;
         includeSubDomains; preload

NX-014 [OBLIGATOIRE] X-Frame-Options: DENY

NX-015 [OBLIGATOIRE] X-Content-Type-Options: nosniff

NX-016 [OBLIGATOIRE] Referrer-Policy: strict-origin-when-cross-origin

NX-017 [OBLIGATOIRE] Permissions-Policy: camera=(), microphone=(),
         geolocation=()
```

### 6.4 Images & Fichiers

```
NX-018 [OBLIGATOIRE] Les images uploadees DOIVENT etre validees :
         - Type MIME verifie
         - Taille limitee
         - Scan antivirus (si disponible)

NX-019 [OBLIGATOIRE] Les fichiers DOIVENT etre stockes hors du
         repertoire public (S3 / MinIO).

NX-020 [OBLIGATOIRE] Les URLs de fichiers DOIVENT etre signees
         (pre-signed URLs) avec expiration.

NX-021 [OBLIGATOIRE] imgproxy ou equivalent pour le redimensionnement
         et la transformation cote serveur.
```

---

## 7. Securite des Sessions

### 7.1 Cycle de Vie

```
SS-001 [OBLIGATOIRE] Les sessions suivent une machine a etats :
         CREATED -> ACTIVE -> EXTENDED -> EXPIRING -> EXPIRED

SS-002 [OBLIGATOIRE] Transitions possibles :
         - CREATED  -> ACTIVE   : verification reussie
         - ACTIVE   -> EXTENDED : refresh token
         - ACTIVE   -> REVOKED  : deconnexion / admin / securite
         - ACTIVE   -> LOCKED   : anomalie detectee
         - EXPIRING -> EXTENDED : refresh avant expiration
         - EXPIRED  -> ARCHIVED : cleanup auto
         - LOCKED   -> REVOKED  : echec verification

SS-003 [OBLIGATOIRE] TTL maximum : 7 jours (configurable par plan).

SS-004 [OBLIGATOIRE] Idle timeout : 30 min (FREE) a 4h (VIP).

SS-005 [OBLIGATOIRE] Rotation forcee toutes les 24h (updateAge).
```

### 7.2 Binding & Verification

```
SS-006 [OBLIGATOIRE] Toute session DOIT etre liee a :
         - Un device fingerprint (cote serveur)
         - Une IP source (enregistree a la creation)
         - Un User-Agent (enregistre a la creation)

SS-007 [OBLIGATOIRE] A chaque requete sensible, verifier :
         - Fingerprint identique
         - IP non suspecte (anomaly check)
         - User-Agent identique

SS-008 [OBLIGATOIRE] En cas de mismatch sur un element :
         - MEDIUM : audit + notification utilisateur
         - HIGH : challenge 2FA
         - CRITICAL : revocation session + alerte admin
```

### 7.3 Blacklist & Revocation

```
SS-009 [OBLIGATOIRE] Blacklist Redis pour les sessions revoquees :
         - TTL : 7 jours (duree de vie max d'une session)
         - Stocke : raison, declencheur, date

SS-010 [OBLIGATOIRE] Causes de revocation obligatoires :
         - USER_LOGOUT : deconnexion volontaire
         - ADMIN_REVOKE : revocation par admin
         - PASSWORD_CHANGED : changement de mot de passe
         - DEVICE_UNTRUSTED : appareil devenu non fiable
         - SUSPICIOUS_ACTIVITY : activite suspecte
         - SESSION_LIMIT_EXCEEDED : limite de sessions depassee
         - ACCOUNT_SUSPENDED : compte suspendu

SS-011 [OBLIGATOIRE] A chaque revocation, enregistrer dans la
         chaine d'audit avec la raison complete.
```

---

## 8. Securite des API

### 8.1 Rate Limiting

```
API-001 [OBLIGATOIRE] Rate limiting multi-couche :
         - Cloudflare WAF (1000 req/min/IP)
         - Better Auth (endpoints auth)
         - Redis sliding window (tous les endpoints)
         - Business logic (plans)

API-002 [OBLIGATOIRE] Rate limits par endpoint :
         - AUTH_SIGN_IN : 5 req/60s, block 5min
         - AUTH_SIGN_UP : 3 req/3600s
         - ONBOARDING_SEND_OTP : 3 req/60s, block 10min
         - ONBOARDING_VERIFY_OTP : 5 req/60s, block 5min
         - API generique : 100 req/60s
         - WebSocket : 10 connexions/min/IP

API-003 [OBLIGATOIRE] Fallback local LRU si Redis indisponible.

API-004 [OBLIGATOIRE] Headers de rate limit dans toutes les reponses :
         - X-RateLimit-Limit
         - X-RateLimit-Remaining
         - X-RateLimit-Reset
         - Retry-After (si bloque)
```

### 8.2 Validation & Sanitization

```
API-005 [OBLIGATOIRE] Zod pour valider toutes les entrees API.

API-006 [OBLIGATOIRE] Sanitization des sorties :
         - Pas de mots de passe exposes
         - Pas de tokens exposes
         - Pas de details d'erreur internes

API-007 [OBLIGATOIRE] Content-Type validation :
         - Rejeter les requetes sans Content-Type approprie
         - Rejeter les corps malformes

API-008 [OBLIGATOIRE] Taille maximale des corps de requete :
         - API standard : 1 MB
         - Upload fichiers : 10 MB
         - WebSocket messages : 256 KB
```

### 8.3 CSRF

```
API-009 [OBLIGATOIRE] CSRF protection pour toutes les mutations :
         - SAFE_METHODS : GET, HEAD, OPTIONS (pas de check)
         - Origin / Referer validation
         - CSRF token (cookie + header) si cross-origin

API-010 [OBLIGATOIRE] Pas de CORS wildcard (*) en production.

API-011 [OBLIGATOIRE] Origin validee par liste blanche.
```

### 8.4 Webhooks

```
API-012 [OBLIGATOIRE] Tous les webhooks entrants DOIVENT etre
         verifies par signature HMAC.

API-013 [OBLIGATOIRE] Timeout de traitement : 30 secondes max.

API-014 [OBLIGATOIRE] Idempotency key requise pour les webhooks
         de paiement et notifications critiques.

API-015 [HAUTE] IP whitelist pour les webhooks connus (Resend, Telegram).
```

---

## 9. Securite des WebSocket

### 9.1 Authentification

```
WS-001 [OBLIGATOIRE] Toute connexion WebSocket DOIT etre authentifiee
         via cookie de session HMAC-signe.

WS-002 [OBLIGATOIRE] L'authentification WebSocket DOIT verifier :
         - Signature HMAC du cookie
         - Validite de la session en base
         - Non-expiration de la session
         - Compte actif (non suspendu)

WS-003 [OBLIGATOIRE] Les sessions WebSocket DOIVENT etre liees
         a l'IP de connexion.

WS-004 [OBLIGATOIRE] Limiter le nombre de connexions simultanees
         par utilisateur (max 3 connexions WebSocket).
```

### 9.2 Autorisation

```
WS-005 [OBLIGATOIRE] Les rooms Socket.IO DOIVENT etre protegees :
         - user:{userId} : seul l'utilisateur concerne
         - session:{sessionId} : seule la session concerne
         - admin:{orgId} : seuls les admins autorises

WS-006 [OBLIGATOIRE] Toute tentative de rejoindre une room non
         autorisee DOIT etre loggee comme tentative de securite.

WS-007 [OBLIGATOIRE] Les evenements WebSocket DOIVENT etre valides
         cote serveur (ne pas faire confiance au client).
```

### 9.3 Securite du Transport

```
WS-008 [OBLIGATOIRE] WebSocket UNIQUEMENT sur WSS (TLS).

WS-009 [OBLIGATOIRE] Rate limiting des connexions WebSocket :
         - 10 connexions/min/IP
         - 3 connexions simultanees/user

WS-010 [OBLIGATOIRE] Timeout de connexion :
         - Ping interval : 10s
         - Ping timeout : 30s
         - Deconnexion automatique si timeout

WS-011 [OBLIGATOIRE] Les messages WebSocket DOIVENT etre limites
         en taille (256 KB max).
```

---

## 10. Securite des Donnees

### 10.1 Classification & Protection

```
DT-001 [OBLIGATOIRE] Les donnees SENSIBLES et CRITIQUES DOIVENT etre
         chiffrees au repos.

DT-002 [OBLIGATOIRE] Les tokens OAuth (accessToken, refreshToken)
         DOIVENT etre chiffres en base (chiffrement colonne).

DT-003 [OBLIGATOIRE] Les mots de passe NE DOIVENT JAMAIS etre stockes
         en clair — bcrypt rounds >= 12.

DT-004 [OBLIGATOIRE] Les donnees de session en Redis DOIVENT avoir
         un TTL (pas de stockage permanent).

DT-005 [OBLIGATOIRE] Les donnees PERSONNELLES DOIVENT etre pseudonymisees
         dans les logs et metriques.

DT-006 [OBLIGATOIRE] Les exports de donnees DOIVENT etre limites
         et audites.
```

### 10.2 Retention & Purge

```
DT-007 [OBLIGATOIRE] Retention par type de donnees :
         - Sessions expirees : purge apres 90 jours
         - Login attempts : 90 jours
         - Security events : 1 an
         - Audit logs : 5 ans (obligation legale)
         - Logs applicatifs : 30 jours
         - Sessions actives : jusqu'a expiration + 7 jours

DT-008 [OBLIGATOIRE] Purge automatisee (cron) avec confirmation avant
         suppression definitive.

DT-009 [OBLIGATOIRE] Soft delete pour les comptes utilisateur
         (deletedAt + anonymisation apres 30 jours).

DT-010 [OBLIGATOIRE] Anonymisation des donnees utilisateur apres
         suppression du compte (email hashe, nom randomise).
```

### 10.3 Sauvegarde & Reprise

```
DT-011 [OBLIGATOIRE] Sauvegardes chiffrees (AES-256).

DT-012 [OBLIGATOIRE] Sauvegardes stockees dans une region differente
         du primary.

DT-013 [OBLIGATOIRE] Tests de restauration mensuels.

DT-014 [OBLIGATOIRE] RPO (Recovery Point Objective) : 5 minutes
         (WAL streaming PostgreSQL).

DT-015 [OBLIGATOIRE] RTO (Recovery Time Objective) : 1 heure.
```

---

## 11. Securite de l'Infrastructure

### 11.1 Reseau

```
INF-001 [OBLIGATOIRE] Tous les services internes DOIVENT communiquer
         sur un reseau isole (Docker network interne).

INF-002 [OBLIGATOIRE] Pas d'exposition directe de Redis, PostgreSQL,
         ou BullMQ sur Internet.

INF-003 [OBLIGATOIRE] TLS 1.3 obligatoire pour toutes les communications
         externes.

INF-004 [OBLIGATOIRE] Cloudflare WAF en protection des origin servers.

INF-005 [HAUTE] IP whitelist pour les acces SSH et d'administration.

INF-006 [OBLIGATOIRE] Rate limiting au niveau du load balancer / WAF.
```

### 11.2 Conteneurs

```
INF-007 [OBLIGATOIRE] Images Docker multi-stage — pas de secrets
         dans les couches intermediaires.

INF-008 [OBLIGATOIRE] Les conteneurs DOIVENT tourner en read-only
         root filesystem sauf besoin explicite.

INF-009 [OBLIGATOIRE] Pas de conteneurs en mode privileged.

INF-010 [OBLIGATOIRE] Utilisateur non-root dans les conteneurs.

INF-011 [HAUTE] Scan des images avec Trivy avant deploiement.

INF-012 [OBLIGATOIRE] Resource limits (CPU, RAM) definies pour
         chaque conteneur.
```

### 11.3 Orchestration (PM2 / Docker)

```
INF-013 [OBLIGATOIRE] PM2 en mode fork pour l'application Next.js.

INF-014 [OBLIGATOIRE] Workers (WebSocket, Queue) separes en
         processus distincts.

INF-015 [OBLIGATOIRE] Health checks pour chaque service.

INF-016 [OBLIGATOIRE] Restart automatique sur crash (PM2 auto-restart).

INF-017 [OBLIGATOIRE] Log rotation (pino + PM2) avec retention
         maximale de 30 jours.
```

### 11.4 Redis

```
INF-018 [OBLIGATOIRE] Redis password protege (AUTH requirepass).

INF-019 [OBLIGATOIRE] Redis TLS en production.

INF-020 [OBLIGATOIRE] Redis rename-command pour les commandes
         dangereuses (FLUSHALL, FLUSHDB, CONFIG, etc.).

INF-021 [OBLIGATOIRE] TTL obligatoire sur toutes les cles Redis
         (pas de stockage permanent).

INF-022 [HAUTE] Redis persistence RDB + AOF configuree.

INF-023 [OBLIGATOIRE] Pas d'exposition Redis sur le reseau public.
```

### 11.5 PostgreSQL (Neon)

```
INF-024 [OBLIGATOIRE] Connexion TLS obligatoire (SSL mode require).

INF-025 [OBLIGATOIRE] Connection pool limite (Prisma: 10-20 connexions).

INF-026 [OBLIGATOIRE] Pas de superuser dans les connexions applicatives.

INF-027 [OBLIGATOIRE] Row-Level Security (RLS) pour les donnees
         multi-tenant si applicable.

INF-028 [OBLIGATOIRE] Migrations Prisma avec revue manuelle avant
         execution en production.

INF-029 [OBLIGATOIRE] WAL streaming pour replication et backups.
```

### 11.6 Stockage Fichiers (S3/MinIO)

```
INF-030 [OBLIGATOIRE] Bucket S3 en mode prive (pas d'acces public).

INF-031 [OBLIGATOIRE] Pre-signed URLs avec expiration :
         - Lecture : 1 heure
         - Ecriture : 30 minutes

INF-032 [OBLIGATOIRE] Chiffrement cote serveur (AES-256) active.

INF-033 [OBLIGATOIRE] Versioning du bucket active.

INF-034 [OBLIGATOIRE] CORS configure avec liste blanche stricte.

INF-035 [OBLIGATOIRE] Pas de listage public du bucket.
```

### 11.7 CDN & Cache

```
INF-036 [OBLIGATOIRE] Cloudflare CDN pour les ressources statiques.

INF-037 [OBLIGATOIRE] Cache-Control: immutable pour les assets
         versionnes (_next/static).

INF-038 [OBLIGATOIRE] Pas de mise en cache des pages authentifiees.

INF-039 [OBLIGATOIRE] Purge du cache CDN lors des deploiements.
```

---

## 12. Securite des Tiers & Dependances

### 12.1 Audit des Dependances

```
DEP-001 [OBLIGATOIRE] npm audit execute a chaque build.
         Blocant si vulnerabilite CRITICAL non resolue.

DEP-002 [OBLIGATOIRE] Dependabot / Renovat configure pour les
         mises a jour automatiques.

DEP-003 [OBLIGATOIRE] Les mises a jour de securite CRITICAL DOIVENT
         etre appliquees sous 48h.

DEP-004 [HAUTE] Snyk ou equivalent pour le scan continu.

DEP-005 [MOYENNE] SBOM genere a chaque release (CycloneDX).
```

### 12.2 Services Externes

```
DEP-006 [OBLIGATOIRE] Tous les services externes DOIVENT etre
         references dans un registre (URL, usage, donnees partagees).

DEP-007 [OBLIGATOIRE] Les services externes DOIVENT etre conformes
         RGPD (DPA signe si donnees personnelles).

DEP-008 [OBLIGATOIRE] Services critiques avec SLA de securite :
         - Neon (PostgreSQL) : SOC 2, encryption at rest
         - Resend (Email) : SOC 2, encryption at rest
         - Sentry : SOC 2, DPA signe
         - Cloudflare : SOC 2, privacy shield
         - Redis Cloud (si utilise) : SOC 2
         - AWS S3 : SOC 2, encryption at rest

DEP-009 [OBLIGATOIRE] Webhooks entrants avec verification de signature.

DEP-010 [HAUTE] IP whitelist pour les appels sortants vers les
         API connues (Resend, Telegram, etc.).
```

---

## 13. Regles de Developpement Securise

### 13.1 Secure Coding Standards

```
SC-001 [OBLIGATOIRE] TypeScript strict mode (strict: true).

SC-002 [OBLIGATOIRE] ESLint avec regles de securite.

SC-003 [OBLIGATOIRE] Zod validation pour toutes les entrees.

SC-004 [OBLIGATOIRE] Pas de any — types explicites obligatoires.

SC-005 [OBLIGATOIRE] Pas de console.log / debug en production
         (Pino logger obligatoire).

SC-006 [OBLIGATOIRE] Pas de fonctions dangereuses (eval, Function,
         setTimeout/setInterval avec string).

SC-007 [OBLIGATOIRE] Tous les fetch DOIVENT avoir un timeout
         (AbortSignal.timeout).

SC-008 [OBLIGATOIRE] Les cookies ne sont jamais accessibles via JS
         (HttpOnly: true).
```

### 13.2 Gestion des Erreurs

```
SC-009 [OBLIGATOIRE] Les erreurs DOIVENT etre loggees avec Pino,
         jamais affichees au client.

SC-010 [OBLIGATOIRE] Les messages d'erreur API DOIVENT etre generiques
         (pas de details techniques).

SC-011 [OBLIGATOIRE] Les stack traces NE DOIVENT JAMAIS etre exposees
         en production.

SC-012 [OBLIGATOIRE] Sentry pour le monitoring des erreurs :
         - Desactiver le logging des cookies de session
         - Desactiver le logging des tokens
```

### 13.3 Revue de Code

```
SC-013 [OBLIGATOIRE] Toute PR DOIT etre revue par au moins un pair.

SC-014 [OBLIGATOIRE] Les changements touchant la securite DOIVENT
         etre revus par un membre de l'equipe Security.

SC-015 [OBLIGATOIRE] Les migrations Prisma DOIVENT etre revues
         avant execution.

SC-016 [HAUTE] Checklist de securite dans le template de PR.
```

### 13.4 Secrets & Configuration

```
SC-017 [OBLIGATOIRE] Aucun secret dans le code source.

SC-018 [OBLIGATOIRE] Variables d'environnement via .env (dev)
         ou secrets manager (prod).

SC-019 [OBLIGATOIRE] .env.example avec valeurs factices COMMITE.

SC-020 [OBLIGATOIRE] .env, *.key, *.pem dans .gitignore.

SC-021 [OBLIGATOIRE] Detection de secrets commites (git leaks / trufflehog)
         dans la CI.

SC-022 [OBLIGATOIRE] Rotation des secrets tous les 90 jours minimum.
```

---

## 14. Exigences de Chiffrement & Gestion des Secrets

### 14.1 Chiffrement en Transit

```
CRYPT-001 [OBLIGATOIRE] TLS 1.3 minimum pour toutes les
         communications externes.

CRYPT-002 [OBLIGATOIRE] TLS 1.2 accepte uniquement en fallback
         (desactiver TLS 1.0, 1.1).

CRYPT-003 [OBLIGATOIRE] Ciphers autorises (ordre de preference) :
         - TLS_AES_256_GCM_SHA384
         - TLS_CHACHA20_POLY1305_SHA256
         - TLS_AES_128_GCM_SHA256

CRYPT-004 [OBLIGATOIRE] Certificats valides (Let's Encrypt / Cloudflare).

CRYPT-005 [OBLIGATOIRE] HSTS preload apres validation.
```

### 14.2 Chiffrement au Repos

```
CRYPT-006 [OBLIGATOIRE] Tokens OAuth chiffres en base (AES-256-GCM).

CRYPT-007 [OBLIGATOIRE] Mots de passe haches (bcrypt rounds >= 12).

CRYPT-008 [OBLIGATOIRE] Backup codes stockes hashes (SHA-256).

CRYPT-009 [OBLIGATOIRE] Fichiers S3 chiffres (AES-256).

CRYPT-010 [HAUTE] Chiffrement des donnees sensibles dans les
         jobs BullMQ.
```

### 14.3 Gestion des Secrets

```
CRYPT-011 [OBLIGATOIRE] BETTER_AUTH_SECRET >= 32 caracteres.

CRYPT-012 [OBLIGATOIRE] Chaque environnement a ses propres secrets.

CRYPT-013 [OBLIGATOIRE] Rotation des secrets tous les 90 jours.

CRYPT-014 [OBLIGATOIRE] Secrets injectes via variables d'environnement,
         jamais hardcodes.

CRYPT-015 [OBLIGATOIRE] Les secrets de production ne sont accessibles
         qu'aux deploiements autorises (GitHub Secrets / Docker secrets).

CRYPT-016 [OBLIGATOIRE] Pas de secrets dans les logs, erreurs, traces.
```

---

## 15. Exigences de Conformite (RGPD / ISO 27001 / SOC 2)

### 15.1 RGPD

```
RGPD-001 [OBLIGATOIRE] Consentement explicite pour la collecte
         de donnees personnelles.

RGPD-002 [OBLIGATOIRE] Droit d'acces : portail utilisateur pour
         exporter ses donnees.

RGPD-003 [OBLIGATOIRE] Droit de rectification : modification du
         profil utilisateur.

RGPD-004 [OBLIGATOIRE] Droit a l'oubli : suppression du compte
         avec purge des donnees sous 30 jours.

RGPD-005 [OBLIGATOIRE] Droit a la portabilite : export JSON/CSV
         des donnees.

RGPD-006 [OBLIGATOIRE] Notification de breach sous 72h.

RGPD-007 [OBLIGATOIRE] DPA (Data Processing Agreement) avec tous
         les sous-traitants.

RGPD-008 [OBLIGATOIRE] Registre des traitements tenu a jour.

RGPD-009 [OBLIGATOIRE] Minimisation des donnees : ne collecter
         que les donnees necessaires.

RGPD-010 [OBLIGATOIRE] Retention limitee : purge automatique
         selon les durees definies en §10.2.

RGPD-011 [OBLIGATOIRE] Privacy by Design : les nouvelles
         fonctionnalites DOIVENT integrer la protection des donnees
         des la conception.

RGPD-012 [OBLIGATOIRE] Les donnees personnelles NE DOIVENT PAS
         quitter l'UE sans garanties adequates (Clauses Contractuelles
         Types / Privacy Shield).
```

### 15.2 ISO 27001

```
ISO-001 [OBLIGATOIRE] Politique de securite de l'information documentee.

ISO-002 [OBLIGATOIRE] Classification des donnees (cf. §1.4).

ISO-003 [OBLIGATOIRE] Gestion des acces avec revue trimestrielle.

ISO-004 [OBLIGATOIRE] Sensibilisation des equipes a la securite.

ISO-005 [OBLIGATOIRE] Gestion des incidents avec procedure documentee.

ISO-006 [OBLIGATOIRE] Tests de penetration annuels.

ISO-007 [OBLIGATOIRE] Analyse de risques annuelle.

ISO-008 [OBLIGATOIRE] Plan de continuite et reprise d'activite (PCA/PRA).
```

### 15.3 SOC 2

```
SOC-001 [OBLIGATOIRE] Controles d'acces logiques (authentification,
         autorisation, revocation).

SOC-002 [OBLIGATOIRE] Disponibilite : monitoring, alerting, SLA.

SOC-003 [OBLIGATOIRE] Integrite des traitements : validation,
         logging, audit chain.

SOC-004 [OBLIGATOIRE] Confidentialite : chiffrement, classification,
         retention.

SOC-005 [OBLIGATOIRE] Protection des donnees personnelles : RGPD
         compliance + DPA.
```

---

## 16. Exigences de Journalisation & Audit

### 16.1 Evenements Audites

```
LOG-001 [OBLIGATOIRE] Les evenements suivants DOIVENT etre audites :
         - Connexion (succes / echec)
         - Deconnexion
         - Creation de session
         - Revocation de session
         - Changement de mot de passe
         - Changement d'email
         - Activation / desactivation 2FA
         - Verification 2FA (succes / echec)
         - Utilisation code de backup
         - Suspension / reactivation de compte
         - Suppression de compte
         - Modification des permissions / roles
         - Actions admin
         - Tentative de hijacking
         - Rate limit bloque
         - CSRF detecte
         - Acces refuse (403)
```

### 16.2 Chaine d'Audit Infalsifiable

```
LOG-002 [OBLIGATOIRE] La chaine d'audit utilise un hash chain :
         Chaque entree contient :
         - Son propre hash (SHA-256)
         - Le hash de l'entree precedente
         - Timestamp ISO 8601

LOG-003 [OBLIGATOIRE] Verification periodique de l'integrite
         de la chaine (cron hebdomadaire).

LOG-004 [OBLIGATOIRE] Les logs d'audit sont en lecture seule
         une fois ecrits (pas de UPDATE, pas de DELETE).

LOG-005 [OBLIGATOIRE] Retention des logs d'audit : 5 ans minimum.
```

### 16.3 Structuration des Logs

```
LOG-006 [OBLIGATOIRE] Format structure (Pino) :
         - timestamp (ISO 8601)
         - level (INFO / WARN / ERROR / CRITICAL)
         - module (nom du module)
         - requestId (correlation)
         - userId (si authentifie)
         - ip
         - action
         - duration (si applicable)
         - error (si erreur, sans details sensibles)

LOG-007 [OBLIGATOIRE] Pas de donnees sensibles dans les logs
         (mots de passe, tokens, cookies, corps de requete auth).

LOG-008 [OBLIGATOIRE] Les logs sont centralises (Loki / ELK)
         et indexes.
```

---

## 17. Exigences de Tests & Verification

### 17.1 Tests Obligatoires

```
TST-001 [OBLIGATOIRE] Tests unitaires pour :
         - Validation des mots de passe
         - Verification des signatures HMAC
         - Rate limiting
         - Calcul des scores de risque
         - Validation Zod des schemas
         - Fonctions de chiffrement/dechiffrement

TST-002 [OBLIGATOIRE] Tests d'integration pour :
         - Flux de connexion complet
         - Flux d'inscription
         - Reset de mot de passe
         - 2FA (setup, verification, backup codes)
         - Gestion des sessions (creation, rotation, revocation)
         - Rate limiting (atteinte du seuil, blocage)
         - WebSocket (authentification, rooms)

TST-003 [HAUTE] Tests E2E (Playwright) pour :
         - Parcours utilisateur complet
         - Tentatives de connexion echouees
         - Rate limiting visible par l'utilisateur
         - 2FA setup et utilisation
         - Gestion des appareils
```

### 17.2 Tests de Securite

```
TST-004 [OBLIGATOIRE] Tests de penetration annuels.

TST-005 [OBLIGATOIRE] Scan OWASP ZAP / Burp Suite sur
         les endpoints critiques.

TST-006 [HAUTE] Fuzzing des endpoints API.

TST-007 [HAUTE] Test de brute force automatise.

TST-008 [HAUTE] Test de credential stuffing simule.

TST-009 [OBLIGATOIRE] Test de revocation de session.

TST-010 [OBLIGATOIRE] Test de rate limiting.

TST-011 [MOYENNE] Test de resistance (load test) avec
         scenarios de securite.
```

### 17.3 Verification Continue

```
TST-012 [OBLIGATOIRE] lint + typecheck + tests a chaque commit.

TST-013 [OBLIGATOIRE] npm audit a chaque build.

TST-014 [HAUTE] SAST (Static Analysis) sur chaque PR.

TST-015 [MOYENNE] DAST (Dynamic Analysis) en staging.

TST-016 [OBLIGATOIRE] Revue de securite pour toute PR
         touchant l'auth, les sessions, ou les donnees sensibles.
```

---

## 18. Exigences de Reponse aux Incidents

### 18.1 Classification des Incidents

```
IR-001 [OBLIGATOIRE] Classification des incidents de securite :
         - CRITICAL : Breach de donnees, compromission admin,
           indisponibilite totale
         - HIGH : Tentative de compromission, fuite limitee,
           DDoS partiel
         - MEDIUM : Incident isole, alerte non confirmee,
           utilisateur individuel compromis
         - LOW : Tentative echouee, scan, erreur de configuration
```

### 18.2 Délais d'Intervention

```
IR-002 [OBLIGATOIRE] Temps de reponse :
         - CRITICAL : < 15 minutes, 24/7
         - HIGH : < 1 heure, heures ouvre
         - MEDIUM : < 24 heures
         - LOW : < 72 heures

IR-003 [OBLIGATOIRE] Notification RGPD sous 72h pour les breaches
         de donnees personnelles.

IR-004 [OBLIGATOIRE] Post-mortem obligatoire pour tout incident
         HIGH et CRITICAL dans les 5 jours ouvre.
```

### 18.3 Playbooks Obligatoires

```
IR-005 [OBLIGATOIRE] Playbook "Compte compromis" :
         - Revocation immediate de toutes les sessions
         - Forcer le changement de mot de passe
         - Notifier l'utilisateur
         - Analyser la compromission

IR-006 [OBLIGATOIRE] Playbook "Fuite de donnees" :
         - Identifier la source
         - Stopper la fuite
         - Evaluer l'impact
         - Notifier les autorites (si RGPD)
         - Notifier les utilisateurs impactes

IR-007 [OBLIGATOIRE] Playbook "DDoS" :
         - Activer Cloudflare Under Attack
         - Analyser les logs
         - Coordonner avec l'hebergeur

IR-008 [HAUTE] Playbook "Fraude detectee" :
         - Verifier les alertes du moteur de fraude
         - Bloquer les IPs / comptes concernes
         - Notifier l'equipe fraude
```

---

## 19. Matrice de Maturite & Objectifs

### 19.1 Niveaux de Maturite Cibles

| Domaine | Actuel | Cible | Ecart | Priorite |
|---------|:------:|:-----:|:-----:|:--------:|
| Authentification (MFA) | 2/5 | 5/5 | -3 | CRITICAL |
| Gestion des sessions | 3/5 | 5/5 | -2 | CRITICAL |
| Chiffrement des donnees | 3/5 | 5/5 | -2 | HAUTE |
| Rate limiting | 4/5 | 5/5 | -1 | HAUTE |
| Audit & logs | 3/5 | 5/5 | -2 | HAUTE |
| Protection anti-partage | 2/5 | 5/5 | -3 | CRITICAL |
| Device trust | 2/5 | 5/5 | -3 | HAUTE |
| API security | 3/5 | 5/5 | -2 | HAUTE |
| WebSocket security | 3/5 | 5/5 | -2 | HAUTE |
| Conformite RGPD | 3/5 | 5/5 | -2 | HAUTE |
| Security testing | 2/5 | 4/5 | -2 | MOYENNE |
| Incident response | 1/5 | 4/5 | -3 | MOYENNE |

### 19.2 Objectifs par Phase

**Phase 1 (Urgent — J0 a J30) :**
- MFA obligatoire pour les admins
- Rate limiting strict sur l'auth
- Validation Zod sur toutes les API
- Headers de securite CSP/HSTS
- Audit logging des evenements critiques

**Phase 2 (Court terme — J30 a J90) :**
- MFA pour tous les utilisateurs
- Device fingerprinting complet
- Session binding avance
- Detection d'hijacking
- Tests de securite automatisés

**Phase 3 (Moyen terme — J90 a J180) :**
- Moteur de fraude ML
- Chiffrement des tokens OAuth
- Chaine d'audit infalsifiable
- Tests de penetration
- Certification SOC 2 preparation

---

## 20. Glossaire & References

### 20.1 Glossaire

| Terme | Definition |
|-------|------------|
| **AAL** | Authenticator Assurance Level (NIST) |
| **ATO** | Account Takeover |
| **CSP** | Content Security Policy |
| **CSRF** | Cross-Site Request Forgery |
| **HSTS** | HTTP Strict Transport Security |
| **IAL** | Identity Assurance Level (NIST) |
| **IDOR** | Insecure Direct Object Reference |
| **MFA** | Multi-Factor Authentication |
| **PKCE** | Proof Key for Code Exchange |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row-Level Security |
| **RPO** | Recovery Point Objective |
| **RTO** | Recovery Time Objective |
| **SAST** | Static Application Security Testing |
| **SBOM** | Software Bill of Materials |
| **SSRF** | Server-Side Request Forgery |
| **TLS** | Transport Layer Security |
| **TOTP** | Time-based One-Time Password |
| **WAF** | Web Application Firewall |
| **XSS** | Cross-Site Scripting |

### 20.2 References

| Reference | Description | URL |
|-----------|-------------|-----|
| OWASP Top 10 2021 | Web Application Security Risks | https://owasp.org/Top10/ |
| NIST SP 800-63 Rev 4 | Digital Identity Guidelines | https://pages.nist.gov/800-63-4/ |
| NIST SP 800-53 Rev 5 | Security and Privacy Controls | https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final |
| RGPD | Reglement General Protection des Donnees | https://cnil.fr/fr/reglement-europeen-protection-donnees |
| ISO 27001:2022 | Information Security Management | https://www.iso.org/standard/27001 |
| SOC 2 | Service Organization Control 2 | https://www.aicpa-cima.com/audit/soc-2 |
| Better Auth Docs | Documentation Better Auth | https://www.better-auth.com/docs |
| Next.js Security | Next.js Security Headers | https://nextjs.org/docs/app/api-reference/config/next-config-js/headers |
| OWASP ASVS | Application Security Verification Standard | https://owasp.org/www-project-application-security-verification-standard/ |
| OWASP Cheat Sheet | Series of security cheat sheets | https://cheatsheetseries.owasp.org/ |

### 20.3 Documents Relies

| Document | Description |
|----------|-------------|
| `MASTER_ZERO_TRUST_SECURITY.md` | Architecture zero-trust de reference |
| `MASTER_ACCOUNT_SHARING_PREVENTION_AUDIT.md` | Audit et prevention du partage de compte |
| `MASTER_FRAUD_ENGINE.md` | Moteur de fraude intelligent |
| `MASTER_AUTH_ARCHITECTURE.md` | Architecture d'authentification complete |
| `MASTER_SECURITY_ARCHITECTURE.md` | Architecture de securite globale |
| `MASTER_IMPLEMENTATION_GUIDE.md` | Guide d'implementation securise |
| `MASTER_SECURITY_TEST_PLAN.md` | Plan de tests de securite |
| `MASTER_EVIL_STORIES.md` | Scenarios d'attaques et protections |

---

> **Fin du document MASTER_SECURITY_REQUIREMENTS.md**  
> **Version 1.0.0 — 2026-07-22**  
> **Prochaine revision : trimestrielle**  
> **Responsable : equipe Security & Platform**
