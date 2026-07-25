#!/bin/sh
# Rollback vers l'image precedente — centralise la logique pour eviter la duplication.
# Usage: PREV_IMAGE=<digest> PREV_WORKER_IMAGE=<digest> scripts/rollback.sh
#        PREV_IMAGE=<digest> PREV_WORKER_IMAGE=<digest> TEST_URL=https://... scripts/rollback.sh

set -u

PREV_IMAGE="${PREV_IMAGE:-}"
PREV_WORKER_IMAGE="${PREV_WORKER_IMAGE:-}"
TEST_URL="${TEST_URL:-https://access.signauxx.com}"

if [ -z "$PREV_IMAGE" ] || [ -z "$PREV_WORKER_IMAGE" ]; then
  echo "::warning::Aucune image precedente — rollback impossible."
  exit 1
fi

echo "=== ROLLBACK vers les images precedentes ==="
echo "  app:    $PREV_IMAGE"
echo "  worker: $PREV_WORKER_IMAGE"
docker tag "$PREV_IMAGE" ghcr.io/digitaleflex/nba:latest
docker tag "$PREV_WORKER_IMAGE" ghcr.io/digitaleflex/nba-worker:latest
docker compose -f compose.yml up -d --no-deps app worker bull-board 2>&1 | tail -10

for i in $(seq 1 6); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 10 -L "$TEST_URL/api/auth/captcha" || echo 000)"
  echo "  rollback tentative $i -> HTTP $CODE"
  case "$CODE" in 2*)
    echo "Rollback OK."
    exit 0
    ;;
  esac
  [ "$i" -lt 6 ] && sleep 10
done

echo "::error::Rollback echoue — l'image precedente n'a pas demarre."
exit 1
