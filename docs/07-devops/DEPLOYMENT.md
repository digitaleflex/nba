# Deployment

> **Version :** 2.0
> **Statut :** Approved
> **Dernière mise à jour :** Juillet 2026

---

## 1. Architecture de production

```
Internet → Cloudflare → VPS1 (Traefik) → app (port 3000)
                                            ↓
                                       Redis (port 6379)
                                            ↑
                                          Tailscale
                                            ↑
                                       VPS2 (worker BullMQ + cron B2)
```

- **VPS1** : app Next.js + Redis + Traefik (`access.signauxx.com`)
- **VPS2** : worker BullMQ + cron B2
- **Tailscale** : mesh privé entre les 2 VPS
- **Neon** : PostgreSQL cloud
- **B2** : backups quotidiens

---

## 2. Prérequis

### VPS1 (application)
- Ubuntu 22.04+ / Debian 12+
- Docker 24+ + Docker Compose 2+
- 2 vCPU, 4 GB RAM minimum
- Tailscale installé et authentifié
- 50 GB stockage

### VPS2 (worker)
- Ubuntu 22.04+ / Debian 12+
- Docker 24+ + Docker Compose 2+
- 2 vCPU, 1 GB RAM minimum
- Tailscale installé et authentifié
- Accès à l'image `ghcr.io/digitaleflex/nba-worker`

### Externes
- Compte Neon (PostgreSQL pooled)
- Compte Backblaze B2
- Compte Resend
- Domaine + Cloudflare (proxied)

---

## 3. Fichiers clés

| Fichier | Rôle |
|---------|------|
| `compose.yml` | VPS1 (app + redis) |
| `Dockerfile` | Build de l'image app (target: runner) |
| `Dockerfile.worker` | Build de l'image worker (target: worker) |
| `compose.vps2.yml` | VPS2 (worker uniquement) |
| `docker-entrypoint.sh` | App: db push + seed + start |
| `docker-entrypoint-worker.sh` | Worker: db push + B2 auth + cron + start |
| `.env` | Variables d'environnement (gitignored) |
| `prisma/schema.prisma` | Schéma BDD |

---

## 4. Build et push

```bash
# Build
docker compose build

# Push vers ghcr.io
docker push ghcr.io/digitaleflex/nba:latest
docker push ghcr.io/digitaleflex/nba-worker:latest
```

⚠️ **Séparation des Dockerfiles** : `Dockerfile` et `Dockerfile.worker` sont séparés pour éviter les problèmes de cache BuildKit qui causaient des erreurs 502.

---

## 5. Déploiement VPS1

### 5.1 One-time setup

```bash
# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-XXXXX --hostname=vps1-nba --accept-routes

# Cloner le repo
git clone https://github.com/digitaleflex/nba.git /home/audest/nba
cd /home/audest/nba

# Copier .env
cp .env.example .env
nano .env  # éditer
```

### 5.2 Déployer

```bash
cd /home/audest/nba
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f app
```

---

## 6. Déploiement VPS2

### 6.1 One-time setup

```bash
# Tailscale (même auth key que VPS1)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=tskey-auth-XXXXX --hostname=vps2-nba --accept-routes

# Docker
curl -fsSL https://get.docker.com | sh
```

### 6.2 Setup des fichiers

```bash
# Sur VPS1
scp compose.vps2.yml user@vps2:~/nba-app/
scp .env user@vps2:~/nba-app/.env

# Sur VPS2
mkdir -p ~/nba-app
cd ~/nba-app

# Login ghcr.io (image privée)
echo "ghp_XXXXX" | docker login ghcr.io -u digitaleflex --password-stdin

# Pull et lancer
docker compose -f compose.vps2.yml pull
docker compose -f compose.vps2.yml up -d
```

### 6.3 Vérifier

```bash
docker compose -f compose.vps2.yml ps
docker compose -f compose.vps2.yml logs -f
```

Doit afficher :
```
🧹 File cleanup worker started
📧 Notification delivery worker started
📈 Signal distribution worker started
```

---

## 7. Variables d'environnement

Voir `ENVIRONMENT.md` pour la liste complète.

Les variables **critiques** :
- `DATABASE_URL` (Neon)
- `REDIS_URL` (format `redis://:PASS@host:6379`)
- `REDIS_PASSWORD` (passé au conteneur Redis)
- `BETTER_AUTH_SECRET` (32+ chars hex)
- `RESEND_API_KEY` (Resend)
- `B2_*` (Backblaze)
- `BACKUP_ALERT_EMAIL`

---

## 8. Base de données

### Migrations

L'entrypoint utilise `pnpm prisma db push` (sans `--accept-data-loss`) :
- Crée les tables/colonnes manquantes
- Refuse de supprimer des colonnes avec données
- Pas de verrou advisory (contrairement à `migrate deploy` avec Neon pooler)

Pour forcer un reset : ⚠️ **DESTRUCTIF** — ne jamais faire en prod.

### Seed

Automatique à chaque démarrage du conteneur (idempotent via `upsert`) :
- 5 rôles
- 11 permissions
- 6 plans d'abonnement
- 1 admin (si `ADMIN_EMAIL` + `ADMIN_PASSWORD` dans `.env`)

---

## 9. Monitoring

| Métrique | Source |
|----------|--------|
| Healthcheck | `docker compose ps` (healthy) |
| Logs | `docker compose logs` |
| App healthcheck HTTP | `scripts/healthcheck.ts` |
| Backup status | Logs cron B2 + alertes email |

Pas de stack de monitoring dédiée (Sentry, Datadog, etc.) — à ajouter.

---

## 10. Rollback

### App
```bash
cd /home/audest/nba
git pull origin main  # revenir à un commit précédent
docker compose build --no-cache
docker compose up -d
```

### Worker (VPS2)
```bash
cd ~/nba-app
docker compose -f compose.vps2.yml pull
docker compose -f compose.vps2.yml up -d
```

### Base de données
Neon garde 7 jours d'historique (point-in-time recovery). Restaurer via console Neon.

---

## 11. Healthchecks

| Service | Endpoint | Status |
|---------|----------|--------|
| VPS1 App | `https://access.signauxx.com/` | 200 |
| VPS2 Worker | `docker inspect --format '{{.State.Health.Status}}' nba-app-worker-1` | healthy |
| Redis | `redis-cli ping` (via Tailscale) | PONG |
| Neon DB | connection dans healthcheck.ts | OK |

---

## 12. Troubleshooting

### 502 Bad Gateway

1. Vérifier que l'app tourne : `docker compose ps`
2. Vérifier les logs : `docker compose logs app --tail 50`
3. Si l'app a l'entrypoint du worker → `docker compose build --no-cache app`

### Redis inaccessible depuis VPS2

1. Vérifier Tailscale : `tailscale status` (sur les 2 VPS)
2. Vérifier le port 6379 publié sur VPS1 : `nc -zv 100.122.171.84 6379` (depuis VPS2)
3. Vérifier le mot de passe : `redis-cli -h 100.122.171.84 -a $REDIS_PASSWORD ping`

### Worker ne traite pas les jobs

1. Vérifier que le worker tourne : `docker compose -f compose.vps2.yml ps`
2. Vérifier la connexion Redis : logs du worker
3. Vérifier les jobs en attente : ajouter Bull Board (TODO)

### Backup échoue

1. Vérifier les credentials B2 dans `.env`
2. Vérifier la connexion B2 : `b2 authorize-account`
3. L'email d'alerte arrive dans la boîte `admin@signauxx.com`
