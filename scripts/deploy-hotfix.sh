#!/usr/bin/env bash
# Hotfix deploy — copie les fichiers changes + restart PM2 (< 2 min)
# Usage: ./scripts/deploy-hotfix.sh [commit/base]
#   Sans Docker, rebuild le .next en local (ou via cached CI) et rsync sur le VPS

set -euo pipefail

SHA="$(git rev-parse --short HEAD)"
VPS="${1:-vps1-nba}"
REMOTE_DIR="/home/audest/nba"
CONTAINER="nba-app-1"

echo "╔═══════════════════════════════════════════╗"
echo "║  NBA Hotfix Deploy (< 2 min)              ║"
echo "╚═══════════════════════════════════════════╝"
echo "  SHA : $SHA"
echo "  VPS : $VPS"
echo ""

# ── Vérifier connexion VPS ──
if ! ping -c 1 -W 2 "$VPS" >/dev/null 2>&1; then
  echo "❌ VPS '$VPS' injoignable"
  exit 1
fi

# ── Copier les fichiers sources modifies sur le VPS ──
echo "=== Copie des fichiers modifies ==="
git diff --name-only HEAD~1 HEAD | while read -r f; do
  dest="$REMOTE_DIR/$f"
  ssh "$VPS" "mkdir -p $(dirname "$dest")"
  scp "$f" "$VPS:$dest" && echo "  ✅ $f"
done

# ── Build .next dans le conteneur ──
echo "=== Rebuild .next ==="
ssh "$VPS" "
  cd $REMOTE_DIR
  # Copier les fichiers dans le conteneur
  for f in \$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo ''); do
    docker cp \"\$f\" $CONTAINER:/app/\"\$f\" 2>/dev/null || true
  done
  # Relancer next build dans le conteneur (incremental)
  docker exec $CONTAINER sh -c 'cd /app && npx next build 2>&1 | tail -5'
"

# ── Redemarrer PM2 ──
echo "=== Redemarrage ==="
ssh "$VPS" "docker exec $CONTAINER npx pm2 restart nextjs 2>&1"

echo "✅ Hotfix deployé en $(($SECONDS/60)) min"
