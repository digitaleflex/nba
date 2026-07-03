#!/bin/sh
set -e

echo "=== NBA Backup ==="
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/tmp/nba-backup-$DATE"
mkdir -p "$BACKUP_DIR"

# 1. Dump PostgreSQL
echo "Dumping database..."
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc > "$BACKUP_DIR/db.dump"

# 2. Archive des fichiers uploadés (KYC, broker, signals)
if [ -d /app/storage ]; then
  echo "Archiving storage..."
  tar czf "$BACKUP_DIR/storage.tar.gz" -C /app storage
fi

# 3. .env (sans les secrets sensibles optionnel)
if [ -f /app/.env ]; then
  cp /app/.env "$BACKUP_DIR/env.txt"
fi

# 4. Upload vers Backblaze B2
echo "Uploading to B2..."
b2 file upload "$B2_BUCKET" "$BACKUP_DIR/db.dump" "db-$DATE.dump"
if [ -f "$BACKUP_DIR/storage.tar.gz" ]; then
  b2 file upload "$B2_BUCKET" "$BACKUP_DIR/storage.tar.gz" "storage-$DATE.tar.gz"
fi

# 5. Nettoyage local
rm -rf "$BACKUP_DIR"

echo "=== Backup done: $DATE ==="
