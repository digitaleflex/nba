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
pnpm prisma db push

# Seed database (idempotent - uses upsert)
echo "Seeding database..."
pnpm db:seed

echo "=== Setup complete. Starting worker... ==="
exec pnpm exec tsx workers/queue.ts
