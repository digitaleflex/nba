#!/bin/sh
set -e

echo "=== NeverBrokeAgain - App Startup ==="

# Wait for database to be ready
echo "Waiting for database..."
until pg_isready -h "${PGHOST:-db}" -p "${PGPORT:-5432}" -U "${PGUSER:-nba}" -q 2>/dev/null; do
  sleep 1
done
echo "Database is ready."

# Apply migrations (requires root)
echo "Applying database migrations..."
pnpm prisma migrate deploy

# Seed database (idempotent - uses upsert)
echo "Seeding database..."
pnpm db:seed

# Create admin user if env vars are set
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Creating admin user..."
  ADMIN_NAME="${ADMIN_NAME:-$(echo $ADMIN_EMAIL | cut -d'@' -f1)}"
  pnpm tsx scripts/createAdmin.ts --email="$ADMIN_EMAIL" --password="$ADMIN_PASSWORD" --name="$ADMIN_NAME" || true
fi

echo "=== Setup complete. Starting app... ==="

# Drop privileges to nextjs user for running the server
exec su -s /bin/sh -c 'exec node server.js' nextjs
