# NeverBrokeAgain (NBA)

Trading signal platform. Built with Next.js, TypeScript, Prisma, and a modular monolith architecture.

## Quick Start

```bash
pnpm install
cp .env.example .env.local
docker compose up -d redis
npx prisma generate
npx prisma migrate dev
npx prisma db seed
pnpm dev
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 (strict) |
| Styling | Tailwind CSS + Shadcn UI |
| Auth | Better Auth |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Queue | BullMQ |
| Cache | Redis |
| Validation | Zod |
| Email | Resend |
| Container | Docker / Docker Compose |

## CI/CD Pipeline

### Continuous Integration

| Job | Description | When |
|-----|-------------|------|
| Quality Checks | `pnpm install --frozen-lockfile` → lint → typecheck → `test:coverage` (232+ tests) | PR to `main` / `develop` |
| Build | `pnpm build` | After quality passes |
| Prisma Validate | `prisma validate` | After quality passes |
| Security Scan + SBOM | Docker build → Trivy vuln scan (SARIF) → SPDX SBOM | After quality passes |

### Deployment

| Step | Description |
|------|-------------|
| **Quality Gate** | lint, typecheck, tests, migration destructive guard |
| **Backup** | pg_dump (read-only) → upload to B2 (timeout 300s) |
| **Migrations + Seed** | `prisma migrate deploy` + `pnpm db:seed` in one container |
| **Zero-downtime rollout** | Traefik healthcheck, graceful container swap |
| **Smoke test** | 15 route checks with retry |
| **Auto-rollback** | Restore previous image if smoke test fails |
| **Prune** | Orphan images kept 24h for manual rollback |

## Environments

| Environment | Database | File |
|-------------|----------|------|
| Development | `nba_dev` | `.env.local` |
| Staging | `nba_staging` | `.env.staging` |
| Production | `nba_prod` | `.env.production` |

## Commands

```bash
pnpm dev            # Development server
pnpm build          # Production build
pnpm lint           # ESLint (non-blocking)
pnpm typecheck      # TypeScript check
pnpm test:coverage  # Tests + coverage
pnpm db:dev         # Prisma migrate dev
pnpm db:deploy      # Prisma migrate deploy
pnpm db:generate    # Prisma generate
pnpm db:seed        # Database seed
```

## Documentation

| Category | Location |
|----------|----------|
| Governance | `docs/00-governance/` |
| Product | `docs/01-product/` |
| Architecture | `docs/02-architecture/` |
| Database | `docs/03-database/` |
| API | `docs/04-api/` |
| Development | `docs/05-development/` |
| Security | `docs/06-security/` |
| DevOps | `docs/07-devops/` |
| UI | `docs/08-ui/` |
| AI | `docs/09-ai/` |
| Testing | `docs/10-testing/` |
| Audits | `docs/audits/` |
| Runbooks | `docs/ops/` |

## License

MIT
