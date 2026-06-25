# Deployment

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Table of Contents

1. Introduction
2. Architecture Overview
3. Prerequisites
4. Local Development
5. Docker Setup
6. Environment Configuration
7. Database Setup
8. Build and Deployment
9. Production Deployment
10. CI/CD Pipeline
11. Monitoring
12. Backup and Recovery
13. Scaling
14. Troubleshooting

---

# 1. Introduction

## 1.1 Purpose

This document defines the deployment process for the NeverBrokeAgain platform.

It covers local development, staging, and production environments.

## 1.2 Architecture

```
Cloudflare (CDN, DNS, DDoS)
        │
    Nginx (Reverse Proxy)
        │
  ┌─────┴─────┐
  │           │
NBA App    NBA Worker
  │           │
  └─────┬─────┘
        │
     Redis
        │
  Neon PostgreSQL
```

## 1.3 Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `http://localhost:3000` | Local development |
| Staging | `https://staging.neverbrokeagain.com` | Pre-production testing |
| Production | `https://neverbrokeagain.com` | Live application |

---

# 2. Prerequisites

## 2.1 Local Development

- Node.js 22+
- pnpm 9+
- Docker Desktop
- Git

## 2.2 Production Server

- Docker Engine 24+
- Docker Compose 2+
- Minimum 2 vCPU, 4GB RAM
- 50GB NVMe SSD
- Ubuntu 22.04 or Debian 12

---

# 3. Local Development

## 3.1 Clone Repository

```bash
git clone https://github.com/neverbrokeagain/nba.git
cd nba
```

## 3.2 Install Dependencies

```bash
pnpm install
```

## 3.3 Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your local configuration
```

## 3.4 Start Docker Services

```bash
docker compose up -d redis
```

## 3.5 Database Setup

```bash
npx prisma migrate dev
npx prisma db seed
```

## 3.6 Start Development Server

```bash
pnpm dev
```

The application is now available at `http://localhost:3000`.

---

# 4. Docker Setup

## 4.1 Docker Compose Services

```yaml
# docker-compose.yml
services:
  nba-app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL
      - REDIS_URL
      - BETTER_AUTH_SECRET
      - RESEND_API_KEY
    depends_on:
      - redis

  nba-worker:
    build:
      context: .
      target: production
    command: pnpm worker
    environment:
      - DATABASE_URL
      - REDIS_URL
      - BETTER_AUTH_SECRET
      - RESEND_API_KEY
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx:/etc/nginx/conf.d
    depends_on:
      - nba-app

volumes:
  redis-data:
```

## 4.2 Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

---

# 5. Environment Configuration

## 5.1 Required Variables

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Redis
REDIS_URL=redis://localhost:6379

# Better Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx

# Cloudflare
CLOUDFLARE_API_TOKEN=your-token
```

## 5.2 Environment Validation

Environment variables are validated at application startup using Zod:

```typescript
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith("re_"),
})

export const env = envSchema.parse(process.env)
```

---

# 6. Database Setup

## 6.1 Neon PostgreSQL

1. Create a Neon account at https://neon.tech.
2. Create a new project.
3. Copy the connection string.
4. Add the connection string to environment variables.

## 6.2 Run Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

## 6.3 Seed Database

```bash
npx prisma db seed
```

---

# 7. Build and Deployment

## 7.1 Build

```bash
pnpm build
```

The build output is in the `.next` directory.

## 7.2 Production Build with Docker

```bash
docker compose build
```

## 7.3 Start Production

```bash
docker compose up -d
```

## 7.4 Verify Deployment

```bash
curl https://neverbrokeagain.com/api/public/health
# Response: { "status": "healthy", "timestamp": "..." }
```

---

# 8. Production Deployment

## 8.1 Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create application directory
mkdir -p /opt/nba
cd /opt/nba
```

## 8.2 Deploy Application

```bash
# Clone repository
git clone https://github.com/neverbrokeagain/nba.git .

# Create environment file
cp .env.example .env
nano .env  # Edit with production values

# Build and start
docker compose up -d --build
```

## 8.3 Database Migration

```bash
docker compose exec nba-app npx prisma migrate deploy
```

## 8.4 Verify

```bash
docker compose ps
docker compose logs -f
```

---

# 9. CI/CD Pipeline

## 9.1 Pipeline Stages

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t nba-app .
      - run: docker tag nba-app ghcr.io/neverbrokeagain/nba-app:${{ github.sha }}
      - run: docker push ghcr.io/neverbrokeagain/nba-app:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/nba
            docker compose pull
            docker compose up -d --force-recreate
            docker compose exec -T nba-app npx prisma migrate deploy
```

---

# 10. Monitoring

## 10.1 Health Checks

| Check | Endpoint | Expected |
|-------|----------|----------|
| Application | `GET /api/public/health` | `200 { status: "healthy" }` |
| Database | Prisma connection | Connected |
| Redis | Redis ping | PONG |
| Worker | BullMQ queue status | Active |

## 10.2 Logging

- Application logs: Docker logs (`docker compose logs`).
- Error tracking: Application error logging to stdout.
- Audit logs: PostgreSQL audit_logs table.

## 10.3 Alerts

| Condition | Alert Method |
|-----------|-------------|
| Application down | Email + Telegram |
| Worker queue backlog | Email |
| Failed jobs | Email |
| High error rate | Email |
| Disk space < 20% | Email |

---

# 11. Backup and Recovery

## 11.1 Database Backups

Neon PostgreSQL provides automatic backups:

- Point-in-time recovery (7 days).
- Daily backups.
- Automatic failover.

## 11.2 Application Backups

Application data is stored in PostgreSQL. No persistent file storage requires backup.

Temporary files (KYC, broker videos) are not backed up — they are disposable.

## 11.3 Recovery Procedure

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild containers
docker compose up -d --build

# 3. Run migrations
docker compose exec nba-app npx prisma migrate deploy

# 4. Verify health
curl https://neverbrokeagain.com/api/public/health
```

---

# 12. Scaling

## 12.1 Vertical Scaling

- Increase VPS resources (CPU, RAM).
- Upgrade Neon PostgreSQL compute.

## 12.2 Horizontal Scaling (Future)

- Multiple application instances behind the load balancer.
- Dedicated worker instances.
- Redis cluster.
- PostgreSQL read replicas.

## 12.3 When to Scale

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU usage | > 80% for 10 minutes | Increase CPU allocation |
| Memory usage | > 80% for 10 minutes | Increase RAM allocation |
| Request latency | > 2 seconds p95 | Add application instances |
| Database connections | > 80% of limit | Upgrade Neon compute |
| Worker queue length | > 1000 pending | Add worker instances |

---

# 13. Troubleshooting

## 13.1 Application Won't Start

```bash
# Check logs
docker compose logs nba-app

# Verify environment variables
docker compose exec nba-app env

# Check database connection
docker compose exec nba-app npx prisma db push --dry-run
```

## 13.2 Database Connection Failed

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
docker compose exec nba-app npx prisma db push --dry-run

# Check Neon status
# Visit https://console.neon.tech
```

## 13.3 Redis Connection Failed

```bash
# Check Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping
# Response: PONG
```

## 13.4 Workers Not Processing

```bash
# Check worker logs
docker compose logs nba-worker

# Check queue status
docker compose exec redis redis-cli LLEN bull:signal-distribution:wait

# Restart worker
docker compose restart nba-worker
```

## 13.5 SSL/TLS Issues

```bash
# Verify Cloudflare status
curl -I https://neverbrokeagain.com

# Check certificate
openssl s_client -connect neverbrokeagain.com:443 -servername neverbrokeagain.com
```

---

# 14. Rollback Procedure

## 14.1 Application Rollback

```bash
# Rollback to previous Docker image
docker compose down
docker compose up -d --build  # Rebuilds with previous code if git reverted

# Or use specific image tag
docker compose up -d nba-app:previous-tag
```

## 14.2 Database Rollback

```bash
# Identify the migration to rollback
npx prisma migrate status

# Rollback the last migration
npx prisma migrate down
```

---

# Related Documents

- ADR-007 — Docker
- ADR-008 — Docker Compose
- ADR-010 — Cloudflare
- PROJECT_STRUCTURE.md
- TECHNICAL_ARCHITECTURE.md
- SECURITY.md
