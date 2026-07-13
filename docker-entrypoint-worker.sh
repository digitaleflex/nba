#!/bin/sh
set -e

echo "=== NeverBrokeAgain - Worker Startup ==="

# Wait for database to be ready. Neon is configured through DATABASE_URL.
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

echo "Waiting for database..."
until pg_isready -d "$DATABASE_URL" -q 2>/dev/null; do
  sleep 1
done
echo "Database is ready."

# Sync schema (safe: creates tables/columns only, never drops data)
echo "Syncing database schema..."
pnpm prisma migrate deploy

# Seed database (idempotent - uses upsert)
echo "Seeding database..."
pnpm db:seed

# Configure B2 CLI
if [ -n "$B2_APPLICATION_KEY_ID" ] && [ -n "$B2_APPLICATION_KEY" ]; then
  b2 authorize-account "$B2_APPLICATION_KEY_ID" "$B2_APPLICATION_KEY" >/dev/null 2>&1
  echo "B2 backup configured"

  # Daily backup at 2am
  echo "0 2 * * * /app/scripts/backup.sh >> /var/log/backup.log 2>&1" | crontab -
  crond -b
  echo "Backup cron installed (daily at 02:00)"
fi

echo "=== Setup complete. Starting worker... ==="
exec pnpm exec tsx workers/queue.ts
