# Audit de Sécurité — Master Prompts

> Neuf prompts spécialisés pour auditer chaque couche de sécurité de la plateforme NBA (NeverBrokeAgain).

---

## 1. Authentification & Sessions

```
Audite la sécurité de l'authentification Better Auth dans ce codebase.

Vérifie point par point :
- Configuration du rate limiting (brute force)
- Sécurité des tokens de session (httpOnly, secure, sameSite)
- Timeout des sessions et refresh token rotation
- Protection contre l'enumeration d'emails
- Vérification email — force-t-on l'utilisateur à vérifier avant d'accéder ?
- Rate limiting sur forgot-password / reset-password
- CSRF protection sur les mutations auth
- Les sessions sont-elles invalidées après changement de mot de passe ?
- Device verification — est-ce contournable ?

Fichiers clés : src/lib/auth.ts, src/lib/auth-client.ts,
src/middleware.ts, src/app/(auth)/**
```

---

## 2. Contrôle d'accès & RBAC

```
Audite le système de rôles et permissions (RBAC).

Vérifie :
- Chaque route API vérifie-t-elle les permissions avant d'exécuter ?
- Y a-t-il des routes admin accessibles sans vérification de rôle ?
- Les permissions sont-elles vérifiées côté serveur (pas seulement côté client) ?
- Un utilisateur peut-il accéder à des signaux d'un plan supérieur au sien ?
- Le middleware.ts protège-t-il toutes les routes sensibles ?
- Y a-t-il des failles d'accès horizontal (utilisateur A voit les données de B) ?
- Les webhooks / callbacks ont-ils une authentification ?

Fichiers clés : src/lib/auth.ts, src/middleware.ts,
src/app/api/admin/**, src/lib/services/access.ts
```

---

## 3. Upload de fichiers (KYC & Broker)

```
Audite la sécurité du système d'upload de fichiers.

Vérifie :
- Validation du type MIME côté SERVEUR (pas seulement côté client)
- Scan de contenu (magic bytes) pour vérifier le vrai type du fichier
- Limitation de taille de fichier
- Sanitization du nom de fichier (path traversal : ../../../etc/passwd)
- Les fichiers sont-ils stockés hors du répertoire public ?
- Accès aux fichiers — sont-ils protégés par authentification ?
- Suppression sécurisée des fichiers après validation/rejet
- Risque de stockage illimité (disk flood)
- Les images SVG sont-elles acceptées ? (risque XSS)
- Les fichiers sont-ils servis avec le bon Content-Type ?

Fichiers clés : src/app/api/onboarding/kyc/**,
src/app/api/onboarding/broker/**,
src/app/api/files/**, src/lib/storage/**
```

---

## 4. API & Input Validation

```
Audite la validation des entrées et la sécurité des API.

Vérifie :
- Toutes les entrées utilisateur passent-elles par Zod ?
- Les schémas Zod sont-ils assez stricts ? (pas de .passthrough() oublié)
- Y a-t-il des paramètres d'URL non validés (params, query strings) ?
- Les IDs sont-ils validés (format UUID) avant requête Prisma ?
- Protection contre les requêtes trop grosses (body limit) ?
- Pagination — y a-t-il une limite pour éviter le data scraping ?
- Les mutations sont-elles protégées contre la double soumission ?
- Les tokens API / secrets sont-ils exposés dans des réponses ?
- Gestion des erreurs — est-ce qu'on leak des infos sensibles (stack trace) ?

Fichiers clés : src/app/api/**,
src/lib/validations/**, src/lib/services/**
```

---

## 5. Prisma & Base de données

```
Audite la sécurité de la couche base de données.

Vérifie :
- Y a-t-il des requêtes Prisma brutes ($queryRaw) non sécurisées ?
- Les relations Prisma sont-elles protégées contre l'accès non autorisé ?
- Les soft deletes sont-ils cohérents partout ? (deletedAt check systématique ?)
- Les mots de passe sont-ils bien hashés (Better Auth le fait-il correctement ?)
- Les données sensibles (KYC, documents) sont-elles chiffrées au repos ?
- Le schéma expose-t-il des données inutilement (ex: relations incluses par défaut) ?
- Y a-t-il des migrations qui pourraient exposer des données ?
- Le principe de moindre privilège est-il appliqué dans les queries Prisma (select: {}) ?

Fichiers clés : prisma/schema.prisma,
src/lib/services/**, src/app/api/**
```

---

## 6. Infrastructure & Headers

```
Audite la sécurité de l'infrastructure et de la configuration.

Vérifie :
- Headers de sécurité HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- next.config.ts — y a-t-il des configs dangereuses (poweredByHeader, etc.) ?
- Docker — l'image tourne-t-elle en root ? Y a-t-il des ports exposés inutilement ?
- Variables d'environnement — .env.example expose-t-il des noms de secrets ?
- Le Dockerfile suit-il les bonnes pratiques (multi-stage, non-root user) ?
- Versions des dépendances — y a-t-il des CVEs connues ?
- Redis exposé en localhost seulement ?
- CSRF — est-il configuré dans Better Auth ?
- Trusted origins — sont-elles correctement configurées ?

Fichiers clés : next.config.ts, compose.yml,
.env.example, src/lib/auth.ts, Dockerfile, compose.yml
```

---

## 7. Logging & Audit

```
Audite la fiabilité et la sécurité du système d'audit.

Vérifie :
- Toutes les actions critiques sont-elles loggées ?
  (connexion, échec connexion, changement rôle, upload KYC,
   validation/rejet KYC, publication signal, modification signal)
- Les logs contiennent-ils des données sensibles (mots de passe, tokens) ?
- Les logs sont-ils infalsifiables ? (append-only, horodatés)
- L'horodatage est-il fiable (timezone UTC + offset) ?
- Un administrateur peut-il modifier/supprimer des logs ?
- Y a-t-il une protection contre le flood de logs ?
- Les IPs sont-elles loggées pour les actions sensibles ?

Fichiers clés : src/lib/services/audit.ts,
src/lib/services/signal.ts, prisma/schema.prisma
```

---

## 8. Business Logic & Signaux

```
Audite la sécurité métier spécifique aux signaux de trading.

Vérifie :
- Un utilisateur non autorisé peut-il accéder à un signal payant ?
- Un utilisateur peut-il partager un signal en dehors de la plateforme ?
- Y a-t-il une protection anti-scraping ?
- Les signal IDs sont-ils prévisibles (UUID vs incrémental) ?
- Le flux de publication est-il sécurisé (DRAFT → vérification → PUBLISHED) ?
- Un utilisateur peut-il modifier/supprimer un signal qui n'est pas le sien ?
- L'audience ciblée est-elle correctement filtrée à la diffusion ?
- Un signal programmé (scheduledAt) peut-il être publié hors délai ?

Fichiers clés : src/lib/services/signal.ts,
src/app/api/signals/**, workers/queue.ts,
prisma/schema.prisma (modèles Signal, SignalAudience, SignalRead)
```

---

## 9. Dépendances & Supply Chain

```
Audite la sécurité des dépendances et de la supply chain.

Vérifie :
- Y a-t-il des dépendances avec des CVEs connues ? (npm audit / pnpm audit)
- Les versions sont-elles épinglées ou flottantes (^) ?
- Y a-t-il des scripts postinstall dangereux ?
- Les permissions npm sont-elles minimales ?
- Les CI/CD pipelines ont-ils des secrets exposés ?
- Les actions GitHub utilisées sont-elles pinnées par hash ?
- Y a-t-il des fichiers de configuration dangereux (.npmrc, .gitignore manquant) ?
- Les dépendances de développement sont-elles exclues du build de production ?

Fichiers clés : package.json, pnpm-lock.yaml,
.github/workflows/**, Dockerfile
```
