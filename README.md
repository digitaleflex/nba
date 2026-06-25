# NeverBrokeAgain (NBA)

Trading signal platform. Built with Next.js, TypeScript, Prisma, and a modular monolith architecture.

## Quick Start

```bash
pnpm install
cp .env.example .env.local
docker compose up -d redis
npx prisma migrate dev
npx prisma db seed
pnpm dev
```

## Documentation

Start here: [ENGINEERING_HANDBOOK.md](./ENGINEERING_HANDBOOK.md)

| Category | Location |
|----------|----------|
| Product | `docs/01-product/` |
| Architecture | `docs/02-architecture/` |
| Database | `docs/03-database/` |
| API | `docs/04-api/` |
| Development | `docs/05-development/` |
| Security | `docs/06-security/` |
| DevOps | `docs/07-devops/` |
| AI | `docs/09-ai/` |

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn UI |
| Auth | Better Auth |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Queue | BullMQ |
| Cache | Redis |
| Validation | Zod |
| Email | Resend |
| Container | Docker |

## Environments

| Environment | Database | File |
|-------------|----------|------|
| Development | `nba_dev` | `.env.local` |
| Staging | `nba_staging` | `.env.staging` |
| Production | `nba_prod` | `.env.production` |

## Commands

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
pnpm test         # Tests
pnpm db:dev       # Prisma migrate dev
pnpm db:deploy    # Prisma migrate deploy
pnpm db:generate  # Prisma generate
pnpm db:seed      # Database seed
```

## License

MIT
