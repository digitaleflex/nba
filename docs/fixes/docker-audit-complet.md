# Audit Complet Docker - Tous les Problèmes Identifiés

**Date:** 2026-07-02
**Scope:** Dockerfile, compose.yml, entrypoints, configuration pnpm/Prisma
**Statut:** 🔴 2 problèmes critiques, plusieurs améliorations nécessaires

---

## 🔴 CRITIQUE #1 : Contexte de build de 1.39 GB (RÉSOLU ✅)

**Symptôme:** `transferring context: 1.39GB` prenant plus de 12 minutes.

**Cause:** Absence de fichier `.dockerignore`. Docker copiait tout le projet, y compris `node_modules/`, `.next/`, `.git/`.

**Statut:** ✅ Corrigé par la création de `.dockerignore` (commit `254975b`).

**Action restante:** Compléter le `.dockerignore` avec les dossiers d'outils qui traînent à la racine (voir MOYEN #6).

---

## 🔴 CRITIQUE #2 : Le conteneur `app` (runner) n'a PAS de `node_modules`

**C'est le bug le plus grave et il n'a pas encore été corrigé.**

### Le problème

Regardez le stage `runner` du `Dockerfile` (lignes 30-68) : il ne copie **jamais** `node_modules` complet. Il copie seulement :

```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
...
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
```

Le dossier `.next/standalone` contient bien un `node_modules` minimal, **mais seulement les dépendances de production tracées par le bundler Next.js** (ce qui est réellement `import`é dans le code serveur).

Or, `docker-entrypoint.sh` exécute au démarrage :

```sh
pnpm prisma migrate deploy        # ← nécessite le CLI `prisma` (devDependency)
pnpm db:seed                      # ← exécute `tsx scripts/seed.ts` (tsx = devDependency)
pnpm tsx scripts/createAdmin.ts   # ← nécessite `tsx` aussi
```

**`prisma`** (le CLI) et **`tsx`** sont dans `devDependencies` dans `package.json`. Ils ne sont **jamais importés** dans le code applicatif (seulement exécutés en ligne de commande), donc le traceur standalone de Next.js **ne les inclut pas**.

### Pourquoi ça n'a pas encore explosé au visage

Le commentaire ligne 57 du Dockerfile dit :
```dockerfile
# Copy pnpm-lock and package.json for pnpm install at runtime
```

Cela indique clairement qu'un `pnpm install` était censé s'exécuter au runtime — **mais cette commande n'existe nulle part** (ni dans le Dockerfile, ni dans `docker-entrypoint.sh`). C'est un oubli/régression.

### Impact réel

Au démarrage du conteneur `app`, `docker-entrypoint.sh` va planter à la ligne `pnpm prisma migrate deploy` avec une erreur du type `command not found` ou `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT`, **empêchant l'application de démarrer**.

### Solution recommandée

Deux options :

**Option A (recommandée) — Copier `node_modules` complet dans le runner:**
```dockerfile
FROM base AS runner
...
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/design-system/node_modules ./packages/design-system/node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
...
```
➕ Simple, fiable, garantit que `prisma` et `tsx` sont disponibles.
➖ Image un peu plus lourde (mais pas dramatique avec le hoisting).

**Option B — `pnpm install --prod` + installer prisma/tsx explicitement au runtime**

Plus complexe et plus lent au démarrage (réinstallation à chaque démarrage de conteneur). **Non recommandé.**

➡️ **Je recommande l'option A.** Je peux l'appliquer immédiatement si vous confirmez.

---

## 🟠 IMPORTANT #3 : Duplication `COPY . .` + `prisma generate` (app vs worker)

### Le problème

Le stage `worker` ne dérive pas de `builder`, il repart de `deps` et refait tout :

```dockerfile
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .                          # ← copie complète #1 (~300s d'après vos logs)
RUN pnpm prisma generate          # ← génération #1
RUN pnpm build

FROM base AS worker
COPY --from=deps /app/node_modules ./node_modules
COPY . .                          # ← copie complète #2 (encore ~300s)
RUN pnpm prisma generate          # ← génération #2 (travail dupliqué)
```

D'après vos logs de build, chaque `COPY . .` prenait **~300 secondes**. Avec deux stages qui le font séparément, c'est le double de travail pour un résultat identique.

### Solution recommandée

Faire dériver `worker` de `builder` (qui a déjà le code + le client Prisma généré) :

```dockerfile
FROM base AS worker
ENV NODE_ENV production
RUN pnpm add -g tsx
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/design-system/node_modules ./packages/design-system/node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/package.json ./package.json
# ... autres fichiers nécessaires au worker uniquement, pas tout le repo
```

Cela élimine un `COPY . .` complet et une génération Prisma redondante.

---

## 🟠 IMPORTANT #4 : `pnpm add -g tsx` redondant et source d'incohérence de version

**Ligne 75 du Dockerfile:**
```dockerfile
RUN pnpm add -g tsx
```

Le stage `worker` copie déjà `node_modules` complet depuis `deps`, qui contient **déjà** `tsx@4.22.4` (la version exacte du lockfile) accessible via `node_modules/.bin/tsx`.

Cette ligne :
- Télécharge à nouveau `tsx` depuis le registre npm (dépendance réseau supplémentaire au build)
- Peut installer une **version différente** de celle du lockfile (`^4.22.4` pourrait résoudre vers une version plus récente au moment du build), créant une incohérence entre dev/prod
- `docker-entrypoint-worker.sh` fait `exec tsx workers/queue.ts` → utilise cette version globale, pas celle du projet

### Solution
Supprimer `RUN pnpm add -g tsx` et utiliser le tsx local :
```dockerfile
ENTRYPOINT ["./docker-entrypoint-worker.sh"]
```
```sh
# docker-entrypoint-worker.sh
exec pnpm exec tsx workers/queue.ts
# ou directement :
exec ./node_modules/.bin/tsx workers/queue.ts
```

---

## 🟡 MOYEN #5 : Aucun `HEALTHCHECK` pour `app` et `worker`

Vous avez déjà un script prêt à l'emploi : `scripts/healthcheck.ts`, qui interroge `/api/public/health`. Il n'est utilisé **nulle part**.

Seuls `db` et `redis` ont des healthchecks dans `compose.yml`. Docker/Traefik ne peuvent donc pas détecter si `app` est réellement opérationnelle après démarrage.

### Solution
```dockerfile
# Dans le stage runner
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/public/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```
Ou en réutilisant le script existant (si `tsx`/node_modules est disponible dans le runner après correction du CRITIQUE #2) :
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pnpm tsx scripts/healthcheck.ts || exit 1
```

---

## 🟡 MOYEN #6 : Dossiers d'outils et fichiers de debug non exclus du contexte

Ces éléments sont à la racine du projet et n'ont aucune utilité dans une image Docker :

| Élément | Nature | Action |
|---|---|---|
| `.kilo/` | Config outil IA | Ajouter à `.dockerignore` |
| `.context/` | Config outil IA | Ajouter à `.dockerignore` |
| `.interface-design/` | Config outil IA | Ajouter à `.dockerignore` |
| `.prompts/` | Config outil IA | Ajouter à `.dockerignore` |
| `check_db.ts` | Script de debug ponctuel | Ajouter à `.dockerignore` (ou déplacer dans `scripts/`) |
| `fix.ts` | Script de debug ponctuel | Ajouter à `.dockerignore` (ou déplacer dans `scripts/`) |
| `pnpm/` (vide) | Reliquat vide | Supprimer du repo |
| `ENGINEERING_HANDBOOK.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` | Doc humaine | Déjà couvert par `.dockerignore` (pattern `docs`, mais ces 3 fichiers sont à la racine, pas dans `docs/`) |

---

## 🟡 MOYEN #7 : Ports DB/Redis exposés publiquement

**`compose.yml` lignes 62-63 et 86-87:**
```yaml
db:
  ports:
    - "5432:5432"
redis:
  ports:
    - "6379:6379"
```

En production, exposer PostgreSQL et Redis directement sur l'hôte (donc potentiellement sur internet selon le firewall) est un risque de sécurité. `app` et `worker` communiquent avec `db`/`redis` via le réseau Docker interne (`default`), ils n'ont pas besoin de ce port-mapping.

### Solution
Si c'est un environnement de production exposé, retirer ces `ports:` (garder l'accès uniquement via le réseau interne Docker). Les garder seulement si vous avez besoin d'accès direct depuis l'hôte (ex: debug local).

---

## 🟢 MINEUR #8 : Pas de cache BuildKit pour le store pnpm

Chaque build refait un téléchargement complet des packages (`Downloading @next/swc-linux-x64-musl...`, etc. dans vos logs). Avec un cache BuildKit monté sur le store pnpm, les rebuilds successifs seraient bien plus rapides.

### Solution
```dockerfile
# syntax=docker/dockerfile:1.7
...
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
```
(nécessite `DOCKER_BUILDKIT=1`, activé par défaut avec Docker récent)

---

## 🟢 MINEUR #9 : `USER root` en fin de stage `runner`

**Ligne 63:**
```dockerfile
USER root
```

C'est **intentionnel et documenté** (`docker-entrypoint.sh` a besoin de root pour les migrations puis fait `su nextjs` pour lancer le process final), donc ce n'est pas un bug. Je le mentionne uniquement pour confirmer que ce n'est **pas** un oubli — c'est correct tel quel, mais mérite un commentaire dans le Dockerfile pour éviter qu'un futur relecteur pense que c'est une erreur.

---

## 📋 Tableau Récapitulatif

| # | Problème | Sévérité | Bloque le déploiement ? | Statut |
|---|----------|----------|:---:|--------|
| 1 | Contexte de build 1.39GB (`.dockerignore` manquant) | 🔴 Critique | Oui (lenteur extrême) | ✅ Résolu |
| 2 | `runner` sans `node_modules` → migrations/seed échouent | 🔴 Critique | **Oui** | ❌ À corriger |
| 3 | Duplication `COPY . .` + `prisma generate` (worker) | 🟠 Important | Non (perf build) | ❌ À corriger |
| 4 | `pnpm add -g tsx` incohérent | 🟠 Important | Non (risque runtime) | ❌ À corriger |
| 5 | Pas de `HEALTHCHECK` | 🟡 Moyen | Non | ❌ À ajouter |
| 6 | Dossiers IA/debug non exclus | 🟡 Moyen | Non (poids contexte) | ❌ À corriger |
| 7 | Ports DB/Redis exposés | 🟡 Moyen | Non (sécurité) | ⚠️ À décider |
| 8 | Pas de cache BuildKit pnpm | 🟢 Mineur | Non (perf) | ❌ Optionnel |
| 9 | `USER root` en fin de runner | 🟢 Mineur | Non (déjà correct) | ℹ️ Info |

---

## 🎯 Plan d'Action Recommandé

### Immédiat (bloquant)
1. ✅ `.dockerignore` créé
2. ❌ **Corriger le CRITIQUE #2** — copier `node_modules` dans le `runner` (sinon l'app ne démarrera jamais correctement)

### Cette semaine
3. Dédupliquer `worker` en le faisant dériver de `builder`
4. Retirer `pnpm add -g tsx`, utiliser le `tsx` du lockfile
5. Compléter `.dockerignore` avec les dossiers IA et fichiers de debug

### Ce mois
6. Ajouter les `HEALTHCHECK` Docker
7. Revoir l'exposition des ports DB/Redis selon l'environnement (prod vs dev)
8. Ajouter le cache BuildKit pour accélérer les rebuilds

---

**Mise à jour 2026-07-02 :** Le CRITIQUE #2 a été corrigé et **validé par un build Docker complet réussi**. Voir la section suivante pour le détail.

---

## ✅ CRITIQUE #2 — Corrigé et validé

### Changements appliqués

1. **`Dockerfile`** — Copie de `node_modules` complet (depuis `deps`) dans le stage `runner` (commit `6ac680d`)

2. En testant le build complet, **3 bugs supplémentaires bloquants** ont été découverts et corrigés (ils empêchaient `pnpm build` de réussir, indépendamment de Docker) :

   a. **Bug d'écosystème Prisma 7** (commit `65a865f`) : le nouveau générateur `prisma-client` casse la résolution de module quand on importe le dossier racine du output (`../generated/prisma`) au lieu du fichier `client` directement. C'est un problème connu non résolu ([prisma/prisma#27048](https://github.com/prisma/prisma/issues/27048), [#28627](https://github.com/prisma/prisma/issues/28627)). Corrigé dans :
      - `src/lib/db.ts` → `from "../generated/prisma/client"`
      - `src/lib/services/access.ts`, `src/lib/services/onboarding.ts` → `from "@nba/generated/prisma/enums"`
      - `check_db.ts` et `fix.ts` (scripts de debug à la racine, qui n'étaient pas exclus du typecheck Next.js) déplacés vers `scripts/` (déjà exclu par `tsconfig.json`) et leur import cassé (`.js` inexistant) corrigé

   b. **Erreur de type préexistante** (commit `5aee763`) dans `src/app/(onboarding)/onboarding/profile/page.tsx` : `onValueChange` du composant `Select` peut recevoir `null`, incompatible avec les setters `useState<string>`. Corrigé avec un wrapper `(value) => setX(value ?? default)`.

### Validation

```
docker build --target runner -t nba-test-runner .
# ✓ Compiled successfully in 85s
# ✓ Finished TypeScript in 39.2s
# ✓ exporting to image ... naming to docker.io/library/nba-test-runner:latest
```

Testé à l'intérieur de l'image construite :
```
$ pnpm prisma --version   → prisma 7.8.0 ✓
$ pnpm exec tsx --version → tsx v4.22.4 ✓
```

Le conteneur `app` peut donc maintenant exécuter `prisma migrate deploy` et `db:seed` au démarrage sans erreur `command not found`.

### Note annexe (non bloquante)
Pendant `next build`, des logs `Error: getaddrinfo ENOTFOUND production-redis` apparaissent (BullMQ tente de se connecter à Redis pendant le pré-rendu statique). Le build réussit quand même — ce n'est que du bruit dans les logs, mais cela vaut la peine d'être investigué séparément si vous voulez des builds silencieux.

---

**Prochaine étape suggérée :** appliquer les corrections IMPORTANT #3 et #4 (dédupliquer `worker`, retirer `pnpm add -g tsx`) et MOYEN #5-7 quand vous serez prêt.
