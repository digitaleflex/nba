#!/bin/sh
set -e

echo "=== NeverBrokeAgain - App Startup ==="

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

# Note: `migrate deploy` est execute par le workflow GitHub Actions AVANT
# `docker compose up -d` (cf. .github/workflows/deploy.yml), PAS au demarrage
# du container. Raison : race avec pgbouncer qui detient parfois
# l'advisory lock Prisma (P1002 timeout).

# Seed database (idempotent - uses upsert)
echo "Seeding database..."
pnpm db:seed

# Create admin user if env vars are set
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Creating admin user..."
  ADMIN_NAME="${ADMIN_NAME:-$(echo $ADMIN_EMAIL | cut -d'@' -f1)}"
  pnpm tsx scripts/createAdmin.ts --email="$ADMIN_EMAIL" --password="$ADMIN_PASSWORD" --name="$ADMIN_NAME" || true
fi

# Ensure storage directory exists and is owned by nextjs user
mkdir -p /app/storage
chown -R nextjs:nodejs /app/storage

echo "=== Setup complete. Starting app... ==="

# Build the PM2 ecosystem dynamically based on WS_ENABLED
if [ "$WS_ENABLED" = "true" ]; then
  echo "Starting WebSocket + Next.js via PM2..."
  ECOSYSTEM_FILE="/app/ecosystem.config.cjs"
  cat > "$ECOSYSTEM_FILE" <<'EOF'
module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "server.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "websocket",
      script: "workers/websocket.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      instances: 1,
      autorestart: true,
      max_memory_restart: "256M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
EOF
  chown nextjs:nodejs "$ECOSYSTEM_FILE"
  exec su -s /bin/sh -c "exec npx pm2-runtime start $ECOSYSTEM_FILE" nextjs
else
  exec su -s /bin/sh -c 'exec node server.js' nextjs
fi
