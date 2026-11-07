# Revue de sécurité — SignauxX

> **Date** : 7 novembre 2026
> **Périmètre** : dépendances npm, code applicatif, authentification, uploads, emails, rate limiting.
> **Objectif** : corriger les vulnérabilités signalées par Dependabot / `pnpm audit`.

---

## 1. Résultat

| Indicateur | Avant | Après |
|---|---:|---:|
| Avis de sécurité (`pnpm audit`) | **101** | **1** |
| Critiques | **9** | **0** |
| Élevés | **40** | **0** |
| Modérés | **38** | **0** |
| Faibles | **14** | **1** |

La seule vulnérabilité restante est **`deepmerge@4.3.1`** (faible, pas de version corrigée disponible). Elle provient de `swagger-ui-react` → `swagger-client`, utilisé uniquement dans la **console développeur SUPER_ADMIN** pour afficher la spécification OpenAPI locale. L'exposition est donc très limitée.

---

## 2. Dépendances mises à jour

| Paquet | Avant | Après | Raison |
|---|---|---|---|
| `next` | 16.2.12 | **16.4.5** | Plusieurs RCE critiques (Image Optimization, `next/og`, `use cache`), SSRF, DoS |
| `@sentry/nextjs` | 10.63.0 | **10.78.0** | Contournement de middleware via la route tunnel |
| `better-auth` | 1.6.23 | **1.7.18** | Prise de contrôle de compte via OAuth state / magic link |
| `zod` | 4.4.3 | **4.6.7** | Épuisement mémoire sur collections contraintes |
| `vitest` | 4.1.9 | **4.1.12** | Path traversal / code injection via `@vitest/mocker` |
| `@vitest/coverage-v8` | 4.1.10 | **4.1.12** | Alignement Vitest |
| `eslint-config-next` | 16.2.12 | **16.4.5** | Alignement Next.js |
| `@nba/design-system` (peer `next`) | `^16.2.11` | **`^16.4.5`** | Supprime la copie vulnérable `next@16.2.12` du workspace |

---

## 3. Overrides de sécurité ajoutés

Ces overrides forcent les versions corrigées des dépendances transitives :

```json
{
  "sharp": "0.35.5",
  "fast-uri@<3.1.9": "3.1.9",
  "ip-address@<10.7.6": "10.7.6",
  "dompurify@<3.4.17": "3.4.17",
  "proxy-addr@<2.0.8": "2.0.8",
  "body-parser@<2.4.0": "2.4.0",
  "qs@<6.16.1": "6.16.1",
  "engine.io@<6.6.11": "6.6.11",
  "axios@<1.21.0": "1.21.0",
  "follow-redirects@<1.16.2": "1.16.2",
  "js-yaml@>=4.0.0 <4.3.2": "4.3.2",
  "smol-toml@<1.9.0": "1.9.0",
  "deepmerge-ts@<8.0.0": "8.0.0",
  "basic-ftp@<6.2.1": "6.2.1",
  "mysql2@<3.23.1": "3.23.1",
  "source-map-js@<1.2.2": "1.2.2",
  "fast-copy@<4.1.0": "4.1.0",
  "glob@<14.0.2": "14.0.2",
  "vite@<8.1.6": "8.1.6",
  "@vitest/mocker@<4.1.12": "4.1.12",
  "undici@>=7.0.0 <7.30.1": "7.30.1",
  "undici@>=8.0.0": ">=8.12.4",
  "minimatch@>=7.0.0 <11.0.1": "11.0.5",
  "brace-expansion@>=4.0.0 <5.0.12": "5.0.12"
}
```

> Les overrides sont **ciblés par plage de versions** pour ne pas casser les anciennes API (ex. `minimatch@3` utilisé par ESLint, `brace-expansion@1` utilisé par `minimatch@3`).

---

## 4. Corrections dans le code

### 4.1 Injection HTML dans les emails

**Fichier** : `src/lib/email.ts`

Ajout de deux helpers :

- `escapeHtml(value)` : échappe `& < > " '`.
- `sanitizeEmailSubject(value)` : supprime les retours à la ligne et limite la longueur.

Application aux champs contrôlés par l'utilisateur :

- nom / email du demandeur d'accès ;
- nom / email / sujet / message des tickets support ;
- nom / email / titre / description / étapes / contexte des bugs ;
- nom / email des nouveaux inscrits ;
- nom d'appareil, navigateur, OS, IP, localisation ;
- motif de rejet KYC / broker / accès ;
- nom du plan ;
- nouvelle adresse email.

**Fichier** : `src/app/api/admin/notifications/route.ts`

Les notifications système construisaient leur HTML par concaténation :

```ts
html: `<p>Bonjour ${user.name},</p><p>${content}</p>`
```

Désormais échappé via `escapeHtml` + sujet nettoyé via `sanitizeEmailSubject`.

### 4.2 Rate limiting fail-closed

**Fichier** : `src/lib/rate-limit.ts`

Avant : si Redis était configuré mais indisponible, le limiteur **laissait tout passer** (fail-open), ce qui désactivait silencieusement la protection contre le brute-force.

Après :

- Redis non configuré (dev/tests) → pas de blocage.
- Redis configuré mais en erreur → **503 fail-closed** (`unavailable: true`).
- Les routes concernées renvoient 503 au lieu de 429 quand le service est indisponible.

### 4.3 Limite d'inscription

**Fichiers** : `src/app/api/auth/sign-up/email/route.ts`, `src/lib/auth.ts`

- Ajout d'un rate limit dédié : **10 inscriptions / heure / IP**.
- Better Auth : `"/sign-up/email"` passe de **100/heure** à **10/heure**.

### 4.4 Timeout des tests UI

**Fichiers** : `vitest.config.ts`, `src/app/(auth)/register/register.test.tsx`

Les tests `userEvent` + jsdom dépassaient 15 s sur un runner chargé (le test d'inscription prend ~100-160 s pour 16 tests). Timeout global porté à **45 s par test** et **60 s par hook**, et le timeout spécifique de `sends select-plan request after successful signup` passe de **10 s à 45 s**, sans masquer un blocage réel.

### 4.5 Captcha : secret par défaut et collision de tokens

**Fichier** : `src/lib/captcha.ts`

Deux problèmes corrigés :

1. **Secret par défaut connu** : `"nba-captcha-default-secret-change-me"` était utilisé si `CAPTCHA_SECRET` était absent, ce qui permettait de forger des tokens. Désormais un secret éphémère aléatoire est généré au démarrage et un avertissement explicite est loggé. `CAPTCHA_SECRET` a été ajouté à `.env.example`.
2. **Collision de tokens** : deux captchas générés dans la même milliseconde avec la même réponse produisaient le même token. Ajout d'un **nonce aléatoire de 8 caractères** dans le token et dans le hash.

Le test `captcha.test.ts` (6 tests) passe désormais de façon déterministe.

### 4.6 Origines CSRF

**Fichier** : `src/lib/csrf.ts`

Suppression d'une origine codée en dur `https://access.signaux.com` (faute de frappe : un seul `x`), qui pouvait être enregistrée par un tiers et acceptée comme origine de confiance si `NEXT_PUBLIC_APP_URL` n'était pas défini. Seules l'URL d'application configurée, `access.signauxx.com` et l'URL Vercel sont désormais autorisées.

### 4.7 Console développeur : fuite de variables sensibles

**Fichier** : `src/app/api/admin/env/route.ts`

`DATABASE_URL`, `REDIS_URL` et les endpoints contenant des identifiants n'étaient pas masqués (la liste ne testait que `SECRET`, `PASSWORD`, `TOKEN`, etc.). Un SUPER_ADMIN compromis pouvait donc lire les chaînes de connexion complètes.

Correction :

- ajout de `URL`, `URI`, `CONNECTION`, `HOST`, `ENDPOINT`, `USER` à la liste des clés masquées ;
- détection des valeurs de type `scheme://user:password@host` via une regex ;
- les valeurs sensibles restent affichées comme `••••••••`, avec seulement leur longueur.

---

## 5. Vérifications

| Vérification | Résultat |
|---|---|
| `pnpm audit` | **1 low**, 0 critical/high/moderate |
| `pnpm typecheck` | ✅ OK |
| Suite complète `pnpm test` | ✅ **35 fichiers, 238 tests passés, 12 skipped** |
| Tests sécurité (`src/lib/security`) | ✅ **51 tests passés** |
| Tests captcha (`captcha.test.ts`) | ✅ **6 tests passés** |
| Tests helpers email (`email.security.test.ts`) | ✅ **2 tests passés** |
| Test inscription (`register.test.tsx`, 45 s) | ✅ **16 tests passés** |
| `prisma validate` | ✅ OK |
| `prisma generate` | ✅ OK |
| `pm2 --version` | ✅ 7.0.3 |
| `swagger-ui-react` (require) | ✅ OK |
| `pnpm build` | Compilation ✅ (9,9 min), commande interrompue par le timeout du shell pendant la phase TypeScript ; `tsc --noEmit` passe séparément |
| Lint ciblé sur les fichiers modifiés | ✅ 0 erreur (3 warnings préexistants) |
| Lint global | ⚠️ 579 erreurs préexistantes (dette de code, non introduite par cette revue) |

---

## 6. Risques résiduels

| Risque | Niveau | Commentaire |
|---|---|---|
| `deepmerge@4.3.1` | Faible | Pas de patch disponible ; via `swagger-ui-react`, console SUPER_ADMIN, spec OpenAPI locale |
| `swagger-ui-react` peers React 19 | Faible | Warning de peer dependency, préexistant |
| Rate limiting fail-closed | Opérationnel | Si Redis tombe, les routes limitées renvoient 503 ; comportement voulu |
| `middleware` déprécié par Next 16.4.5 | Faible | Migration vers `proxy` à planifier, pas une vulnérabilité |
| Secrets `.env` | Élevé si exposés | `.env` est gitignoré et n'a pas été trouvé dans l'historique. En cas de doute, **rotationner** `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD`, `CLOUDFLARE_API_TOKEN` |
| `CAPTCHA_SECRET` absent en production | Faible | Un secret stable est dérivé de `BETTER_AUTH_SECRET` (ou éphémère si absent). **Définir un `CAPTCHA_SECRET` dédié est recommandé.** |
| Dette de lint | Faible | 579 erreurs préexistantes, à traiter séparément |

---

## 7. Commandes de contrôle

```bash
pnpm audit
pnpm typecheck
pnpm test
pnpm exec prisma validate
pnpm exec vitest run src/lib/security
```

---

## 8. Recommandations

1. **CI** : rendre `pnpm audit --audit-level=high` bloquant.
2. **Dependabot** : activer les PR automatiques pour les patches de sécurité.
3. **Secrets** : vérifier que `.env` n'est jamais copié dans une image Docker ou un artefact CI.
4. **Next.js** : planifier la migration `middleware` → `proxy` (dépréciation Next 16.4.5).
5. **Swagger UI** : envisager une page statique OpenAPI ou un rendu hors production pour supprimer `swagger-ui-react` et donc `deepmerge`.
6. **Tests** : conserver les timeouts élevés pour les tests UI, ou passer à un runner plus rapide.
