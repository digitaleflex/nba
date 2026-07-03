#!/bin/sh
# Auto-update worker from ghcr.io
# Runs every 5 min via cron
# Lock prevents concurrent runs

set -e

LOCK=/tmp/nba-worker-update.lock
LOG=/var/log/nba-auto-update.log
COMPOSE_DIR=/home/fantome/nba-app
COMPOSE_FILE="$COMPOSE_DIR/compose.vps2.yml"
SERVICE_NAME=nba-app-worker-1
DOCKER_IMAGE="ghcr.io/digitaleflex/nba-worker:latest"

# Acquire lock
if [ -f "$LOCK" ]; then
  echo "$(date) - Lock exists, skipping" >> "$LOG"
  exit 0
fi
echo $$ > "$LOCK"
trap "rm -f $LOCK" EXIT

cd "$COMPOSE_DIR"

# Get current running image ID
RUNNING_ID=$(docker inspect --format='{{.Image}}' "$SERVICE_NAME" 2>/dev/null || echo "")

# Pull new image
docker pull "$DOCKER_IMAGE" 2>&1 | tee -a "$LOG" >/dev/null

# Get pulled image ID
LATEST_ID=$(docker inspect --format='{{.Id}}' "$DOCKER_IMAGE" 2>/dev/null || echo "")

if [ -z "$RUNNING_ID" ] || [ "$RUNNING_ID" != "$LATEST_ID" ]; then
  echo "$(date) - New image detected, updating $SERVICE_NAME..." >> "$LOG"
  docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG"
  echo "$(date) - Update complete ($LATEST_ID)" >> "$LOG"
else
  echo "$(date) - No update needed (running $RUNNING_ID)" >> "$LOG"
fi
