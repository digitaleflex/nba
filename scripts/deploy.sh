#!/usr/bin/env bash
# Deploy NBA — zero-downtime avec mode maintenance automatique.
#
#  1. Active la page de maintenance (Traefik priorité 999 → tout le trafic)
#  2. Build l'image localement
#  3. Transfère l'image via SSH
#  4. Démarre la nouvelle app et attend le healthcheck
#  5. Désactive la maintenance → les utilisateurs voient la nouvelle version
#
# Usage: ./scripts/deploy.sh
#
# Prérequis: SSH key ~/.ssh/nba, Docker local, VPS avec Traefik

set -euo pipefail

SHA="${1:-$(git rev-parse --short HEAD)}"
FULL_SHA="$(git rev-parse HEAD)"
IMAGE="ghcr.io/digitaleflex/nba"
DOMAIN="access.signauxx.com"
SSH_HOST="${SSH_HOST:-access.signauxx.com}"
SSH_USER="${SSH_USER:-audest}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/nba}"

echo "╔═══════════════════════════════════════════╗"
echo "║     NBA Deploy (zero-downtime)            ║"
echo "╚═══════════════════════════════════════════╝"
echo "  Commit : $SHA"
echo "  Target : $SSH_USER@$SSH_HOST"
echo ""

# ── Quality gate ──
echo "=== [1/6] Quality Gate ==="
pnpm typecheck || { echo "Typecheck failed — deploy aborted"; exit 1; }
echo "  Typecheck OK"
echo ""

# ── Activate maintenance mode ──
echo "=== [2/6] Mode maintenance ON ==="
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash -s << 'MAINTENANCE_ON'
set -e
cd /home/audest/nba
docker compose --profile maintenance up -d --build maintenance 2>&1 | tail -3
echo "  Maintenance page active — utilisateurs voient la page d'attente"
MAINTENANCE_ON
echo ""

# ── Docker build (local) ──
echo "=== [3/6] Build image ==="
NEXT_PUBLIC_VAPID_PUBLIC_KEY="${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-$(grep ^NEXT_PUBLIC_VAPID_PUBLIC_KEY .env | cut -d= -f2-)}"
docker build \
  --build-arg NEXT_PUBLIC_APP_URL="https://$DOMAIN" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$NEXT_PUBLIC_VAPID_PUBLIC_KEY" \
  -t "$IMAGE:latest" \
  -t "$IMAGE:$FULL_SHA" \
  .
echo ""

# ── Transfer to VPS ──
echo "=== [4/6] Transfer image to VPS ==="
docker save "$IMAGE:latest" | ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker load" 2>&1 | tail -3
echo ""

# ── Rolling deploy (zero-downtime) ──
echo "=== [5/6] Rolling deploy (new container) ==="
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash -s << 'ROLLING'
set -e
cd /home/audest/nba

echo "--- Stopping old app ---"
docker stop nba-app-1 2>/dev/null || true
docker rm nba-app-1 2>/dev/null || true

echo "--- Starting new app ---"
docker compose -f compose.yml up -d --no-deps app 2>&1 | tail -3

echo "--- Waiting for healthy ---"
for i in $(seq 1 30); do
  STATUS=$(docker inspect nba-app-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  echo "  [$i] $STATUS"
  if [ "$STATUS" = "healthy" ]; then break; fi
  sleep 5
done

echo "--- Migrations ---"
DIRECT_URL="$(echo "$DATABASE_URL" | sed 's/-pooler//')"
docker compose -f compose.yml run --rm -e DIRECT_URL="$DIRECT_URL" --entrypoint sh app -c \
  "npx prisma migrate deploy 2>&1" > /tmp/migrate.log 2>&1 || { cat /tmp/migrate.log; echo "Migration failed"; exit 1; }
cat /tmp/migrate.log
ROLLING
echo ""

# ── Smoke test ──
echo "=== [6/6] Smoke test + désactivation maintenance ==="
# On teste d'abord la nouvelle app avant de désactiver la maintenance
for i in $(seq 1 10); do
  OUT=$(curl -sf --max-time 5 "https://$DOMAIN/api/public/health" 2>&1) && break
  echo "  [$i] Waiting for app..."
  sleep 5
done
echo "  $OUT"

# Désactiver la maintenance
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash -s << 'MAINTENANCE_OFF'
set -e
cd /home/audest/nba
docker compose --profile maintenance stop maintenance 2>/dev/null || true
docker compose --profile maintenance rm -f maintenance 2>/dev/null || true
echo "  Maintenance mode OFF — trafic restauré vers l'app"
MAINTENANCE_OFF

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║         Deploy complete                   ║"
echo "║  https://$DOMAIN           ║"
echo "╚═══════════════════════════════════════════╝"
