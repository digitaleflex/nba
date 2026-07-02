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

# Step 2: Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/design-system/node_modules ./packages/design-system/node_modules
COPY . .

# Generate Prisma client for application execution
RUN pnpm prisma generate

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Compile Next.js app to standalone output
RUN pnpm build

# Step 3: Production runner for Next.js Web App
FROM base AS runner
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install pg_isready for database readiness check in entrypoint
RUN apk add --no-cache postgresql-client

# Create a non-root system user for security hardening
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy seed and createAdmin scripts (needed at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy pnpm-lock and package.json for pnpm install at runtime
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nextjs:nodejs /app/packages/design-system/package.json ./packages/design-system/package.json

USER root

EXPOSE 3000

# Entrypoint runs migrations + seed + starts app
ENTRYPOINT ["./docker-entrypoint.sh"]

# Step 4: Production runner for BullMQ Queue Worker
FROM base AS worker
ENV NODE_ENV production

# Install tsx globally + pg_isready for entrypoint
RUN pnpm add -g tsx
RUN apk add --no-cache postgresql-client

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/design-system/node_modules ./packages/design-system/node_modules
COPY . .

# Generate Prisma client for worker access
RUN pnpm prisma generate

# Copy entrypoint script
COPY docker-entrypoint-worker.sh ./docker-entrypoint-worker.sh
RUN chmod +x ./docker-entrypoint-worker.sh

ENTRYPOINT ["./docker-entrypoint-worker.sh"]
