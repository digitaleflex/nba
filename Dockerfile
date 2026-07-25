# Base image using Alpine for security and minimal footprint
FROM node:22-alpine AS base
RUN npm install -g pnpm@10
WORKDIR /app

# Step 1a: Install all dependencies (including devDependencies for build)
FROM base AS deps
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/design-system/package.json ./packages/design-system/
RUN pnpm install --frozen-lockfile

# Step 1b: Install ONLY production dependencies for runtime image (lean).
# tsx, pm2, prisma sont en dependencies, donc inclus.
# eslint, vitest, @types/*, etc. (devDependencies) ne sont PAS installes.
FROM base AS runner-deps
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/design-system/package.json ./packages/design-system/
RUN pnpm install --frozen-lockfile --prod

# Step 2: Shared base for app and worker - source code + generated Prisma client.
# Both the Next.js build and the worker need this; keeping it as its own stage
# avoids running `COPY . .` and `prisma generate` twice.
FROM base AS prepared
COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema + config FIRST (rarely changes).
# prisma generate est en cache tant que prisma/ n'est pas modifié,
# même si le code source change => gain sur les builds frequents.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm prisma generate

# Copy all source code (changes often, invalidates build layer only)
COPY . .

# Step 3: Build the Next.js application
FROM prepared AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Compile Next.js app to standalone output.
# `next build` échoue déjà si le middleware ne compile pas ; aucune garde
# maison n'est nécessaire (les chemins internes de Next changent entre versions,
# ex. middleware -> proxy en Next 16, ce qui cassait le déploiement à tort).
RUN --mount=type=cache,target=/app/.next/cache pnpm build

# Step 4: Production runner for Next.js Web App
FROM base AS runner
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install pg_isready for database readiness check + CA certificates for TLS
RUN apk add --no-cache postgresql-client ca-certificates

# Create a non-root system user for security hardening
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Pre-create storage directory with correct ownership (avoids runtime chown as root)
RUN mkdir -p /app/storage && chown -R nextjs:nodejs /app/storage

# Copy production-only node_modules (tsx, pm2, prisma inclus ; eslint, vitest,
# @types/*, etc. exclus). Environ 200-300MB de gagnes par rapport a --from=deps.
COPY --from=runner-deps /app/node_modules ./node_modules

# Copy standalone build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
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

# Security: run as non-root (uid 1001). The entrypoint no longer needs root
# because storage dir creation and chown are done at build time.
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pnpm exec tsx scripts/healthcheck.ts || exit 1

# Entrypoint runs migrations + seed + starts app
ENTRYPOINT ["./docker-entrypoint.sh"]
