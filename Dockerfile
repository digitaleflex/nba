# Base image using Alpine for security and minimal footprint
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Step 1: Install all dependencies (including devDependencies for build)
FROM base AS deps
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/design-system/package.json ./packages/design-system/
RUN pnpm install --frozen-lockfile

# Step 2: Shared base for app and worker - source code + generated Prisma client.
# Both the Next.js build and the worker need this; keeping it as its own stage
# avoids running `COPY . .` and `prisma generate` twice.
FROM base AS prepared
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate

# Step 3: Build the Next.js application
FROM prepared AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Compile Next.js app to standalone output
RUN pnpm build

# Verify the middleware/proxy is properly included in the build output.
# (function names get minified in standalone, so check for the file itself)
RUN if ! ls .next/server/src/proxy.js 2>/dev/null && ! ls .next/server/middleware.js 2>/dev/null; then \
      echo "❌ BUILD ERROR: middleware/proxy not found in build output" && \
      exit 1; \
    else \
      echo "✅ Middleware compiled successfully"; \
    fi

# Step 4: Production runner for Next.js Web App
FROM base AS runner
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install pg_isready for database readiness check in entrypoint
RUN apk add --no-cache postgresql-client

# Create a non-root system user for security hardening
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy full node_modules: required because docker-entrypoint.sh runs
# `pnpm prisma migrate deploy` and `pnpm db:seed` (tsx) at container startup.
# These are devDependencies not traced/included by the Next.js standalone output.
COPY --from=deps /app/node_modules ./node_modules

# Copy standalone build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy seed, createAdmin and healthcheck scripts (needed at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy WebSocket server
COPY --from=builder --chown=nextjs:nodejs /app/workers ./workers

# Copy package.json and lockfiles so `pnpm <script>` (db:seed, prisma) resolves correctly at runtime
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nextjs:nodejs /app/packages/design-system/package.json ./packages/design-system/package.json

# USER root is required here: docker-entrypoint.sh runs migrations/seed as root,
# then drops privileges to the `nextjs` user (via `su`) before starting the server.
USER root

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pnpm exec tsx scripts/healthcheck.ts || exit 1

# Entrypoint runs migrations + seed + starts app
ENTRYPOINT ["./docker-entrypoint.sh"]
