#!/bin/sh
set -e

echo "=== NeverBrokeAgain - App Startup ==="

APP_PID=""
cleanup() {
    echo "Received stop signal. Graceful shutdown..."
    if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
        kill -TERM "$APP_PID" 2>/dev/null
        # Wait up to 25s for the process to exit cleanly
        for i in $(seq 1 25); do
            if ! kill -0 "$APP_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
    fi
    echo "Shutdown complete."
    exit 0
}
trap cleanup SIGTERM SIGINT

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

# Validate critical environment variables at boot (fail fast, clear message).
if [ -z "$REDIS_URL" ]; then
  echo "REDIS_URL is required (BullMQ / WebSocket / notifications)."
  exit 1
fi

if [ -z "$BETTER_AUTH_SECRET" ]; then
  echo "BETTER_AUTH_SECRET is required."
  exit 1
fi
if [ ${#BETTER_AUTH_SECRET} -lt 32 ]; then
  echo "BETTER_AUTH_SECRET must be at least 32 characters."
  exit 1
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo "WARNING: RESEND_API_KEY is not set — transactional emails (OTP, password reset) will fail."
fi

# Wait for Redis (Valkey) to be ready to avoid worker crash loops.
echo "Waiting for Redis..."
until node -e "const{default:IORedis}=await import('ioredis');const c=new IORedis(process.env.REDIS_URL,{lazyConnect:true,connectTimeout:2000,maxRetriesPerRequest:1});await c.ping();await c.quit();" >/dev/null 2>&1; do
  sleep 1
done
echo "Redis is ready."

# Note: `migrate deploy` est execute par le workflow GitHub Actions AVANT
# `docker compose up -d` (cf. .github/workflows/deploy.yml), PAS au demarrage
# du container. Raison : race avec pgbouncer qui detient parfois
# l'advisory lock Prisma (P1002 timeout).

# NOTE: db:seed et createAdmin sont executes en ONE-SHOT au deploiement
# (cf. .github/workflows/deploy.yml : `docker compose run --rm app ...`),
# PAS ici a chaque boot. Raison : accelerer le demarrage du container et
# eviter qu'un seed lent/bloquant ne retarde le healthcheck (et donc le
# basculement Traefik zero-down).

echo "=== Setup complete. Starting app... ==="

# Build the PM2 ecosystem dynamically based on WS_ENABLED
# Both modes use a background process pattern so cleanup() trap works.
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
      kill_timeout: 30000,
      listen_timeout: 3000,
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
      kill_timeout: 10000,
      max_memory_restart: "256M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
EOF
  npx pm2-runtime start /app/ecosystem.config.cjs &
  APP_PID=$!
  wait $APP_PID
else
  node server.js &
  APP_PID=$!
  wait $APP_PID
fi
