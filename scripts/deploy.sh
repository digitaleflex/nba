#!/usr/bin/env bash
set -euo pipefail

SHA="${1:-$(git rev-parse --short HEAD)}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REGISTRY="ghcr.io/digitaleflex/nba"
DOMAIN="access.signauxx.com"
SSH_HOST="${SSH_HOST}"
SSH_USER="${SSH_USER}"
SSH_KEY="${SSH_KEY}"

echo "╔═══════════════════════════════════════════╗"
echo "║         NBA Deploy Script                 ║"
echo "╚═══════════════════════════════════════════╝"
echo "  Branch : $BRANCH"
echo "  Commit : $SHA"
echo "  Image  : $REGISTRY:$SHA"
echo ""

# ── Quality gate ──
echo "=== Quality Gate ==="
pnpm typecheck
pnpm test
echo ""

# ── Docker build ──
echo "=== Build image ==="
docker build \
  --build-arg NEXT_PUBLIC_APP_URL="https://$DOMAIN" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="${VAPID_PUBLIC_KEY}" \
  -t "$REGISTRY:$SHA" \
  -t "$REGISTRY:latest" \
  .
echo ""

# ── Push ──
echo "=== Push image ==="
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$(echo "$REGISTRY" | cut -d/ -f2)" --password-stdin
docker push "$REGISTRY:$SHA"
docker push "$REGISTRY:latest"
echo ""

# ── Deploy via SSH ──
echo "=== Deploy to VPS ==="
ssh -i "${SSH_KEY}" "${SSH_USER}@${SSH_HOST}" bash -s << EOF
set -e
cd /home/audest/nba

echo "--- Backup preventive ---"
timeout 300 docker compose -f compose.yml run --rm --entrypoint "sh /app/scripts/backup.sh" worker > /tmp/backup.log 2>&1 || true
cat /tmp/backup.log

echo "--- Pull images ---"
docker compose -f compose.yml pull app worker bull-board

echo "--- Migrations ---"
DIRECT_URL="\$(echo "\$DATABASE_URL" | sed 's/-pooler//')"
docker compose -f compose.yml run --rm -e DIRECT_URL="\$DIRECT_URL" --entrypoint sh app -c '
  npx prisma migrate deploy 2>&1 || exit 1
  timeout 180 pnpm db:seed 2>&1 || true
'

echo "--- Restart services ---"
docker compose -f compose.yml up -d --no-deps app worker bull-board

echo "--- Smoke test ---"
TEST_URL="https://$DOMAIN" bash scripts/api-smoke-test.sh --wait

echo "--- Cleanup ---"
docker image prune -f --filter "until=24h" || true

echo "--- Status ---"
docker compose -f compose.yml ps app worker bull-board
EOF

echo ""
echo "=== Deploy complete ==="
