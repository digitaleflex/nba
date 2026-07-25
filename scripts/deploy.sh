#!/usr/bin/env bash
# Deploy NBA — zero-downtime avec mode maintenance automatique.
# Auto-détection : si exécuté sur le VPS → déploiement local,
# sinon → build + push ghcr.io + SSH deploy.
#
# Usage: ./scripts/deploy.sh
#
# Prérequis (mode distant) : clé SSH ~/.ssh/nba, accès push ghcr.io.

set -euo pipefail

SHA="$(git rev-parse --short HEAD)"
FULL_SHA="$(git rev-parse HEAD)"
IMAGE="ghcr.io/digitaleflex/nba"
WORKER_IMAGE="ghcr.io/digitaleflex/nba-worker"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOMAIN="access.signauxx.com"
SSH_HOST="${SSH_HOST:-access.signauxx.com}"
SSH_USER="${SSH_USER:-audest}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/nba}"

ON_VPS=false
if docker inspect nba-app-1 >/dev/null 2>&1; then
  ON_VPS=true
fi

echo "╔═══════════════════════════════════════════╗"
echo "║     NBA Deploy (zero-downtime)            ║"
echo "╚═══════════════════════════════════════════╝"
echo "  Commit : $SHA"
echo "  Mode   : $([ "$ON_VPS" = true ] && echo 'local (VPS)' || echo 'distant (SSH)')"
echo ""

echo "=== [1/5] Quality Gate ==="
pnpm typecheck || { echo "Typecheck failed — deploy aborted"; exit 1; }
echo "  OK"
echo ""

echo "=== [2/5] Build images ==="
mkdir -p /tmp/.buildx-cache
VAPID_KEY="${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-$(grep ^NEXT_PUBLIC_VAPID_PUBLIC_KEY .env | cut -d= -f2-)}"

# App image
docker buildx build \
  --cache-from=type=local,src=/tmp/.buildx-cache \
  --cache-to=type=local,dest=/tmp/.buildx-cache,mode=max \
  --build-arg NEXT_PUBLIC_APP_URL="https://$DOMAIN" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$VAPID_KEY" \
  -t "$IMAGE:$IMAGE_TAG" \
  -t "$IMAGE:$FULL_SHA" \
  .

# Worker image
docker buildx build \
  --cache-from=type=local,src=/tmp/.buildx-cache \
  --cache-to=type=local,dest=/tmp/.buildx-cache,mode=max \
  -t "$WORKER_IMAGE:$IMAGE_TAG" \
  -t "$WORKER_IMAGE:$FULL_SHA" \
  -f Dockerfile.worker .
echo ""

deploy_local() {
  echo "=== [3/5] Maintenance ON ==="
  docker compose --profile maintenance up -d maintenance 2>&1 | tail -1

  echo "=== [4/5] Deploy ==="
  # Capture des images actuelles avant deploiement pour rollback
  PREV_IMAGE="$(docker images --no-trunc -q ghcr.io/digitaleflex/nba:$IMAGE_TAG 2>/dev/null | head -1 || true)"
  PREV_WORKER_IMAGE="$(docker images --no-trunc -q ghcr.io/digitaleflex/nba-worker:$IMAGE_TAG 2>/dev/null | head -1 || true)"
  echo "  Images precedentes: app=${PREV_IMAGE:-<aucune>}, worker=${PREV_WORKER_IMAGE:-<aucune>}"

  NBA_IMAGE_TAG="$IMAGE_TAG" docker compose up -d --no-deps app worker bull-board 2>&1 | tail -3

  echo "--- Waiting for healthy ---"
  for i in $(seq 1 30); do
    STATUS=$(docker inspect nba-app-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    echo "  [$i] $STATUS"
    if [ "$STATUS" = "healthy" ]; then break; fi
    sleep 5
  done

  echo "--- Migrations ---"
  DIRECT_URL="$(echo "$DATABASE_URL" | sed 's/-pooler//')"
  docker compose exec -e DIRECT_URL="$DIRECT_URL" app npx prisma migrate deploy 2>&1 && echo "  Migrations OK" || {
    echo "  Migration failed — rollback"
    PREV_IMAGE="$PREV_IMAGE" PREV_WORKER_IMAGE="$PREV_WORKER_IMAGE" bash scripts/rollback.sh || true
    exit 1
  }

  echo "--- Smoke test ---"
  for i in $(seq 1 10); do
    if curl -sf "http://127.0.0.1:3000/api/public/health" > /dev/null 2>&1; then
      echo "  Smoke test OK"
      break
    fi
    echo "  [$i] Waiting for app..."
    sleep 3
  done

  echo "=== [5/5] Maintenance OFF ==="
  docker compose --profile maintenance rm -sf maintenance 2>&1 | tail -1
}

deploy_remote() {
  echo "=== [3/5] Push to ghcr.io ==="
  docker push "$IMAGE:$IMAGE_TAG"
  docker push "$IMAGE:$FULL_SHA"
  docker push "$WORKER_IMAGE:$IMAGE_TAG"
  docker push "$WORKER_IMAGE:$FULL_SHA"
  echo ""

  echo "=== [4/5] Remote deploy ==="
  ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" IMAGE_TAG="$IMAGE_TAG" bash -s << 'REMOTE'
    set -euo pipefail
    cd /home/audest/nba

    # Capture des images actuelles avant deploiement pour rollback
    PREV_IMAGE="$(docker images --no-trunc -q ghcr.io/digitaleflex/nba:$IMAGE_TAG 2>/dev/null | head -1 || true)"
    PREV_WORKER_IMAGE="$(docker images --no-trunc -q ghcr.io/digitaleflex/nba-worker:$IMAGE_TAG 2>/dev/null | head -1 || true)"
    echo "  Images precedentes: app=${PREV_IMAGE:-<aucune>}, worker=${PREV_WORKER_IMAGE:-<aucune>}"

    echo "--- Maintenance ON ---"
    docker compose --profile maintenance up -d maintenance 2>&1 | tail -1
    echo "--- Pull new images ---"
    NBA_IMAGE_TAG="$IMAGE_TAG" docker compose pull app worker bull-board 2>&1 | tail -3
    echo "--- Deploy ---"
    NBA_IMAGE_TAG="$IMAGE_TAG" docker compose up -d --no-deps app worker bull-board 2>&1 | tail -3
    echo "--- Waiting for healthy ---"
    for i in $(seq 1 30); do
      STATUS=$(docker inspect nba-app-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
      echo "  [$i] $STATUS"
      if [ "$STATUS" = "healthy" ]; then break; fi
      sleep 5
    done
    echo "--- Migrations ---"
    DIRECT_URL="$(echo "$DATABASE_URL" | sed 's/-pooler//')"
    docker compose exec -e DIRECT_URL="$DIRECT_URL" app npx prisma migrate deploy 2>&1 && echo "  Migrations OK" || {
      echo "  Migration failed — rollback"
      PREV_IMAGE="$PREV_IMAGE" PREV_WORKER_IMAGE="$PREV_WORKER_IMAGE" bash scripts/rollback.sh || true
      exit 1
    }
    echo "--- Smoke test ---"
    for i in $(seq 1 10); do
      if curl -sf "http://127.0.0.1:3000/api/public/health" > /dev/null 2>&1; then
        echo "  Smoke test OK"
        break
      fi
      echo "  [$i] Waiting for app..."
      sleep 3
    done
    echo "--- Maintenance OFF ---"
    docker compose --profile maintenance rm -sf maintenance 2>&1 | tail -1
    echo "Deploy complete on VPS"
REMOTE
  echo ""
  echo "=== [5/5] Smoke test distant ==="
  curl -sf --max-time 10 "https://$DOMAIN/api/public/health" && echo ""
}

if [ "$ON_VPS" = true ]; then
  deploy_local
else
  deploy_remote
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║         Deploy complete                   ║"
echo "║  https://$DOMAIN           ║"
echo "╚═══════════════════════════════════════════╝"
