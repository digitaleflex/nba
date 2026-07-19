# MASTER_DEVSECOPS_PLATFORM_AUDIT

> Audit DevSecOps / Plateforme du projet NBA (Next.js 16 · Docker · Traefik · GHCR · VPS · Neon Postgres · Valkey/Redis · BullMQ · Socket.IO).
> Équipe : Principal DevSecOps · Platform Eng · Staff SRE · Cloud Architect · Docker Expert · CI/CD Architect · Security Eng · Supply-Chain Eng · Release Eng · Perf Eng · FinOps.
> Date : 2026-07-19. Cible de dimensionnement : plusieurs millions d'utilisateurs.

---

## 0. Executive Summary

**La cause des échecs de déploiement en cascade (6 déploiements KO depuis le 19/07 17:57) a été identifiée et CORRIGÉE.**

### Cause racine (RÉSOLUE ✅)
Le `Dockerfile` (ligne 36) contenait une **garde maison** vérifiant la présence du middleware compilé :
```sh
RUN if ! ls .next/server/src/proxy.js && ! ls .next/server/middleware.js; then exit 1; ...
```
Next.js 16 utilise **Turbopack par défaut** et a **renommé la convention `middleware` → `proxy`**, déplaçant l'artefact compilé. La compilation `pnpm build` **réussissait** (les logs CI montrent `ƒ Proxy (Middleware)` + `#16 DONE`), mais la garde ne trouvait plus le fichier aux chemins codés en dur → `exit 1` → **100 % des déploiements bloqués**. Bug non déterministe documenté côté Vercel (issues #93326, #91600).

**Correctif appliqué** : suppression de la garde (commit `a0ea909` sur `main`). `pnpm build` échoue déjà nativement si le middleware ne compile pas — la garde était **redondante et fragile**. Déploiement suivant : **✅ succès en 15 min**, `https://access.signauxx.com/login` répond **HTTP 200 en 0,25 s**.

### Cause aggravante (À CORRIGER — P0)
**Le pipeline ne teste rien avant de déployer.** `deploy.yml` se déclenche sur `push: main` mais `ci.yml` (lint/typecheck/test/build) ne tourne que sur `pull_request` et `push: develop`. **Tout push direct sur `main` déploie sans aucune garde qualité.** De plus, le CI lui-même est actuellement **rouge au lint** (dizaines de `no-explicit-any`, `setState in effect`, `no-unescaped-entities`). Le projet déploie donc du code non validé, directement en prod, sur une base Neon **de production**.

### Verdict
⚠️ **PRODUCTION AVEC RÉSERVES.** L'app tourne, l'incident est résolu, le socle conteneur est solide (rootless, cap_drop, healthchecks, resource limits, Traefk TLS). Mais la **chaîne de release est dangereuse** (pas de gate qualité sur main, pas de rollback auto, pas de smoke test, migrations DB non transactionnelles jouées manuellement en prod). À corriger avant montée en charge.

---

## 1. DevSecOps Score : **58 / 100**

| Domaine | Score | Commentaire |
|---|---:|---|
| Docker | 7/10 | App multi-stage propre, rootless, mais worker non optimisé (tsx + source en prod). |
| Docker Compose | 7/10 | Sécurité durcie, limits, healthchecks ; `:latest` sur minio/imgproxy/app. |
| CI/CD | 3/10 | **Aucun gate qualité avant deploy sur main.** CI et Deploy déconnectés. CI rouge. |
| Supply Chain | 3/10 | Pas de Dependabot/Renovate, actions non pinnées SHA, pas de scan/SBOM/signature. |
| Sécurité | 6/10 | Secrets bien gérés (pas versionnés), durcissement conteneur OK ; images non scannées. |
| Performance | 6/10 | Build ~1–4 min, cache GHA actif ; worker image lourde ; pas de mesure formelle. |
| Résilience | 5/10 | restart policies + healthcheck Traefik OK ; **pas de rollback auto ni smoke test**. |
| Observabilité | 5/10 | Sentry + healthchecks ; pas de métriques/logs centralisés/alerting. |
| Maintenabilité | 6/10 | Compose lisible ; 2 Dockerfiles + 2 compose ; gardes fragiles. |
| Coût | 7/10 | Mono-VPS + Neon serverless : sobre. Valkey léger. Peu de gaspillage. |

---

## 2. Cause de l'échec — preuves techniques

**Chronologie (déploiements `main`) :**
| Heure | Commit | Résultat |
|---|---|---|
| 17:36 | docs(navigation) | ✅ `.next/server/middleware.js` trouvé → `✅ Middleware compiled` |
| 17:57 | feat(formation) | ❌ `middleware/proxy not found` |
| 18:38→19:29 | chunk, orphans, xss… | ❌ (même erreur, 5×) |
| 20:10 | **fix garde Dockerfile** | ✅ **succès 15m48s, site 200** |

**Log de l'échec :**
```
#17 [builder 2/2] RUN if ! ls .next/server/src/proxy.js && ! ls .next/server/middleware.js ...
#17 0.117 ❌ BUILD ERROR: middleware/proxy not found in build output
#17 ERROR: process ... exit code: 1
```
**Preuve que la compilation réussissait** (même run) :
```
#16 65.92 ƒ Proxy (Middleware)
#16 DONE 66.3s
```
→ Le build applicatif était sain ; **seule la garde était en faute**. Confirmé par l'avertissement Next 16 au build : `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`

---

## 3. Cartographie plateforme

```
GitHub push(main) ──► deploy.yml ──► docker build (GHCR) ──► SSH VPS1
                                                              │
                                                              ├─ docker compose run --rm (backup B2)
                                                              ├─ docker compose run --rm (prisma migrate deploy)  ⚠ manuel, non transactionnel
                                                              ├─ docker compose run --rm (db:seed)
                                                              └─ docker compose up -d (app, worker, bull-board)
Traefik (réseau proxy externe, Let's Encrypt) ─► app:3000 (Host) + ws:3001 (/socket.io) + bull:3002 (/admin/queues)
Services: app(Next standalone+PM2) · worker(BullMQ) · bull-board · valkey(redis) · minio(S3) · imgproxy
DB: Neon Postgres 17 (serverless, externe) · Storage: MinIO/S3 · Sons/PDF/push
```

---

## 4. Docker — Score 7/10

### App `Dockerfile` — points forts
- Multi-stage propre (`base → deps → prepared → builder → runner`), `output: standalone`.
- Rootless au runtime (`nextjs:1001`, drop privileges via `su`), `pg_isready` pour readiness.
- `.dockerignore` complet (`.env`, `node_modules`, `.next` exclus → pas de secret/build local embarqué).

### App `Dockerfile` — à corriger
| Sévérité | Constat | Reco |
|---|---|---|
| P0 ✅FAIT | Garde middleware fragile bloquant le build | Supprimée (`a0ea909`) |
| P2 | `node_modules` **complet** (dev deps) copié dans le runner (l.60) pour `tsx`/`prisma` au runtime | À terme : compiler seed/migrate ou image outillage séparée → runner minimal |
| P2 | `USER root` final (drop via `su` dans entrypoint) | Acceptable mais préférer `USER nextjs` + init dédié pour migrations |
| P3 | Pas de `HEALTHCHECK` distroless ; base `node:22-alpine` (OK, maintenue) | Envisager `node:22-slim`/distroless pour surface CVE réduite |

### `Dockerfile.worker` — Score 5/10 (le plus faible)
| Sévérité | Constat | Reco |
|---|---|---|
| P2 | **Pas de stage runner** : embarque tout le code source + `tsx` (TS au runtime) | Compiler le worker (tsup/esbuild) → image ~3-5× plus légère |
| P2 | `USER root`, pas de `cap_drop` dans le Dockerfile (compose compense partiellement) | Ajouter user non-root |
| P3 | `pip3 install b2` + `python3` dans l'image worker (backup) | Isoler le backup (job cron externe / sidecar) pour alléger |
| P3 | Healthcheck `pgrep tsx workers/queue.ts` fragile | Exposer un vrai endpoint /health |

**Gain estimé** worker compilé : image ~800 Mo → ~250 Mo, démarrage plus rapide, surface d'attaque réduite.

---

## 5. Docker Compose — Score 7/10

**Forts :** `cap_drop: ALL` + `no-new-privileges` (app/worker/bull-board), resource limits+reservations, healthchecks, `stop_grace_period`, réseau `proxy` externe isolé, Redis non exposé (expose interne), Valkey avec password + AOF.

**À corriger :**
| Sévérité | Constat | Reco |
|---|---|---|
| P1 | `minio:latest` et `imgproxy:latest` (l.92,175) | **Pinner par digest** (`@sha256:…`) — reproductibilité + anti-drift |
| P1 | MinIO expose `9000/9001` et imgproxy `8080` **en clair sur l'hôte** (`ports:`) | Ne pas publier ces ports ; passer par réseau interne + Traefik si besoin |
| P2 | `image: ghcr.io/digitaleflex/nba` **sans tag** (=`latest`) | Déployer par digest/SHA (déjà taggé `:${sha}` au build) pour rollback déterministe |
| P2 | Pas de `cap_drop` sur `nba-redis`, `nba-minio`, `nba-imgproxy` | Harmoniser le durcissement |
| P3 | `logging` non configuré (driver json-file par défaut, pas de rotation) | `logging: {driver: json-file, options: {max-size: 10m, max-file: 3}}` |
| P3 | 2 compose (`compose.yml` + `compose.vps2.yml`) | Documenter ou fusionner via profiles |

---

## 6. CI/CD & GitHub Actions — Score 3/10 (LE POINT NOIR)

### Défauts structurels
| Sévérité | Constat | Impact |
|---|---|---|
| **P0** | `deploy.yml` (push main) **ne dépend pas** de `ci.yml` (PR/develop). Push direct main = deploy sans lint/test/build | Code cassé/non testé va en prod. **C'est la cause aggravante de l'incident.** |
| **P0** | CI **actuellement rouge** (lint : `no-explicit-any`, `setState in effect`, `no-unescaped-entities`) | Merge bloqué / qualité non garantie |
| **P1** | Migrations Prisma jouées via `compose run` **manuel dans le script SSH**, hors transaction, sans validation ni rollback | Risque de corruption/downtime sur migration ratée |
| **P1** | Pas de **smoke test** post-deploy ni de **rollback auto** si healthcheck KO | Un mauvais build reste servi |
| **P2** | Actions non pinnées SHA (`@v5`, `@v7`…) | Supply-chain : action compromise = RCE CI |
| **P2** | `docker/setup-buildx@v3` force Node20→24 (déprécation) | Warnings, à mettre à jour |
| **P2** | Secret PAT sans `workflow` scope côté remote (push workflow rejeté) | Friction ops (contourné via token gh) |
| **P3** | Pas de `concurrency` sur deploy (déploiements concurrents possibles) | Race d'images |
| **P3** | Pas de `timeout-minutes` sur les jobs | Jobs pendus = coût |

### Architecture cible recommandée (simple, non sur-ingénierée)
Un **seul pipeline** `push: main` :
```
quality (lint+typecheck+test) ──► build+push image (tag :sha) ──► deploy (migrate → up → smoke test → rollback si KO)
     needs ─────────────────────────────┘                needs ────────┘
```
- `deploy` **`needs: [quality, build]`** → impossible de déployer si rouge.
- `concurrency: group=deploy-main, cancel-in-progress: false`.
- Smoke test : `curl -f https://access.signauxx.com/api/public/health` post-`up` ; si KO → `docker compose up -d` sur l'image `:sha` précédente (rollback).

---

## 7. Supply Chain Security — Score 3/10

| Sévérité | Constat | Reco |
|---|---|---|
| P1 | **Ni Dependabot ni Renovate** | Ajouter `.github/dependabot.yml` (npm + docker + github-actions, weekly) |
| P1 | Aucun **scan de vulnérabilités** image (Trivy/Grype) ni **SBOM** | Ajouter step Trivy en CI + `docker buildx --sbom` |
| P2 | Actions **non pinnées par SHA** | Pinner (`actions/checkout@<sha> # v5`) |
| P2 | Images non **signées** (pas de Cosign) | `cosign sign` sur l'image GHCR (SLSA provenance via buildx) |
| P3 | Pas de secret scanning activé (gitleaks/GH secret scanning) | Activer GH Advanced Security ou gitleaks en CI |

Bon point : `.env` **non versionné**, `.env*` dans `.gitignore`, `.env.example` fourni. Secrets via GitHub Secrets + `env_file`.

---

## 8. Déploiement / Release — Score 5/10

- **Rolling zero-down** via healthcheck Traefik : bon principe (Traefik ne route qu'un conteneur healthy).
- **Backup pré-deploy** (pg_dump→B2) : ✅ excellent réflexe.
- **Nettoyage conteneurs orphelins** `nba-*-run-*` : ✅ (corrige l'incident du 13/07).
- ❌ **Pas de rollback automatisé**, **pas de smoke test**, **pas de tag immuable déployé** (`latest` → non déterministe).
- ⚠️ **Migrations non réversibles** jouées à la main ; `db:seed` à chaque deploy.

**Temps mesurés :** build+push ~1–4 min ; deploy total ~15 min (dernier succès) ; rollback : **manuel, non défini** (RTO élevé).

---

## 9. Base de données — Neon Postgres

- Migrations Prisma via `migrate deploy` (one-shot, avant boot) : correct sur le principe.
- ⚠️ Pas de garde contre **migrations destructives** (drop column/table) en CI.
- ⚠️ `db:seed` rejoué à chaque déploiement (idempotent d'après commentaires — à garantir par tests).
- ✅ Backup B2 avant deploy. ❌ **Restore non testé** (pas de drill DR).
- 🔴 **Note d'état** : au moment de l'audit, `prisma/schema.prisma` du working tree local était corrompu (206 lignes manquantes, modèle `Streak`/`StreakType` absents) — **non committé, non déployé**. À restaurer depuis `HEAD` avant tout commit du travail journal.

---

## 10. Reverse Proxy (Traefik) — bon

- HTTPS + Let's Encrypt (`certresolver`), `websecure`, TLS on.
- Routage propre : app (Host, prio 1), ws `/socket.io` (prio 200), bull-board `/admin/queues` (prio 150), tous liés à leurs services.
- Healthcheck LB Traefik configuré.
- **Manque :** security headers gérés côté Next (`next.config.ts` : HSTS, X-Frame, CSP, nosniff — ✅ présents et corrects), mais **pas de rate-limiting** ni compression au niveau proxy, pas de HTTP/3.

---

## 11. Observabilité — Score 5/10

- ✅ Sentry (client/server/edge configs).
- ✅ Healthchecks conteneur + Traefik + `/api/public/health`.
- ❌ Pas de métriques (Prometheus), pas de logs centralisés (Loki), pas d'alerting (AlertManager), pas de tracing OTel.
- Angle mort : impossible de savoir *pourquoi* un déploiement dégrade sans fouiller les logs conteneur à la main (comme lors de cet incident).

---

## 12. Résilience / FinOps

- `restart: unless-stopped` sur services stateful ; app via PM2 `autorestart`.
- RPO ≈ intervalle backup (pré-deploy uniquement → **RPO élevé entre 2 deploys** ; ajouter backup planifié). RTO restore **non mesuré**.
- Coût maîtrisé : mono-VPS + Neon serverless + Valkey léger. Pas de conteneurs/volumes/images inutiles majeurs (image prune au deploy).

---

## 13. Priorisation

**P0 — Bloquant / Critique immédiat**
1. ✅ **FAIT** — Supprimer la garde middleware du Dockerfile (déployé, prod rétablie).
2. Faire dépendre `deploy` de `quality` (lint+typecheck+test) → **ne jamais déployer du rouge**.
3. Réparer le CI (erreurs lint `no-explicit-any`/effects/entities).

**P1 — Critique**
4. Rollback auto + smoke test post-deploy ; déployer par **tag immuable `:sha`** (pas `latest`).
5. Pinner `minio`/`imgproxy` par digest ; ne pas publier ports 9000/9001/8080.
6. Dependabot + scan Trivy + SBOM en CI. Garde anti-migration destructive.

**P2 — Important**
7. Compiler le worker (retirer `tsx`+source de l'image). Runner sans dev deps.
8. Pinner les actions GitHub par SHA ; `concurrency` + `timeout-minutes`.
9. `cap_drop` sur redis/minio/imgproxy ; rotation des logs.

**P3 — Optimisation**
10. Cosign (signature) + provenance SLSA. HTTP/3 + rate-limit Traefik.
11. Métriques/logs/alerting (Prometheus+Loki+Grafana léger, ou Sentry crons).
12. Backup planifié (pas seulement pré-deploy) + drill de restore. Fusion des 2 compose.

---

## 14. Roadmap

**Quick Wins (1 j)** — ✅ garde Dockerfile (fait) · gate `needs: quality` sur deploy · `concurrency` + `timeout-minutes` · pin digests minio/imgproxy · fermer ports MinIO/imgproxy · `.github/dependabot.yml` · rotation logs compose.

**Sprint 1** — Réparer le lint CI · smoke test + rollback auto + déploiement par `:sha` · Trivy + SBOM en CI · garde migration destructive.

**Sprint 2** — Worker compilé (image légère) · runner sans dev deps · pin actions SHA · `cap_drop` généralisé · backup planifié.

**Sprint 3** — Cosign + provenance SLSA · métriques/logs/alerting · drill DR (restore testé) · HTTP/3 + rate-limit.

**Long terme (multi-M users)** — séparer plan d'exécution migrations (job dédié versionné) · registre d'images avec rétention · autoscaling (passage éventuel à un orchestrateur seulement si le mono-VPS sature — **pas avant**, éviter la sur-ingénierie K8s prématurée).

---

## 15. Analyse de sur-ingénierie

Le projet **n'est pas** sur-ingénieré au niveau infra (bon choix : mono-VPS + Traefik + compose plutôt que K8s prématuré, Neon serverless plutôt que Postgres auto-géré). Les excès sont **inverses** : **gardes maison fragiles** (le check middleware qui a tout cassé) qui dupliquent des garanties déjà fournies par les outils. Recommandation transverse : **faire confiance aux outils** (`next build`, healthchecks natifs) plutôt qu'à des vérifications shell couplées aux internals.

---

## 16. Benchmark

| Capacité | NBA | Standard (Vercel/Stripe/Fly/Railway) |
|---|---|---|
| Gate qualité avant prod | ❌ (push main direct) | ✅ obligatoire |
| Rollback 1-clic / auto | ❌ manuel | ✅ instantané |
| Déploiement immuable | ⚠️ `latest` | ✅ par commit/digest |
| Scan vuln + SBOM + signature | ❌ | ✅ |
| Observabilité (metrics/logs/traces) | ⚠️ Sentry seul | ✅ complet |
| Zero-downtime | ✅ (Traefik healthcheck) | ✅ |
| Secrets non versionnés | ✅ | ✅ |
| Durcissement conteneur | ✅ (rootless, cap_drop) | ✅ |

**Positionnement : ~niveau « bon self-hosted Coolify/Dokploy manuel »**, en dessous des PaaS managés surtout sur **gate qualité, rollback et supply chain**.

---

## 17. Verdict

⚠️ **PRODUCTION AVEC RÉSERVES.**

**Preuves du OUI :** incident résolu (prod 200), socle conteneur durci et sobre, zero-downtime réel via Traefik, backups pré-deploy, secrets propres.

**Preuves des RÉSERVES (à lever avant scale) :** pipeline sans gate qualité sur `main` (cause aggravante de l'incident), CI rouge, pas de rollback auto ni smoke test, migrations manuelles non réversibles en prod, supply chain non sécurisée (pas de scan/SBOM/pinning/Dependabot), `:latest` non déterministe.

**Action n°1 immédiate :** rendre `deploy` dépendant de `quality` et réparer le lint — sans quoi le prochain code cassé repartira droit en production.
