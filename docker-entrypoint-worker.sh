#!/bin/sh
set -e

echo "=== NeverBrokeAgain - Worker Startup ==="

# Wait for database to be ready
echo "Waiting for database..."
until pg_isready -h "${PGHOST:-db}" -p "${PGPORT:-5432}" -U "${PGUSER:-nba}" -q 2>/dev/null; do
  sleep 1
done
echo "Database is ready."

# Apply migrations (worker also ensures schema is up to date)
echo "Applying database migrations..."
pnpm prisma migrate deploy

# Seed database (idempotent - uses upsert)
echo "Seeding database..."
pnpm db:seed

echo "=== Setup complete. Starting worker... ==="
exec tsx workers/queue.ts
