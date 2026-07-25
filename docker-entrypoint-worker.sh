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

# Validate critical environment variables at boot (fail fast, clear message).
if [ -z "$REDIS_URL" ]; then
  echo "REDIS_URL is required (BullMQ worker)."
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

# Regenerate Prisma client to match the current DB schema
# (avoids stale client after a CI/CD migration deploy)
echo "Regenerating Prisma client..."
pnpm prisma generate >/dev/null 2>&1 || echo "  (warning: prisma generate failed, continuing with existing client)"

# Configure B2 CLI
if [ -n "$B2_APPLICATION_KEY_ID" ] && [ -n "$B2_APPLICATION_KEY" ]; then
  b2 authorize-account "$B2_APPLICATION_KEY_ID" "$B2_APPLICATION_KEY" >/dev/null 2>&1
  echo "B2 backup configured"

  # Daily backup at 2am (best-effort, may fail under non-root user)
  echo "0 2 * * * /app/scripts/backup.sh >> /var/log/backup.log 2>&1" | crontab - 2>/dev/null || true
  crond -b 2>/dev/null || true
  echo "Backup cron installed (daily at 02:00)"
fi

echo "=== Setup complete. Starting... ==="
exec "$@"
