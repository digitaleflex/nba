#!/usr/bin/env bash
# Diagnostic rapide de l'état de l'application NBA (site, WebSocket, PM2, Redis, DB).
# À exécuter sur l'hôte VPS où tournent les conteneurs docker compose.
set -uo pipefail

APP_CONTAINER="${APP_CONTAINER:-nba-app-1}"
DOMAIN="${DOMAIN:-access.signauxx.com}"

# Résolution tolérante du nom du conteneur Redis (varie selon le projet compose).
REDIS_CONTAINER="${REDIS_CONTAINER:-}"
if [ -z "$REDIS_CONTAINER" ]; then
  for CAND in nba-nba-redis-1 nba-redis-1 nba-redis; do
    if docker inspect -f '{{.Id}}' "$CAND" >/dev/null 2>&1; then
      REDIS_CONTAINER="$CAND"; break
    fi
  done
fi

PASS=0
FAIL=0

ok()   { echo -e "  \033[32m✓ PASS\033[0m  $1"; PASS=$((PASS+1)); }
bad()  { echo -e "  \033[31m✗ FAIL\033[0m  $1"; FAIL=$((FAIL+1)); }
info() { echo -e "\033[36m== $1 ==\033[0m"; }

if ! command -v docker >/dev/null 2>&1; then
  echo "docker introuvable, ce script doit tourner sur l'hôte VPS." >&2
  exit 1
fi

# Vérifie qu'un conteneur existe (quel que soit son état).
container_exists() { docker inspect -f '{{.Id}}' "$1" >/dev/null 2>&1; }

echo -e "\033[1mDiagnostic NBA — $DOMAIN\033[0m"

info "Conteneur applicatif"
if container_exists "$APP_CONTAINER"; then
  HEALTH=$(docker inspect -f '{{.State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo "none")
  ok "$APP_CONTAINER présent (health: $HEALTH)"
else
  bad "$APP_CONTAINER absent (démarre-le avec: docker compose up -d app)"
fi

info "Site web (HTTP 200)"
if curl -fsS -o /dev/null -m 10 "https://$DOMAIN/"; then
  ok "GET https://$DOMAIN/ -> 200"
else
  bad "GET https://$DOMAIN/ a échoué"
fi

info "WebSocket / Socket.IO (handshake)"
HANDSHAKE=$(curl -fsS -m 10 "https://$DOMAIN/socket.io/?EIO=4&transport=polling" 2>/dev/null || true)
if echo "$HANDSHAKE" | grep -q '"sid"'; then
  ok "handshake /socket.io/ OK (sid reçu)"
else
  bad "handshake /socket.io/ impossible (Traefik -> 3001 ?)"
fi

info "Processus PM2 (nextjs + websocket)"
  PM2_LIST=$(docker exec --user nextjs "$APP_CONTAINER" npx pm2 list 2>/dev/null || true)
  if [ -z "$PM2_LIST" ]; then
    bad "impossible de lire l'état PM2"
  else
    for APP in nextjs websocket; do
      LINE=$(echo "$PM2_LIST" | grep -E "│[[:space:]]*[0-9]+[[:space:]]*│[[:space:]]*$APP[[:space:]]*│")
      ST=$(echo "$LINE" | awk -F'│' '{ gsub(/^[ \t]+|[ \t]+$/, "", $10); print $10 }')
      if [ "$ST" = "online" ]; then
        ok "PM2 app '$APP' online"
      else
        bad "PM2 app '$APP' status='${ST:-inconnu}'"
      fi
    done
  fi

info "Redis (ping)"
if [ -z "$REDIS_CONTAINER" ]; then
  bad "conteneur Redis introuvable (définis REDIS_CONTAINER)"
else
  REDIS_PW=$(docker exec "$APP_CONTAINER" sh -c 'echo "$REDIS_PASSWORD"' 2>/dev/null || true)
  PING=$(docker exec "$REDIS_CONTAINER" redis-cli ${REDIS_PW:+-a "$REDIS_PW"} ping 2>&1)
  if echo "$PING" | grep -q PONG; then
    ok "Redis ($REDIS_CONTAINER) répond PONG"
  else
    bad "Redis ($REDIS_CONTAINER) ne répond pas (PONG attendu) — sortie: ${PING:0:60}"
  fi
fi

info "Base de données (pg_isready)"
if docker exec "$APP_CONTAINER" sh -c 'pg_isready -d "$DATABASE_URL" -q' 2>/dev/null; then
  ok "Base de données joignable"
else
  bad "Base de données injoignable"
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo -e "\033[32mRésumé: $PASS OK, $FAIL échec — tout va bien.\033[0m"
  exit 0
else
  echo -e "\033[31mRésumé: $PASS OK, $FAIL échec — voir les lignes FAIL ci-dessus.\033[0m"
  exit 1
fi
