#!/usr/bin/env bash
# Deploy NBA via Tailscale — build local + push direct au VPS (sans GHCR)
# Usage: ./scripts/deploy-tailscale.sh [vps-host]
#   vps-host: IP Tailscale du VPS (defaut: vps1-nba)

set -euo pipefail

SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "local")"
VPS="${1:-vps1-nba}"
DOMAIN="access.signauxx.com"
REMOTE_DIR="/home/audest/nba"

echo "╔═══════════════════════════════════════════╗"
echo "║  NBA Deploy via Tailscale                 ║"
echo "╚═══════════════════════════════════════════╝"
echo "  Commit : $SHA"
echo "  VPS    : $VPS (via Tailscale)"
echo ""

# ── Vérifier Tailscale ──
if ! ping -c 1 -W 2 "$VPS" >/dev/null 2>&1; then
  echo "❌ VPS '$VPS' injoignable. Vérifie Tailscale : tailscale status"
  exit 1
fi
echo "✅ Connexion Tailscale OK"

# ── Récupérer les clés depuis le VPS ──
echo "=== Récupération des variables d'env depuis le VPS ==="
VAPID_KEY=$(ssh "$VPS" "grep ^NEXT_PUBLIC_VAPID_PUBLIC_KEY $REMOTE_DIR/.env | cut -d= -f2-")
echo "  NEXT_PUBLIC_VAPID_PUBLIC_KEY récupérée"

# ── Build app ──
echo "=== Build image app ==="
docker build \
  --build-arg NEXT_PUBLIC_APP_URL="https://$DOMAIN" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$VAPID_KEY" \
  -t "ghcr.io/digitaleflex/nba:$SHA" \
  -t "ghcr.io/digitaleflex/nba:latest" \
  -f Dockerfile .
echo "  ✅ App image buildée"

# ── Build worker ──
echo "=== Build image worker ==="
docker build \
  -t "ghcr.io/digitaleflex/nba-worker:$SHA" \
  -t "ghcr.io/digitaleflex/nba-worker:latest" \
  -f Dockerfile.worker .
echo "  ✅ Worker image buildée"

# ── Transfert au VPS ──
echo "=== Transfert des images vers le VPS ==="
echo "  Envoi de app..."
docker save "ghcr.io/digitaleflex/nba:$SHA" | bzip2 | pv -b | ssh "$VPS" "bunzip2 | docker load" 
echo "  Envoi de worker..."
docker save "ghcr.io/digitaleflex/nba-worker:$SHA" | bzip2 | pv -b | ssh "$VPS" "bunzip2 | docker load"
echo "  ✅ Images transférées"

# ── Déploiement ──
echo "=== Déploiement sur le VPS ==="
ssh "$VPS" "cd $REMOTE_DIR && \
  echo '--- Backup ---' && \
  timeout 300 docker compose -f compose.yml run --rm --entrypoint 'sh /app/scripts/backup.sh' worker 2>&1 | tail -3 || true && \
  echo '--- Désactivation pull registry ---' && \
  sed -i 's/pull_policy: always/pull_policy: never/' compose.yml && \
  echo '--- Déploiement ---' && \
  NBA_IMAGE_TAG='$SHA' docker compose up -d --no-deps app worker bull-board 2>&1 | tail -5 && \
  echo '--- Restauration pull_policy ---' && \
  git checkout compose.yml && \
  echo '--- Smoke test ---' && \
  for i in \$(seq 1 12); do \
    CODE=\$(curl -s -o /dev/null -w '%{http_code}' -m 5 \"https://$DOMAIN/api/public/health\" 2>/dev/null || echo 000); \
    echo \"  [\$i] HTTP \$CODE\"; \
    if echo \"\$CODE\" | grep -q '2'; then break; fi; \
    sleep 5; \
  done && \
  echo '✅ Deploy terminé'"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  Deploy terminé                           ║"
echo "║  https://$DOMAIN           ║"
echo "╚═══════════════════════════════════════════╝"
