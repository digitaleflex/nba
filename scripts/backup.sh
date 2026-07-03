#!/bin/sh
set -u

echo "=== NBA Backup ==="
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/tmp/nba-backup-$DATE"
ERROR_LOG="/tmp/nba-backup-error-$DATE.log"
ALERT_EMAIL="${BACKUP_ALERT_EMAIL:-admin@signauxx.com}"

send_alert() {
  local subject="$1"
  local body="$2"
  if [ -n "${RESEND_API_KEY:-}" ]; then
    curl -sf -X POST "https://api.resend.com/emails" \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"from\": \"$RESEND_FROM_EMAIL\",
        \"to\": \"$ALERT_EMAIL\",
        \"subject\": \"$subject\",
        \"text\": \"$body\"
      }" >/dev/null 2>&1 || echo "Failed to send alert email"
  fi
}

cleanup() {
  rm -rf "$BACKUP_DIR" "$ERROR_LOG"
}
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"

# 1. Dump PostgreSQL
echo "Dumping database..."
if ! pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc > "$BACKUP_DIR/db.dump" 2>> "$ERROR_LOG"; then
  send_alert "❌ Backup échoué — dump DB" "La sauvegarde PostgreSQL a échoué sur $HOSTNAME à $DATE.
Consultez les logs du conteneur worker pour plus de détails."
  exit 1
fi

# 2. Archive des fichiers uploadés
if [ -d /app/storage ]; then
  echo "Archiving storage..."
  tar czf "$BACKUP_DIR/storage.tar.gz" -C /app storage 2>> "$ERROR_LOG"
fi

# 3. .env
if [ -f /app/.env ]; then
  cp /app/.env "$BACKUP_DIR/env.txt"
fi

# 4. Upload vers B2
echo "Uploading to B2..."
if ! b2 file upload "$B2_BUCKET" "$BACKUP_DIR/db.dump" "db-$DATE.dump" 2>> "$ERROR_LOG"; then
  send_alert "❌ Backup échoué — upload DB" "L'upload du dump PostgreSQL vers B2 a échoué sur $HOSTNAME à $DATE."
  exit 1
fi

if [ -f "$BACKUP_DIR/storage.tar.gz" ]; then
  if ! b2 file upload "$B2_BUCKET" "$BACKUP_DIR/storage.tar.gz" "storage-$DATE.tar.gz" 2>> "$ERROR_LOG"; then
    send_alert "⚠️ Backup partiel — upload storage" "L'upload des fichiers vers B2 a échoué sur $HOSTNAME à $DATE. Le dump DB est sauvegardé."
  fi
fi

echo "=== Backup done: $DATE ==="
