# Architecture de Securite — MASTER_SECURITY_ARCHITECTURE.md

> **Document d'Architecture de Referenre** — Version 1.0.0  
> **Classification** : Interne — Confidentiel  
> **Derniere mise a jour** : 2026-07-22  
> **Stack** : Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis/Valkey, Socket.IO, BullMQ, MinIO/S3, imgproxy, Traefik  
> **Base sur** : `MASTER_SECURITY_REQUIREMENTS.md`, `MASTER_ZERO_TRUST_SECURITY.md`

---

## Table des Matieres

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Diagramme d'Architecture Globale](#2-diagramme-darchitecture-globale)
3. [Composants & Trust Boundaries](#3-composants--trust-boundaries)
4. [Flux de Donnees Securises](#4-flux-de-donnees-securises)
5. [Architecture Reseau & Isolation](#5-architecture-reseau--isolation)
6. [Gestion des Secrets & Certificats](#6-gestion-des-secrets--certificats)
7. [Architecture Redis](#7-architecture-redis)
8. [Architecture PostgreSQL](#8-architecture-postgresql)
9. [Architecture Socket.IO & WebSocket](#9-architecture-socketio--websocket)
10. [Architecture Better Auth](#10-architecture-better-auth)
11. [Architecture Workers & BullMQ](#11-architecture-workers--bullmq)
12. [Architecture Stockage Fichiers](#12-architecture-stockage-fichiers)
13. [Architecture CDN & Cache](#13-architecture-cdn--cache)
14. [Architecture Observabilite](#14-architecture-observabilite)
15. [Matrice de Confiance Inter-Composants](#15-matrice-de-confiance-inter-composants)
16. [Plans de Secours & Degradation](#16-plans-de-secours--degradation)

---

## 1. Vue d'Ensemble

### 1.1 Principes d'Architecture

```
+----------------------------------------------------------------------+
|              PRINCIPES D'ARCHITECTURE SECURITE                        |
+----------------------------------------------------------------------+
|                                                                       |
|  P1. Aucun composant n'est trusted par defaut                         |
|  P2. Toute communication est authentifiee et chiffree                  |
|  P3. Chaque couche a ses propres defenses                             |
|  P4. Les secrets sont injectes, jamais stockes dans le code           |
|  P5. Les donnees sensibles sont chiffrees au repos et en transit      |
|  P6. La segmentation reseau isole les composants critiques            |
|  P7. Toute action critique est auditee                                |
|  P8. Le systeme degrade gracieusement sans compromission              |
|                                                                       |
+----------------------------------------------------------------------+
```

### 1.2 Perimetre de Confiance

```
+---------------------------+---------------------------+-------------------+
|  ZONE PUBLIQUE            |  ZONE DMZ                |  ZONE INTERNE     |
|  (Internet)               |  (Perimetre)              |  (Isolation)      |
+---------------------------+---------------------------+-------------------+
|  - Navigateurs utilisateur |  - Cloudflare WAF        |  - Redis/Valkey   |
|  - Bots / scrappers       |  - Traefik reverse proxy  |  - PostgreSQL     |
|  - APIs tierces            |  - Let's Encrypt TLS     |  - MinIO/S3       |
|  - Services OAuth          |  - Next.js app (port 3000)|  - imgproxy       |
|  - Resend (email)         |  - Socket.IO (port 3001) |  - BullMQ Worker  |
|  - Telegram               |  - Bull Board (port 3002)|  - Stockage local  |
+---------------------------+---------------------------+-------------------+
        |                           |                           |
        v                           v                           v
  Attaques: XSS,            Attaques: CSRF,             Attaques: SSRF,
  CSRF, injection,          hijacking, rate             compromise interne,
  credential stuffing       limit bypass,               exfiltration,
                            cookie theft                privilege escalation
```

---

## 2. Diagramme d'Architecture Globale

```
+================================================================================+
|                              INTERNET                                          |
+================================================================================+
        |                                              |
        v                                              v
+------------------+                          +------------------+
|   Cloudflare     |                          |  Services        |
|   WAF + CDN      |                          |  OAuth (Google,  |
|   + DDoS Shield  |                          |  Discord)        |
+--------+---------+                          +--------+---------+
         |                                             |
         | HTTPS (TLS 1.3)                             | HTTPS (TLS 1.3)
         v                                             v
+================================================================================+
|                       TRAEFIK REVERSE PROXY                                    |
|              (Let's Encrypt TLS Termination)                                   |
|     Host: access.signauxx.com                                                  |
+================================================================================+
    |               |               |               |
    |               |               |               |
    v               v               v               v
+-----------+ +-----------+ +-----------+ +-------------------+
| Next.js   | | Socket.IO | | Bull Board| | Services externes |
| App       | | Worker    | | (Admin    | | Resend, Telegram  |
| :3000     | | :3001     | | queues)   | | (fetch sortants)  |
+-----------+ +-----------+ :3002       | +-------------------+
    |               |       +-----------+
    |               |               |
    +---------------+---------------+-----------------+
                    |               |                 |
                    v               v                 v
        +-------------------+ +-----------+ +------------------+
        |  REDIS / VALKEY   | | PostgreSQL| |  MINIO / S3      |
        |  - Cache session  | | (NEON)    | |  - Fichiers      |
        |  - Rate limiting  | | - Users   | |  - Images        |
        |  - BullMQ queues  | | - Sessions| |  - Uploads       |
        |  - Feature store  | | - Devices | +------------------+
        |  - Pub/Sub WS     | | - Audit   |        |
        +-------------------+ +-----------+        v
                |                           +-----------+
                |                           | imgproxy  |
                |                           | :8080     |
                |                           +-----------+
                v
        +-------------------+
        |  WORKER (BullMQ)  |
        |  - Async risk     |
        |  - Emails         |
        |  - Notifications  |
        |  - Retraining     |
        +-------------------+

Legend:
-------
[Cloudflare] -> [Traefik] -> [App/Worker] -> [Redis/PostgreSQL/MinIO]
    WAF/TLS       TLS term        Auth + logic      Data layer
```

### 2.1 Mapping des Flux

| Flux | Source | Destination | Protocole | Chiffrement | Authentification |
|------|--------|-------------|-----------|-------------|------------------|
| Navigation Web | Navigateur | Cloudflare -> Traefik -> Next.js | HTTPS (TLS 1.3) | Oui | Cookie session |
| API REST | Client | Cloudflare -> Traefik -> Next.js | HTTPS | Oui | Cookie + CSRF |
| WebSocket | Client | Cloudflare -> Traefik -> Socket.IO | WSS (TLS 1.3) | Oui | Cookie HMAC |
| Auth OAuth | Client | Navigateur -> Google/Discord -> Callback | HTTPS | Oui | OAuth 2.0 + PKCE |
| Email | Next.js/Worker | Resend API | HTTPS | Oui | API Key |
| DB Queries | Next.js/Worker | PostgreSQL (Neon) | TLS | Oui | Password + SSL |
| Cache/Queue | Next.js/Worker/WS | Redis/Valkey | TCP (interne) | Interne (TLS si prod) | Password (AUTH) |
| Stockage Fichiers | Next.js/Worker | MinIO/S3 | HTTP (interne) | Interne | Access Key + Secret |
| Image Proxy | imgproxy | MinIO | HTTP (interne) | Interne | HMAC URL signature |

---

## 3. Composants & Trust Boundaries

### 3.1 Inventaire des Composants

| ID | Composant | Technologie | Role | Zone | Dependances |
|----|-----------|-------------|------|------|-------------|
| C01 | Navigateur | Client Web | Interface utilisateur | PUBLIQUE | Aucune |
| C02 | Cloudflare | WAF + CDN | Protection DDoS, cache, TLS edge | DMZ | C01 |
| C03 | Traefik | Reverse Proxy | Termination TLS, routage, load balancing | DMZ | C02 |
| C04 | Next.js App | Next.js 16 | Application principale, API, SSR | DMZ | C03, C08, C09, C10 |
| C05 | Socket.IO Worker | Socket.IO 4.8 | WebSocket temps reel | DMZ | C03, C08, C09 |
| C06 | BullMQ Worker | BullMQ + tsx | Jobs asynchrones (emails, risk scoring) | INTERNE | C08, C09 |
| C07 | Bull Board | Express + @bull-board | Dashboard admin des queues | DMZ (restreint) | C08 |
| C08 | Redis/Valkey | Valkey 8 | Cache, rate limiting, queues, pub/sub | INTERNE | Aucune |
| C09 | PostgreSQL | Neon (PostgreSQL 16) | Donnees persistantes | INTERNE | Aucune |
| C10 | MinIO | MinIO / AWS S3 | Stockage fichiers, images | INTERNE | Aucune |
| C11 | imgproxy | darthsim/imgproxy | Redimensionnement images | INTERNE | C10 |
| C12 | Resend | Service externe | Envoi d'emails transactionnels | EXTERNE | Aucune |
| C13 | Sentry | Service externe | Monitoring erreurs | EXTERNE | Aucune |
| C14 | PM2 | Process Manager | Supervision des processus | INTERNE | C04, C05 |
| C15 | Workers (Cloudflare) | Edge compute (futur) | Logique edge | EDGE (Cloudflare) | C02 |

### 3.2 Trust Boundaries (Lignes de Confiance)

```
TB-1: Navigateur <-> Cloudflare
      ----------------------------
      Trust: MINIMAL - Cloudflare inspecte le trafic
      Mecanismes: TLS 1.3, WAF, Bot Management, Challenge (CAPTCHA)
      Risques: XSS, CSRF, cookie theft, MITM (si TLS compromise)

TB-2: Cloudflare <-> Traefik
      ----------------------------
      Trust: HAUT - Connexion interne chiffree
      Mecanismes: TLS 1.3 (origin pull), IP whitelist Cloudflare
      Risques: Si cles TLS compromise, traffic intercepte

TB-3: Traefik <-> Next.js / Socket.IO
      ----------------------------
      Trust: HAUT - Reseau Docker interne
      Mecanismes: Reseau isole, pas d'exposition directe
      Risques: SSRF interne, compromise container

TB-4: Next.js <-> Redis
      ----------------------------
      Trust: MOYEN - Reseau interne avec auth
      Mecanismes: Password (AUTH), TLS (prod), TTL obligatoire
      Risques: Redis compromise si password fuite, injection commande

TB-5: Next.js <-> PostgreSQL
      ----------------------------
      Trust: HAUT - Connexion TLS + password
      Mecanismes: SSL require, connection pool, role applicatif
      Risques: SQL injection (bloque par Prisma), credential leak

TB-6: Next.js <-> MinIO
      ----------------------------
      Trust: MOYEN - Reseau interne
      Mecanismes: HMAC signature (presigned URLs), bucket policy
      Risques: Acces non autorise si credentials fuient

TB-7: Application <-> Services Externes
      ----------------------------
      Trust: FAIBLE - Internet
      Mecanismes: TLS 1.3, API keys, webhook signature verification
      Risques: Interception, compromission fournisseur
```

### 3.3 Matrice des Acces Inter-Composants

```
                | Cloudfl | Traefik | Next.js | SocketIO| Worker  | Redis   | Postgres| MinIO   | imgproxy| Externe |
----------------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
Navigateur      |  R/W    |    -    |    -    |    -    |    -    |    -    |    -    |    -    |    -    | R/W OAuth|
Cloudflare      |    -    |  R/W    |    -    |    -    |    -    |    -    |    -    |    -    |    -    |    -    |
Traefik         |    -    |    -    |  R/W    |  R/W    |    -    |    -    |    -    |    -    |    -    |    -    |
Next.js         | R/W API |    -    |    -    |  R/W    |  R/W    |  R/W    |  R/W    |  R/W    |    -    |  R/W    |
Socket.IO       |    -    |    -    |    -    |    -    |    -    |  R/W    |  R/W    |    -    |    -    |    -    |
Worker          |    -    |    -    |    -    |    -    |    -    |  R/W    |  R/W    |  R/W    |    -    |  R/W    |
Bull Board      |    -    |    -    |    -    |    -    |    -    |  RO     |    -    |    -    |    -    |    -    |
imgproxy        |    -    |    -    |    -    |    -    |    -    |    -    |    -    |  RO     |    -    |    -    |

Legend: R=Read, W=Write, RO=ReadOnly, R/W=ReadWrite, -=pas d'acces direct
```

---

## 4. Flux de Donnees Securises

### 4.1 Flux d'Authentification (Login)

```
Etape 1: Requete du navigateur
================================
Navigateur                          Cloudflare                         Traefik
    |                                   |                                |
    | POST /api/auth/sign-in            |                                |
    | HTTPS (TLS 1.3)                   |                                |
    |---------------------------------->|                                |
    |                                   | WAF check, rate limit IP      |
    |                                   | Bot detection                  |
    |                                   | Challenge (si suspect)         |
    |                                   |-------------------------------->|
    |                                   |                                | TLS termination
    |                                   |                                | Forward X-Forwarded-For
    |                                   |                                | Add cf-connecting-ip
    |                                   |                                |
    |                                   |                                v
    |                                   |                       +------------------+
    |                                   |                       |   Next.js App    |
    |                                   |                       |   :3000          |
    |                                   |                       +------------------+
    |                                   |                                |
    |                                   |                                |
    |                                   |                        +-------v--------+
    |                                   |                        | 1. Rate Check  |
    |                                   |                        | Redis (sliding |
    |                                   |                        | window)        |
    |                                   |                        +-------+--------+
    |                                   |                                |
    |                                   |                        +-------v--------+
    |                                   |                        | 2. Device Check|
    |                                   |                        | (fingerprint)  |
    |                                   |                        +-------+--------+
    |                                   |                                |
    |                                   |                        +-------v--------+
    |                                   |                        | 3. Auth Better |
    |                                   |                        | Verify creds   |
    |                                   |                        | (bcrypt check) |
    |                                   |                        +-------+--------+
    |                                   |                                |
    |                                   |                        +-------v--------+
    |                                   |                        | 4. Sync Risk   |
    |                                   |                        | (< 100ms)      |
    |                                   |                        +-------+--------+
    |                                   |                                |
    |                                   |                        +-------v--------+
    |                                   |                        | 5. Session     |
    |                                   |                        | Create + Redis |
    |                                   |                        | Cache          |
    |                                   |                        +-------+--------+
    |                                   |                                |
    |                                   |<-------------------------------+
    |                                   | Set-Cookie: session_token      |
    |<-- Set-Cookie (Secure, HttpOnly) -| (signed HMAC-SHA256)           |
    |                                   |                                |
    |                                   |                                v
    |                                   |                       +------------------+
    |                                   |                       | Async Queue     |
    |                                   |                       | BullMQ:         |
    |                                   |                       | risk:async      |
    |                                   |                       +------------------+
    |                                   |                                |
    |                                   |                                v
    |                                   |                       +------------------+
    |                                   |                       | Worker (async)  |
    |                                   |                       | IP reputation   |
    |                                   |                       | Geo distance    |
    |                                   |                       | ML inference    |
    |                                   |                       | Behavior check  |
    |                                   |                       +------------------+

Securite appliquee a chaque etape:
1. TLS 1.3 : Chiffrement transport
2. WAF : Filtrage niveau 7 (SQLi, XSS, path traversal)
3. Rate limiting : Redis sliding window (5 req/60s)
4. Device check : Fingerprint validation
5. Password : bcrypt (rounds=12) comparison
6. Session cookie : HMAC-SHA256 signed, HttpOnly, Secure, SameSite=Lax
7. Blacklist : Ancienne session blacklistee dans Redis
```

### 4.2 Flux API Protege

```
Navigateur                          Next.js                          Redis           PostgreSQL
    |                                   |                               |               |
    | GET /api/user/profile              |                               |               |
    | Cookie: session_token              |                               |               |
    |---------------------------------->|                               |               |
    |                                   |                               |               |
    |                            +-------v--------+                     |               |
    |                            | Middleware       |                    |               |
    |                            | - Verify cookie  |                    |               |
    |                            | - Check blacklist|------------------>| Session valid?|
    |                            | - CSRF check     |                    |               |
    |                            +-------+--------+                     |               |
    |                                    |                              |               |
    |                            +-------v--------+                     |               |
    |                            | Rate limit      |                    |               |
    |                            | Check IP+User   |------------------>| zcard         |
    |                            | for endpoint    |                    |               |
    |                            +-------+--------+                     |               |
    |                                    |                              |               |
    |                            +-------v--------+                     |               |
    |                            | Device check    |                    |               |
    |                            | Fingerprint OK? |                    |               |
    |                            +-------+--------+                     |               |
    |                                    |                              |               |
    |                            +-------v--------+                     |               |
    |                            | Server Action   |                    |               |
    |                            | - Zod validate  |                    |               |
    |                            | - RBAC check    |                    |               |
    |                            | - Fetch data    |--------------------+-------------->| SELECT
    |                            +-------+--------+                     |               |
    |                                    |                              |               |
    |<-- 200 JSON (sanitized) -----------+                              |               |
    |                                    |                              |               |
    |                            +-------v--------+                     |               |
    |                            | Audit Log       |                    |               |
    |                            | recordSecurity  |                    |               |
    |                            | Event           |                    |               |
    |                            +----------------+                     |               |
```

### 4.3 Flux WebSocket

```
Client Socket.IO                    Traefik                         Socket.IO Worker
    |                                   |                                   |
    | WSS connect                        |                                   |
    | Cookie: session_token              |                                   |
    |---------------------------------->|                                   |
    |                                   | TLS termination                   |
    |                                   | Route /socket.io/* (priority 200) |
    |                                   |---------------------------------->|
    |                                   |                                   |
    |                                   |                           +-------v--------+
    |                                   |                           | 1. Auth        |
    |                                   |                           | Verify Cookie  |
    |                                   |                           | HMAC signature |
    |                                   |                           | Session valid? |
    |                                   |                           +-------+--------+
    |                                   |                                   |
    |                                   |                           +-------v--------+
    |                                   |                           | 2. Rate limit  |
    |                                   |                           | 10 conn/min/IP |
    |                                   |                           | 3 max/user     |
    |                                   |                           +-------+--------+
    |                                   |                                   |
    |                                   |                           +-------v--------+
    |                                   |                           | 3. Session     |
    |                                   |                           | Update Redis   |
    |                                   |                           | (set user:room)|
    |                                   |                           +-------+--------+
    |                                   |                                   |
    |<-- Connected (room: user:{id}) ---+-----------------------------------+
    |                                   |                                   |
    |                                   |                           +-------v--------+
    |                                   |                           | 4. Pub/Sub     |
    |                                   |                           | Redis adapter  |
    |                                   |                           | (cross-instance|
    |                                   |                           |  broadcast)    |
    |                                   |                           +-------+--------+
```

### 4.4 Flux de Jobs Asynchrones (BullMQ)

```
Next.js App                          Redis (Queue)                    Worker
    |                                   |                               |
    | Enqueue job                       |                               |
    | risk:async                        |                               |
    |---------------------------------->|                               |
    |                                   | LPUSH job                     |
    |                                   |                               |
    |                                   |<------------------------------| BRPOP (blocking)
    |                                   |                               |
    |                                   |                               +-------v--------+
    |                                   |                               | Process job    |
    |                                   |                               | IP reputation  |
    |                                   |                               | Geo distance   |
    |                                   |                               | ML inference   |
    |                                   |                               | Session update |
    |                                   |                               +-------+--------+
    |                                   |                                       |
    |                                   |<---- ACK (job completed)              |
    |                                   |                                       |
    |                                   |                                       v
    |                                   |                               +---------------+
    |                                   |                               | Update Session|
    |                                   |                               | riskScore     |
    |                                   |                               | Create        |
    |                                   |                               | SecurityEvent |
    |                                   |                               | if HIGH       |
    |                                   |                               +---------------+

Note: Les donnees sensibles dans les jobs sont chiffrees.
      TTL des jobs : 1 heure max.
      Dead letter queue apres 3 echecs.
```

---

## 5. Architecture Reseau & Isolation

### 5.1 Topologie Reseau

```
+------------------------------------------------------------------+
|                         INTERNET                                 |
+------------------------------------------------------------------+
        |                                      |
        v                                      v
+------------------+                  +------------------+
| Cloudflare       |                  | Services OAuth   |
| (WAF + CDN)      |                  | Google, Discord  |
+--------+---------+                  +--------+---------+
         |                                      |
         | TLS 1.3 origin pull                  | TLS 1.3
         v                                      |
+------------------------------------------------------------------+
|                    TRAEFIK (Proxy Externe)                       |
|               Reseau: proxy (external)                           |
|               TLS termination, Let's Encrypt                     |
+------------------------------------------------------------------+
        |                                    
        v                                    
+------------------------------------------------------------------+
|                    DOCKER RESEAU INTERNE : nba                   |
+------------------------------------------------------------------+
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  | Next.js App    |  | Socket.IO      |  | Bull Board     |       |
|  | :3000          |  | :3001          |  | :3002          |       |
|  | Reseau: nba    |  | Reseau: nba    |  | Reseau: nba    |       |
|  | + proxy        |  | + proxy        |  | + proxy        |       |
|  +-------+--------+  +-------+--------+  +-------+--------+       |
|          |                    |                    |               |
|          +--------------------+--------------------+               |
|                               |                                    |
|                               v                                    |
|  +----------------+  +----------------+  +----------------+       |
|  | Redis/Valkey   |  | PostgreSQL     |  | MinIO / S3     |       |
|  | :6379          |  | (Neon cloud)   |  | :9000          |       |
|  | Reseau: nba    |  | SSL require    |  | Reseau: nba    |       |
|  | Password AUTH  |  | IP whitelist   |  | + HMAC auth    |       |
|  +----------------+  +----------------+  +-------+--------+       |
|                                                   |               |
|                                                   v               |
|                                          +----------------+       |
|                                          | imgproxy       |       |
|                                          | :8080          |       |
|                                          +----------------+       |
|                                                                   |
|  +----------------+                                                |
|  | Worker BullMQ  |                                                |
|  | Reseau: nba    |                                                |
|  +----------------+                                                |
|                                                                   |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|                    SERVICES EXTERNES                              |
|  Resend (email) | Sentry (errors) | Telegram Bot | HIBP (pwned) |
+------------------------------------------------------------------+
```

### 5.2 Regles de Firewall

```
Regles d'acces entre les zones :

ZONE PUBLIQUE -> DMZ :
  - ports 443 (HTTPS), 80 (HTTP -> redirect HTTPS)
  - Destination : Traefik (reverse proxy)
  - Source : tout (via Cloudflare)

DMZ -> ZONE INTERNE :
  - Next.js -> Redis : port 6379 (reseau nba)
  - Next.js -> PostgreSQL : port 5432 (via TLS, Neon cloud)
  - Next.js -> MinIO : port 9000 (reseau nba)
  - Socket.IO -> Redis : port 6379 (reseau nba, pub/sub)
  - Worker -> Redis : port 6379 (reseau nba)
  - Worker -> MinIO : port 9000 (reseau nba)
  - Worker -> PostgreSQL : port 5432 (via TLS, Neon cloud)
  - imgproxy -> MinIO : port 9000 (reseau nba)

ZONE INTERNE -> EXTERNE :
  - Next.js -> Resend : HTTPS (TLS)
  - Next.js -> Sentry : HTTPS (TLS)
  - Worker -> Resend : HTTPS (TLS)
  - Worker -> HIBP : HTTPS (TLS)
  - Worker -> Telegram : HTTPS (TLS)
  - Next.js -> OAuth providers : HTTPS (TLS)

BLOQUE :
  - Aucun acces direct Internet vers Redis, PostgreSQL, MinIO
  - Aucun acces sortant vers Internet depuis Redis, PostgreSQL
  - Pas de port 6379, 5432, 9000 exposes sur le reseau public
```

### 5.3 Segmentation Docker

```
Reseau "nba" (interne) :
  - Communication interne entre tous les conteneurs
  - Pas de exposition directe sur Internet
  - DNS interne : nba-redis, nba-minio, worker, nba-imgproxy

Reseau "proxy" (externe) :
  - Reversible proxy Traefik (exterieur)
  - Next.js, Socket.IO, Bull Board exposes via Traefik
  - Traefik fait le pont entre les deux reseaux

Isolation des conteneurs :
  - App : cap_drop ALL, cap_add NET_BIND_SERVICE CHOWN SETUID SETGID
  - Worker : cap_drop ALL, cap_add NET_BIND_SERVICE
  - Security opt : no-new-privileges:true
  - Read-only root filesystem (sauf volumes montes)
  - Resource limits CPU/Memory definies
```

---

## 6. Gestion des Secrets & Certificats

### 6.1 Inventaire des Secrets

| ID | Secret | Utilisation | Stockage | Rotation |
|----|--------|-------------|----------|----------|
| S01 | BETTER_AUTH_SECRET | Signature cookies session | .env / Docker secrets | 90 jours |
| S02 | DATABASE_URL | Connexion PostgreSQL | .env / GitHub Secrets | 90 jours |
| S03 | REDIS_PASSWORD | Auth Redis | .env / Docker secrets | 90 jours |
| S04 | MINIO_ROOT_USER | Auth MinIO | .env | 90 jours |
| S05 | MINIO_ROOT_PASSWORD | Auth MinIO | .env | 90 jours |
| S06 | RESEND_API_KEY | Envoi emails | .env / GitHub Secrets | 180 jours |
| S07 | GOOGLE_CLIENT_ID | OAuth Google | .env | 365 jours |
| S08 | GOOGLE_CLIENT_SECRET | OAuth Google | .env / GitHub Secrets | 90 jours |
| S09 | DISCORD_CLIENT_ID | OAuth Discord | .env | 365 jours |
| S10 | DISCORD_CLIENT_SECRET | OAuth Discord | .env / GitHub Secrets | 90 jours |
| S11 | TELEGRAM_BOT_TOKEN | Bot Telegram | .env / GitHub Secrets | 180 jours |
| S12 | IMGPROXY_KEY | Signature images | .env | 90 jours |
| S13 | IMGPROXY_SALT | Signature images | .env | 90 jours |
| S14 | VAPID_PRIVATE_KEY | Web Push notifications | .env | 180 jours |
| S15 | SENTRY_DSN | Monitoring erreurs | .env | 365 jours |
| S16 | CLOUDFLARE_API_TOKEN | API Cloudflare | .env / GitHub Secrets | 90 jours |
| S17 | TOKEN_ENCRYPTION_KEY | Chiffrement tokens OAuth | .env | 90 jours |
| S18 | RESEND_WEBHOOK_SECRET | Verification webhooks Resend | .env | 90 jours |
| S19 | TELEGRAM_WEBHOOK_SECRET | Verification webhooks Telegram | .env | 90 jours |

### 6.2 Cycle de Vie des Secrets

```
+----------+     +----------+     +----------+     +----------+     +----------+
| Creation |---->| Stockage |---->| Injection|---->| Rotation |---->| Revocation|
+----------+     +----------+     +----------+     +----------+     +----------+
     |               |               |               |               |
     v               v               v               v               v
  openssl rand    GitHub        Variables      Tous les 90     Ancien secret
  -hex 32         Secrets /     d'environnement jours max       desactive apres
  ou generate     Docker        au demarrage                    24h de grace
  password        secrets       du conteneur
```

### 6.3 Certificats TLS

```
Terminaison TLS :
  - Edge : Cloudflare (certificat automatique)
  - Reverse Proxy : Traefik avec Let's Encrypt

Certificats Let's Encrypt (Traefik) :
  - Domaine : access.signauxx.com
  - Provider : Let's Encrypt (ACME)
  - Resolution : DNS-01 ou HTTP-01
  - Renouvellement : Automatique (Traefik)
  - Stockage : /letsencrypt/acme.json (Docker volume)

Certificats internes (optionnel, pour Redis TLS) :
  - Auto-signe ou via CA interne
  - Rotation : 1 an
  - Stockage : volume Docker monte

HSTS :
  - max-age=31536000 (1 an)
  - includeSubDomains
  - preload (a soumettre)
```

---

## 7. Architecture Redis

### 7.1 Topologie Redis

```
+------------------------------------------------------------------+
|                     REDIS / VALKEY ARCHITECTURE                  |
+------------------------------------------------------------------+
|                                                                   |
|  Instance unique : nba-redis (Valkey 8, Alpine)                  |
|  Port : 6379                                                      |
|  Reseau : nba (interne Docker) - PAS d'exposition publique       |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |  USAGE PAR COMPOSANT                                        |  |
|  |                                                              |  |
|  |  Next.js App :                                               |  |
|  |    - Rate limiting (sliding window sorted sets)              |  |
|  |    - Session cache (TTL: 7 jours)                           |  |
|  |    - Session blacklist (TTL: 7 jours)                       |  |
|  |    - Device fingerprint cache (TTL: 1h)                     |  |
|  |    - IP reputation cache (TTL: 1h)                          |  |
|  |    - ML inference cache (TTL: 5min)                         |  |
|  |    - Abuse detection counters (TTL: 60-600s)                |  |
|  |    - Behavioral profile cache (TTL: 1h)                     |  |
|  |                                                              |  |
|  |  Worker BullMQ :                                             |  |
|  |    - Queue: risk:async (BullMQ)                              |  |
|  |    - Queue: email (BullMQ)                                   |  |
|  |    - Queue: notification (BullMQ)                            |  |
|  |    - Dead letter queues (3 echecs max)                       |  |
|  |                                                              |  |
|  |  Socket.IO Worker :                                          |  |
|  |    - Pub/Sub (Redis adapter pour broadcast multi-instance)   |  |
|  |    - Presence tracking                                     |  |
|  |                                                              |  |
|  |  Bull Board :                                                |  |
|  |    - Lecture seule des queues et jobs                        |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 7.2 Securite Redis

```
REQU-001 [OBLIGATOIRE] Password AUTH configure :
         valkey-server --requirepass ${REDIS_PASSWORD}

REQU-002 [OBLIGATOIRE] Bind sur 0.0.0.0 UNIQUEMENT sur le
         reseau Docker interne, PAS sur le reseau public.

REQU-003 [HAUTE] TLS active en production (TLS_PORT 6380).

REQU-004 [OBLIGATOIRE] Commandes dangereuses desactivees :
         RENAME_COMMAND FLUSHALL ""
         RENAME_COMMAND FLUSHDB ""
         RENAME_COMMAND CONFIG ""
         RENAME_COMMAND EVAL ""  (si pas de scripts Lua)

REQU-005 [OBLIGATOIRE] TTL obligatoire sur toutes les cles :
         - Pas de cles sans expiration
         - Exception : monitoring:metrics (ecrase periodiquement)

REQU-006 [OBLIGATOIRE] Persistence :
         - RDB : save 60 1 (toutes les 60s si 1+ changement)
         - AOF : appendonly yes

REQU-007 [OBLIGATOIRE] Resource limits :
         - maxmemory: 200MB
         - maxmemory-policy: allkeys-lru
         - CPU: 0.5 coeur
```

### 7.3 Toutes les Cles Redis

| Cle Redis | Type | TTL | Utilisateur | Description |
|-----------|------|:---:|-------------|-------------|
| `ratelimit:sw:{key}` | Sorted Set | 60-3600s | App, Worker | Sliding window rate limit |
| `session:{id}` | String | 7 jours | App | Cache session |
| `session:token:{token}` | String | 5 min | App, WS | Session token lookup |
| `blacklist:session:{id}` | String | 7 jours | App | Blacklist sessions revoquees |
| `fp:{hash}` | String | 1h | App | Device fingerprint cache |
| `iprep:{ip}` | String | 1h | App, Worker | IP reputation cache |
| `ml:inf:{hash}` | String | 5 min | App | ML inference cache |
| `profile:{userId}` | String | 1h | App, Worker | Behavioral profile |
| `pwned:{prefix}` | String | 1h | App | HIBP range cache |
| `abuse:{type}:{ip}:{min}` | String | 120s | App | Abuse detection counters |
| `cs:ip:{ip}` | Sorted Set | 120s | App | Credential stuffing IP |
| `cs:email:{email}` | Sorted Set | 120s | App | Credential stuffing email |
| `bf:ip:{ip}` | String | 300s | App | Brute force IP |
| `bf:user:{email}` | String | 300s | App | Brute force user |
| `enum:{ip}` | Set | 600s | App | Account enumeration |
| `api:{cat}:{id}` | Sorted Set | 60s | App | API abuse |
| `velocity:{userId}` | Sorted Set | 3600s | Worker | Login velocity |
| `risk:decision:{fp}:{ip}` | String | 60s | App | Sync risk decision |
| `risk:async:{sessionId}` | String | 86400s | Worker | Async risk result |
| `blocklist:ip` | Set | 3600s | App | IP blocklist |
| `bull:risk:async:*` | BullMQ | - | Worker | Queue jobs |
| `bull:email:*` | BullMQ | - | Worker | Email queue |
| `bull:notification:*` | BullMQ | - | Worker | Notification queue |
| `monitoring:metrics` | String | - | Worker | Dernieres metriques |
| `ws:presence:{userId}` | Set | 30 min | WS | Presence WebSocket |
| `ws:socket:{socketId}` | String | 1h | WS | Socket metadata |

---

## 8. Architecture PostgreSQL

### 8.1 Topologie PostgreSQL

```
+------------------------------------------------------------------+
|                  POSTGRESQL ARCHITECTURE (NEON)                  |
+------------------------------------------------------------------+
|                                                                   |
|  Provider : Neon (PostgreSQL 16, serverless)                     |
|  Connexion : TLS require (sslmode=require)                       |
|  Pool : Prisma connection pool (10-20 connexions)                |
|  Backup : Point-in-time recovery (7 jours)                       |
|  Storage : Chiffrement au repos (AES-256)                        |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |  BASES DE DONNEES                                           |  |
|  |                                                              |  |
|  |  nba_prod (production)                                      |  |
|  |  nba_staging (pre-production)                               |  |
|  |  nba_dev (developpement)                                    |  |
|  |                                                              |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Schemas (via Prisma) :                                           |
|    - public : users, sessions, accounts, verifications            |
|    - public : devices, two_factor_backup_codes, login_attempts   |
|    - public : password_history, audit_logs, security_events      |
|    - public : feedback_labels, model_registry (fraud engine)     |
|                                                                   |
+------------------------------------------------------------------+
```

### 8.2 Securite PostgreSQL

```
REQU-001 [OBLIGATOIRE] TLS obligatoire : sslmode=require.

REQU-002 [OBLIGATOIRE] Mot de passe fort (> 20 caracteres, aleatoire).

REQU-003 [OBLIGATOIRE] IP whitelist Neon (Cloudflare IPs + IP fixe serveur).

REQU-004 [OBLIGATOIRE] Role applicatif avec privileges minimaux :
         - SELECT, INSERT, UPDATE, DELETE sur les tables
         - Pas de CREATE, DROP, ALTER (via Prisma migrations)
         - Pas de superuser

REQU-005 [OBLIGATOIRE] Prisma ORM obligatoire :
         - Pas de raw SQL sauf exception documentee
         - Transactions pour les operations multi-tables

REQU-006 [OBLIGATOIRE] Connection pool :
         - Prisma: 10-20 connexions
         - Timeout: 30 secondes
         - Pas de connexions persistantes inactives

REQU-007 [OBLIGATOIRE] Chiffrement au repos (Neon managed).

REQU-008 [OBLIGATOIRE] Point-in-time recovery (PITR) : 7 jours.

REQU-009 [OBLIGATOIRE] Logs de requetes lentes (> 1 seconde).

REQU-010 [OBLIGATOIRE] Pas d'exposition publique directe.
```

### 8.3 Migrations Prisma

```
Processus de migration securise :

1. Developpement :
   pnpm db:migrate --name ma_migration --create-only
   - Cree le fichier SQL sans l'executer
   - Revue de code obligatoire

2. Review :
   - Verifier les indexes
   - Verifier les contraintes
   - Verifier l'impact performance
   - Verifier les donnees existantes

3. Staging :
   - Executer la migration
   - Verifier les donnees
   - Tester les requetes

4. Production :
   - Backup pre-migration
   - Executer avec pre-verification
   - Feature flag pour rollback
```

---

## 9. Architecture Socket.IO & WebSocket

### 9.1 Architecture de Communication

```
+------------------------------------------------------------------+
|                   SOCKET.IO ARCHITECTURE                          |
+------------------------------------------------------------------+
|                                                                   |
|  Serveur : Worker WebSocket dedie (port 3001)                    |
|  Runtime : tsx workers/websocket.ts via PM2                      |
|  Protocole : WSS (TLS via Traefik)                               |
|  Adapter : @socket.io/redis-adapter (Redis Pub/Sub)              |
|  Version : Socket.IO 4.8                                         |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |  AUTHENTIFICATION WebSocket                                 |  |
|  |                                                              |  |
|  |  1. Client envoie cookie: session_token                     |  |
|  |  2. Worker extrait le cookie du handshake                   |  |
|  |  3. Verification signature HMAC (BETTER_AUTH_SECRET)        |  |
|  |  4. Verification session en base (ou cache Redis)           |  |
|  |  5. Verification compte actif (non suspendu)                |  |
|  |  6. Si OK -> socket join room "user:{userId}"              |  |
|  |  7. Si KO -> erreur "Non authorise"                        |  |
|  |                                                              |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Rooms :                                                         |
|    - user:{userId} : Evenements prives utilisateur               |
|    - session:{sessionId} : Evenements de session                 |
|    - admin:{orgId} : Evenements admin (futur)                    |
|                                                                   |
|  Evenements :                                                     |
|    - signal:created : Nouveau signal trading                     |
|    - notification:new : Nouvelle notification                    |
|    - session:expired : Session expiree                           |
|    - session:revoked : Session revoquee                          |
|    - risk:changed : Score de risque modifie                      |
|                                                                   |
+------------------------------------------------------------------+
```

### 9.2 Securite WebSocket

```
REQU-001 [OBLIGATOIRE] Authentification par cookie HMAC-signe.

REQU-002 [OBLIGATOIRE] Verification session a chaque connexion.

REQU-003 [OBLIGATOIRE] Rate limiting : 10 connexions/min/IP.

REQU-004 [OBLIGATOIRE] Limite de connexions simultanees : 3/user.

REQU-005 [OBLIGATOIRE] Ping/Pong pour detection deconnexion :
         - Ping interval: 10s
         - Ping timeout: 30s

REQU-006 [OBLIGATOIRE] Les evenements entrants sont valides cote serveur
         (ne pas faire confiance au client pour les permissions).

REQU-007 [OBLIGATOIRE] Taille max des messages : 256 KB.

REQU-008 [OBLIGATOIRE] Room join automatique (pas de join arbitraire).

REQU-009 [OBLIGATOIRE] Les tentatives de join sur des rooms non
         autorisees sont loggees comme evenements de securite.

REQU-010 [HAUTE] CORS origine restreinte a l'URL de l'application.
```

### 9.3 Topologie Redis Pub/Sub pour WebSocket

```
WebSocket Worker 1                    Redis                          WebSocket Worker 2
    |                                   |                                   |
    | Publish to channel                |                                   |
    | ws:user:{userId}                  |                                   |
    |---------------------------------->|                                   |
    |                                   | PUBLISH ws:user:{userId} {data}  |
    |                                   |                                   |
    |                                   |---------------------------------->| (si subscribe)
    |                                   |                                   |
    |                                   |                                   |
    |                                   |                                   |
    |<-- Socket.IO emit to client ------|-----------------------------------|

Avantage : Tous les workers recoivent le broadcast
            -> Un client connecte a n'importe quel Worker recoit le message
```

---

## 10. Architecture Better Auth

### 10.1 Architecture des Plugins

```
+------------------------------------------------------------------+
|                    BETTER AUTH ARCHITECTURE                       |
+------------------------------------------------------------------+
|                                                                   |
|  Instance unique : auth = betterAuth({...}) dans src/lib/auth.ts  |
|  Adapter : Prisma (PostgreSQL)                                    |
|  Hooks : databaseHooks (user, session)                            |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |  PLUGIN PIPELINE                                            |  |
|  |                                                              |  |
|  |  Requete entrante                                            |  |
|  |       |                                                      |  |
|  |       v                                                      |  |
|  |  +------------------+                                        |  |
|  |  | nextCookies()    | Gestion cookies HttpOnly Secure        |  |
|  |  +------------------+                                        |  |
|  |       |                                                      |  |
|  |       v                                                      |  |
|  |  +------------------+                                        |  |
|  |  | twoFactor()      | TOTP + Email OTP + Backup Codes       |  |
|  |  +------------------+                                        |  |
|  |       |                                                      |  |
|  |       v                                                      |  |
|  |  +------------------+                                        |  |
|  |  | admin()          | RBAC (SUPER_ADMIN, ADMIN, MEMBER)     |  |
|  |  +------------------+                                        |  |
|  |       |                                                      |  |
|  |       v                                                      |  |
|  |  +------------------+                                        |  |
|  |  | databaseHooks    | Pre/post traitement user & session    |  |
|  |  +------------------+                                        |  |
|  |       |                                                      |  |
|  |       v                                                      |  |
|  |  +------------------+                                        |  |
|  |  | Prisma Adapter   | Persistance PostgreSQL                |  |
|  |  +------------------+                                        |  |
|  |       |                                                      |  |
|  |       v                                                      |  |
|  |  +------------------+                                        |  |
|  |  | Redis Cache     | Session cache, rate limit              |  |
|  |  +------------------+                                        |  |
|  |                                                              |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 10.2 Flux de Decisions Auth

```
                  +-----------------------+
                  |  Requete entrante      |
                  |  (cookie session)      |
                  +-----------+-----------+
                              |
                    +---------v---------+
                    | Cookie Present?    |
                    +---+--------+------+
                   OUI |        | NON
                       v        v
              +-----------+    +------------------+
              | HMAC Verify|    | Redirection login|
              | Signature  |    +------------------+
              +-----+-----+
                    |
             +------v------+
             | Valide?      |
             +---+----+----+
            OUI |    | NON
                v    v
        +-----------+ +------------------+
        | Session   | | Redirection login|
        | Lookup    | | + log tentative  |
        +-----+-----+ | frauduleuse      |
              |       +------------------+
        +-----v------+
        | Existe?     |
        +---+----+----+
        OUI |    | NON
            v    v
    +------------+   +------------------+
    | Device      |   | Redirection login|
    | Verify      |   +------------------+
    | Fingerprint |
    +-----+------+
          |
    +-----v------+
    | Rate Limit  |
    | Check       |
    +-----+------+
          |
    +-----v------+
    | AUTHORIZED  |
    +-------------+
```

---

## 11. Architecture Workers & BullMQ

### 11.1 Files d'Attente

```
+------------------------------------------------------------------+
|                      BULLMQ ARCHITECTURE                          |
+------------------------------------------------------------------+
|                                                                   |
|  Redis backend : nba-redis (6379)                                |
|  Connexion : ioredis avec mot de passe                            |
|                                                                   |
|  +-------------------+     +-------------------+                  |
|  | Queue: risk:async |     | Queue: email       |                  |
|  | Jobs: IP rep,     |     | Jobs: transaction,  |                  |
|  | geo, velocity,    |     | notification,       |                  |
|  | ML inference      |     | welcome            |                  |
|  +-------------------+     +-------------------+                  |
|           |                         |                             |
|           v                         v                             |
|  +-------------------+     +-------------------+                  |
|  | Worker Pool (4)   |     | Worker Pool (2)   |                  |
|  | Concurrency: 4    |     | Concurrency: 2    |                  |
|  | + risk:async      |     | + email           |                  |
|  +-------------------+     +-------------------+                  |
|           |                         |                             |
|           v                         v                             |
|  +-------------------+     +-------------------+                  |
|  | Dead Letter Queue |     | Dead Letter Queue |                  |
|  | (3 retries max)   |     | (3 retries max)   |                  |
|  +-------------------+     +-------------------+                  |
|                                                                   |
+------------------------------------------------------------------+
```

### 11.2 Securite des Jobs

```
REQU-001 [OBLIGATOIRE] Les donnees sensibles dans les jobs sont
         chiffrees (token, IP, userId si sensible).

REQU-002 [OBLIGATOIRE] TTL des jobs : 1 heure max.

REQU-003 [OBLIGATOIRE] 3 tentatives max avant dead letter queue.

REQU-004 [OBLIGATOIRE] Backoff exponentiel : 1s, 5s, 30s.

REQU-005 [OBLIGATOIRE] Worker execute avec privileges minimaux
         (cap_drop ALL, cap_add NET_BIND_SERVICE uniquement).

REQU-006 [OBLIGATOIRE] Les jobs ne manipulent jamais de mots de passe.

REQU-007 [OBLIGATOIRE] Les erreurs des jobs sont loggees sans
         exposer les details sensibles.

REQU-008 [HAUTE] Monitoring des queues :
         - Nombre de jobs en attente
         - Nombre de jobs en echec
         - Temps de traitement moyen
         - Alertes si > 10 jobs en dead letter
```

---

## 12. Architecture Stockage Fichiers

### 12.1 Topologie Stockage

```
+------------------------------------------------------------------+
|                    STOCKAGE FICHIERS ARCHITECTURE                 |
+------------------------------------------------------------------+
|                                                                   |
|  Provider : MinIO (dev/staging), AWS S3 (production)             |
|  Endpoint S3 : nba-minio:9000 (Docker interne)                   |
|  Bucket : nba-storage                                             |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |  TYPES DE FICHIERS                                          |  |
|  |                                                              |  |
|  |  /uploads/avatars/{userId}.{ext}   - Photos de profil        |  |
|  |  /uploads/signals/{signalId}.{ext} - Images de signaux       |  |
|  |  /uploads/kyc/{userId}.{ext}      - Documents KYC           |  |
|  |  /uploads/temp/{uuid}.{ext}       - Uploads temporaires     |  |
|  |  /exports/{userId}/{date}.{ext}   - Export de donnees       |  |
|  |  /models/{name}/{version}.onnx    - Modeles ML (Worker)     |  |
|  |                                                              |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  imgproxy (optimisation) :                                       |
|    - Redimensionnement a la volee                                |
|    - Conversion format (WebP, AVIF)                              |
|    - URLs signees (HMAC)                                         |
|    - Cache local                                                 |
|                                                                   |
+------------------------------------------------------------------+
```

### 12.2 Securite du Stockage

```
REQU-001 [OBLIGATOIRE] Bucket en mode prive (pas d'acces public).

REQU-002 [OBLIGATOIRE] Presigned URLs pour tout acces :
         - Lecture : TTL 1 heure
         - Ecriture : TTL 30 minutes (upload)

REQU-003 [OBLIGATOIRE] Chiffrement serveur (AES-256) :
         - MinIO : SSE-S3 active
         - AWS S3 : SSE-S3 ou SSE-KMS

REQU-004 [OBLIGATOIRE] Validation des uploads :
         - Type MIME verifie (magic bytes)
         - Taille maximale : 10 MB
         - Scan antivirus (ClamAV si disponible)

REQU-005 [OBLIGATOIRE] CORS configure avec liste blanche stricte :
         - Origin : NEXT_PUBLIC_APP_URL uniquement
         - Methods : GET, PUT, POST
         - Headers : Content-Type, Authorization

REQU-006 [OBLIGATOIRE] Versioning du bucket active (retention : 30 jours).

REQU-007 [OBLIGATOIRE] Pas de listage public du bucket.

REQU-008 [OBLIGATOIRE] imgproxy URLs signees (HMAC) :
         - IMGPROXY_KEY + IMGPROXY_SALT
         - Expiration incluse dans l'URL
```

---

## 13. Architecture CDN & Cache

### 13.1 Topologie CDN

```
+------------------------------------------------------------------+
|                     CDN & CACHE ARCHITECTURE                     |
+------------------------------------------------------------------+
|                                                                   |
|  Provider : Cloudflare CDN                                       |
|  Domaine : access.signauxx.com                                   |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |  STRATEGIE DE CACHE                                         |  |
|  |                                                              |  |
|  |  /_next/static/* :                                          |  |
|  |    - Cache-Control: public, max-age=31536000, immutable     |  |
|  |    - Cache Cloudflare : 1 an                                 |  |
|  |    - Ces fichiers ont un hash dans le nom -> jamais changes  |  |
|  |                                                              |  |
|  |  /* (pages HTML) :                                          |  |
|  |    - Cache-Control: no-store, must-revalidate                |  |
|  |    - Pas de cache CDN (car authentifie)                      |  |
|  |                                                              |  |
|  |  /api/* :                                                    |  |
|  |    - Cache-Control: no-store, must-revalidate                |  |
|  |    - Pas de cache CDN (car authentifie)                      |  |
|  |                                                              |  |
|  |  Images (via imgproxy) :                                     |  |
|  |    - Cache-Control: public, max-age=86400                    |  |
|  |    - Cache Cloudflare : 1 jour                               |  |
|  |    - URLs signees                                            |  |
|  |                                                              |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 13.2 Securite du Cache

```
REQU-001 [OBLIGATOIRE] Aucune page authentifiee mise en cache.

REQU-002 [OBLIGATOIRE] Aucune reponse API mise en cache
         (sauf endpoints publics explicites).

REQU-003 [OBLIGATOIRE] Les assets statiques ont des noms versionnes
         (hash dans le nom de fichier).

REQU-004 [HAUTE] Purge du cache CDN automatique a chaque deploiement.

REQU-005 [OBLIGATOIRE] Pas de mise en cache des donnees sensibles
         dans les cookies, headers, ou URLs.
```

---

## 14. Architecture Observabilite

### 14.1 Stack d'Observabilite

```
+------------------------------------------------------------------+
|                   OBSERVABILITE ARCHITECTURE                      |
+------------------------------------------------------------------+
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  | LOGGING        |  | METRICS        |  | TRACING        |       |
|  | Pino -> Loki   |  | Prometheus     |  | OpenTelemetry  |       |
|  | (structure)    |  | (custom)       |  | (futur)        |       |
|  +-------+--------+  +-------+--------+  +-------+--------+       |
|          |                   |                   |                 |
|          v                   v                   v                 |
|  +-------------------------------------------------------------+  |
|  |                        GRAFANA                              |  |
|  |  Dashboards : Auth Health, Security, Session, Redis         |  |
|  |  Alerting : PagerDuty, Slack, Email                         |  |
|  +-------------------------------------------------------------+  |
|          |                                                        |
|          v                                                        |
|  +-------------------------------------------------------------+  |
|  |                        SENTRY                                |  |
|  |  Erreurs applicatives, breadcrumbs, performance              |  |
|  |  - Traces sample rate: 0.2                                  |  |
|  |  - Pas de cookies/tokens dans les events                    |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 14.2 Evenements de Securite (SecurityEvent)

```
Modele de donnees :

interface SecurityEvent {
  id: string
  userId: string
  type: SecurityEventType   // LOGIN_SUCCESS, LOGIN_FAILED, etc.
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  ipAddress: string
  userAgent: string
  metadata: Record<string, unknown>  // donnees contextuelles
  createdAt: Date
}

Evenements audites :
  - LOGIN_SUCCESS, LOGIN_FAILED
  - SESSION_CREATED, SESSION_REVOKED
  - HIGH_RISK_SYNC, HIGH_RISK_ASYNC
  - CREDENTIAL_STUFFING, BRUTE_FORCE
  - SESSION_HIJACK_ATTEMPT
  - TWO_FACTOR_ENABLED, TWO_FACTOR_DISABLED
  - PASSWORD_CHANGED, PASSWORD_RESET
  - ACCOUNT_SUSPENDED, ACCOUNT_DELETED
  - API_ABUSE, SCRAPING_DETECTED

Voir : MASTER_SECURITY_EVENTS.md pour la taxonomie complete
```

---

## 15. Matrice de Confiance Inter-Composants

### 15.1 Niveaux de Confiance

| Composant | Niveau Confiance | Justification |
|-----------|:----------------:|---------------|
| Navigateur | NON-FIABLE | Peut etre compromis, injecte code malveillant |
| Cloudflare | PARTIELLEMENT FIABLE | WAF et TLS, mais peut etre contourne (si compromis) |
| Traefik | HAUTEMENT FIABLE | Controle total, TLS termination |
| Next.js App | HAUTEMENT FIABLE | Coeur applicatif, mais expose aux attaques |
| Socket.IO Worker | HAUTEMENT FIABLE | Traite les connexions WebSocket |
| Worker BullMQ | HAUTEMENT FIABLE | Traite les jobs asynchrones |
| Redis | FIABLE | Donnees temporaires, reseau interne |
| PostgreSQL | FIABLE | Donnees persistantes, reseau interne |
| MinIO/S3 | FIABLE | Stockage fichiers, reseau interne |
| imgproxy | FIABLE | Traitement images, reseau interne |
| Bull Board | MOYENNEMENT FIABLE | Dashboard admin, restreint |

### 15.2 Verification de Confiance

```
Chaque transition entre zones de confiance implique :

Zone Publique -> Zone DMZ :
  - Verification : WAF, TLS, rate limiting
  - Echec : 403 (block WAF), 429 (rate limit), 401 (non auth)

Zone DMZ -> Zone Interne :
  - Verification : Mot de passe Redis, TLS PostgreSQL, HMAC MinIO
  - Echec : Connexion refuse, timeout

Zone Interne -> Services Externes :
  - Verification : TLS, API key, signature webhook
  - Echec : 401, 403, timeout
```

---

## 16. Plans de Secours & Degradation

### 16.1 Modes Degrades

| Service | Mode Normal | Mode Degrade | Mode Echec |
|---------|-------------|--------------|------------|
| Redis | Cache, rate limit, queues | Fallback local LRU (rate limit) | Auth sans cache, rate limit base sur IP |
| PostgreSQL | Donnees persistantes | Read replica (si disponible) | Page maintenance |
| MinIO/S3 | Stockage fichiers | Stockage local (volume Docker) | Upload impossible |
| Cloudflare | WAF, CDN, TLS | Traefik direct | TLS via Traefik uniquement |
| Sentry | Monitoring erreurs | Fallback logger console | Erreurs non remontees |
| Better Auth | Auth complete | Session cookie uniquement | Login desactive |
| Socket.IO | Temps reel | Polling HTTP (fallback Socket.IO) | Notifications desactivees |

### 16.2 Kill Switches

```
Variables d'environnement pour desactivation rapide :

DISABLE_NEW_AUTH=true        -> Retour a l'ancien systeme d'auth
MAINTENANCE_MODE=true        -> Page maintenance (sauf webhooks)
WS_ENABLED=false             -> Desactiver WebSocket
QUEUE_ENABLED=false          -> Desactiver jobs asynchrones
SENTRY_DSN=""                -> Desactiver Sentry
REDIS_URL=""                 -> Mode sans Redis (fallback local)
```

### 16.3 Circuit Breakers

```
Pour les appels externes :

Resend (email) :
  - Timeout: 10s
  - Retry: 3 fois (1s, 5s, 15s)
  - Circuit breaker: 5 echecs -> 30s de pause

HIBP (pwned password) :
  - Timeout: 3s
  - Cache Redis: 1h
  - Echec: mot de passe autorise (fallback ouvert)

Telegram API :
  - Timeout: 5s
  - TELEGRAM_ENABLED=false si indisponible
  - Fallback: notification email uniquement

OAuth Providers :
  - Timeout: 10s
  - Fallback: login email/password uniquement
  - Rate limit: 10 requetes/min/API key
```

---

> **Fin du document MASTER_SECURITY_ARCHITECTURE.md**  
> **Version 1.0.0 — 2026-07-22**  
> **Prochaine revision : trimestrielle**  
> **Documents relies** : `MASTER_SECURITY_REQUIREMENTS.md`, `MASTER_ZERO_TRUST_SECURITY.md`, `MASTER_IMPLEMENTATION_GUIDE.md`
