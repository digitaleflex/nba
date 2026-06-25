# Project Context

> For AI agents. Concise summary of the NBA project.

## Stack
- Next.js 16 (App Router), TypeScript strict, Tailwind + Shadcn UI
- Better Auth (auth), Prisma (ORM), PostgreSQL/Neon (DB)
- BullMQ + Redis (queue/cache), Zod (validation), Resend (email)
- Docker (containerization), Cloudflare (edge)

## Architecture
- **Modular Monolith** — single deploy, isolated modules
- **Service Layer** — business logic in services
- **Repository Pattern** — only repos access Prisma
- **Server Actions** — preferred for authenticated mutations
- **RBAC** — roles: SUPER_ADMIN, ADMIN, KYC_AGENT, SUPPORT_AGENT, MEMBER

## Module Structure
Each module: `components/`, `services/`, `repositories/`, `validators/`, `types/`, `hooks/`, `constants/`

Modules: auth, members, plans, kyc, broker, signals, notifications, admin, settings, audit

## Key Rules
- No `any` type, strict mode enforced
- Business logic never in components or Server Actions
- Only repositories import Prisma
- All input validated with Zod
- Every protected operation checks authorization
- Critical operations emit audit events
- Migrations only via `prisma migrate dev` (dev) or `prisma migrate deploy` (prod)
- `prisma db push` and `prisma migrate reset` prohibited on staging/production

## Environments
- Development (`nba_dev`) — daily work
- Staging (`nba_staging`) — pre-production validation
- Production (`nba_prod`) — live
