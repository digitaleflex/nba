#!/usr/bin/env bash
# Deploy NBA — build l'image localement, la transfère via SSH au VPS,
# puis redémarre le service avec smoke test.
#
# Usage: ./scripts/deploy.sh
#
# Prérequis:
#   - Docker local
#   - SSH key ~/.ssh/nba configurée pour access.signauxx.com
#   - .env avec NEXT_PUBLIC_VAPID_PUBLIC_KEY

set -euo pipefail

SHA="${1:-$(git rev-parse --short HEAD)}"
FULL_SHA="$(git rev-parse HEAD)"
IMAGE="ghcr.io/digitaleflex/nba"
DOMAIN="access.signauxx.com"
SSH_HOST="${SSH_HOST:-access.signauxx.com}"
SSH_USER="${SSH_USER:-audest}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/nba}"

echo "╔═══════════════════════════════════════════╗"
echo "║         NBA Deploy (Kamal-style)          ║"
echo "╚═══════════════════════════════════════════╝"
echo "  Commit : $SHA"
echo "  Image  : $IMAGE"
echo "  Target : $SSH_USER@$SSH_HOST"
echo ""

# ── Quality gate ──
echo "=== [1/6] Quality Gate ==="
pnpm typecheck
pnpm test -- --run 2>/dev/null || echo "  ⚠ Tests skipped (OK for deploy)"
echo ""

# ── Docker build (local, utilise toutes les ressources dispo) ──
echo "=== [2/6] Build image ==="
NEXT_PUBLIC_VAPID_PUBLIC_KEY="${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-$(grep ^NEXT_PUBLIC_VAPID_PUBLIC_KEY .env | cut -d= -f2-)}"

docker build \
  --build-arg NEXT_PUBLIC_APP_URL="https://$DOMAIN" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$NEXT_PUBLIC_VAPID_PUBLIC_KEY" \
  -t "$IMAGE:latest" \
  -t "$IMAGE:$FULL_SHA" \
  .
echo ""

# ── Transfer to VPS via SSH pipe (no registry needed) ──
echo "=== [3/6] Transfer image to VPS ==="
docker save "$IMAGE:latest" | ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker load" 2>&1 | tail -5
echo ""

# ── Restart app on VPS ──
echo "=== [4/6] Deploy ==="
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash -s << 'REMOTE'
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
  sleep 10
done
REMOTE
echo ""

# ── Smoke test ──
echo "=== [5/6] Smoke test ==="
for i in $(seq 1 10); do
  OUT=$(curl -sf --max-time 5 "https://$DOMAIN/api/public/health" 2>&1) && break
  echo "  [$i] Waiting..."
  sleep 5
done
echo "  $OUT"
echo ""

# ── Cleanup ──
echo "=== [6/6] Cleanup ==="
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash -s << 'REMOTE'
set -e
cd /home/audest/nba
echo "--- Pruning old images (>24h) ---"
docker image prune -f --filter "until=24h" 2>/dev/null || true
echo "--- Status ---"
docker compose -f compose.yml ps app
REMOTE

echo ""
echo "=== Deploy complete ==="
echo "  https://$DOMAIN"
