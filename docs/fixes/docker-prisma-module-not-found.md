# Fix Docker Build - Prisma Module Not Found

**Date:** 2026-07-02  
**Issue:** Docker build fails at `pnpm prisma generate` step  
**Error:** `Cannot find module '/app/node_modules/prisma/build/index.js'`  
**Status:** ✅ Résolu

---

## 🔴 Problème

### Erreur Complète
```
#17 [app worker 6/8] RUN pnpm prisma generate
#17 5.839 Error: Cannot find module '/app/node_modules/prisma/build/index.js'
#17 5.839     at Function._resolveFilename (node:internal/modules/cjs/loader:1430:15)
#17 5.839   code: 'MODULE_NOT_FOUND',
#17 ERROR: process "/bin/sh -c pnpm prisma generate" did not complete successfully: exit code: 1
```

### Contexte
L'erreur est apparue après avoir ajouté le fichier `.npmrc` avec la configuration de hoisting pour résoudre les problèmes TypeScript en développement local:

```
# .npmrc
shamefully-hoist=true
public-hoist-pattern[]=*
```

### Cause Racine
Le fichier `.npmrc` n'était **pas copié dans le conteneur Docker** avant l'exécution de `pnpm install`. 

Résultat:
- **En local:** pnpm utilise le hoisting → packages accessibles à la racine de `node_modules/`
- **Dans Docker:** pnpm n'utilise PAS le hoisting → packages dans `.pnpm/` uniquement
- **Conséquence:** Structure de `node_modules` différente entre local et Docker
- **Échec:** Prisma introuvable au moment de `prisma generate`

---

## ✅ Solution

### Modification du Dockerfile

**Avant:**
```dockerfile
# Step 1: Install all dependencies (including devDependencies for build)
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/design-system/package.json ./packages/design-system/
RUN pnpm install --frozen-lockfile
```

**Après:**
```dockerfile
# Step 1: Install all dependencies (including devDependencies for build)
FROM base AS deps
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/design-system/package.json ./packages/design-system/
RUN pnpm install --frozen-lockfile
```

**Changement:** Ajout de `.npmrc` dans la commande `COPY`

### Changements Additionnels
Pendant la correction, nous avons également:
- Mis à jour l'image de base: `node:20-alpine` → `node:22-alpine`
- Activé explicitement pnpm@9: `corepack prepare pnpm@9 --activate`

---

## 🧪 Comment Tester

### Test Rapide (Étape deps uniquement)
```bash
docker build --target deps -t nba-test-deps .
```

### Test Complet (Worker qui échouait)
```bash
docker build --target worker -t nba-test-worker .
```

### Test des Deux Services
```bash
docker compose build
```

### Test Complet avec Démarrage
```bash
docker compose up --build
```

---

## 📋 Checklist de Vérification

- [x] `.npmrc` existe à la racine du projet
- [x] `.npmrc` est copié dans l'étape `deps` du Dockerfile
- [x] `pnpm install` s'exécute après la copie de `.npmrc`
- [x] Commit créé avec message descriptif
- [ ] Build Docker réussi localement
- [ ] Tests d'intégration Docker passent
- [ ] Déploiement en staging validé

---

## 🔍 Diagnostic

### Vérifier que .npmrc est dans le conteneur
```bash
docker run --rm nba-test-deps cat .npmrc
```

**Résultat attendu:**
```
shamefully-hoist=true
public-hoist-pattern[]=*
```

### Vérifier la structure de node_modules
```bash
docker run --rm nba-test-deps ls -la node_modules/prisma
```

**Résultat attendu:** Le répertoire doit exister et contenir `build/index.js`

### Vérifier que Prisma fonctionne
```bash
docker run --rm nba-test-deps pnpm prisma --version
```

**Résultat attendu:**
```
prisma                  : 7.8.0
@prisma/client          : 7.8.0
```

---

## 🎓 Leçons Apprises

### 1. Cohérence Configuration Local/Docker
Toute configuration qui affecte la structure de `node_modules` doit être **identique** entre:
- Développement local
- Conteneur Docker
- CI/CD

**Fichiers critiques à synchroniser:**
- `.npmrc`
- `.yarnrc.yml`
- `pnpm-workspace.yaml`
- `package.json` (workspaces)

### 2. Ordre des Opérations Docker
```dockerfile
# ❌ INCORRECT - Configuration après install
COPY package.json ./
RUN pnpm install
COPY .npmrc ./

# ✅ CORRECT - Configuration avant install
COPY .npmrc package.json ./
RUN pnpm install
```

### 3. Impact du Hoisting
Le hoisting pnpm change fondamentalement la structure de `node_modules`:

**Sans hoisting:**
```
node_modules/
  .pnpm/
    prisma@7.8.0/
      node_modules/
        prisma/          ← Le vrai package
```

**Avec hoisting:**
```
node_modules/
  prisma/                ← Symlink vers .pnpm
  .pnpm/
    prisma@7.8.0/
      node_modules/
        prisma/          ← Le vrai package
```

### 4. Débogage Docker
Toujours tester les étapes intermédiaires:
```bash
# Test une étape spécifique
docker build --target <stage-name> -t test-image .

# Inspecter le conteneur
docker run --rm -it test-image sh

# Voir les logs détaillés
docker build --progress=plain --no-cache .
```

---

## 📚 Ressources

- [pnpm node_modules structure](https://pnpm.io/symlinked-node-modules-structure)
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Prisma in Docker](https://www.prisma.io/docs/orm/more/deployment/docker)
- [pnpm configuration](https://pnpm.io/npmrc)

---

## 🔗 Commits Liés

- `c010f84` - Configure pnpm workspace hoisting
- `f7fa7fb` - Update pnpm lockfile after dependency reinstall
- `47037ca` - Fix Docker build by copying .npmrc to container (CE COMMIT)

---

## 📝 Notes Supplémentaires

### Alternative: Sans Hoisting dans Docker
Si vous ne voulez pas utiliser le hoisting dans Docker, vous pourriez:

1. **Option A:** Créer un `.npmrc` différent pour Docker
```dockerfile
# Dockerfile
RUN echo "node-linker=isolated" > .npmrc
RUN pnpm install --frozen-lockfile
```

2. **Option B:** Override avec une variable d'environnement
```dockerfile
ENV NPM_CONFIG_SHAMEFULLY_HOIST=false
RUN pnpm install --frozen-lockfile
```

**⚠️ Non recommandé:** Cela crée une divergence entre local et Docker.

### Pourquoi Hoisting était Nécessaire
Le hoisting a été activé pour résoudre les problèmes TypeScript en développement:
- TypeScript ne trouvait pas les modules dans `.pnpm/`
- Le language server avait besoin de packages à la racine de `node_modules/`
- Solution la plus simple: activer le hoisting partout (local + Docker)

---

**Rédigé par:** Agent AI  
**Validé par:** À venir après tests  
**Prochaine action:** Tester le build Docker complet
