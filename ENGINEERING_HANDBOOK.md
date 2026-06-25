# NeverBrokeAgain — Engineering Handbook

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Welcome

This is the central index of the NeverBrokeAgain (NBA) engineering documentation.

**Read this first.** Before any code, before any architecture decision, before any pull request.

This handbook explains how to navigate the entire documentation system, what to read based on your role, and the non-negotiable rules of the project.

---

# Table of Contents

1. Project Philosophy
2. Documentation Navigation
3. Reading Paths by Role
4. Non-Negotiable Rules
5. Environments
6. Quick Reference
7. Document Index
8. Contribution Guide

---

# 1. Project Philosophy

## 1.1 What is NBA?

NeverBrokeAgain is a trading signal platform. Administrators create trading signals and distribute them to members based on subscription plans. Members receive signals through in-app notifications, email, and Telegram.

## 1.2 Why This Handbook Exists

This project is designed to be built primarily with AI assistance. The documentation is not an afterthought — it is the foundation.

Every document serves one purpose: **eliminate ambiguity** so that every developer and AI agent produces consistent, correct code without guesswork.

## 1.3 Core Principles

| Principle | Meaning |
|-----------|---------|
| Documentation-first | No code is written without documented specifications |
| Architecture over implementation | ADRs are binding, not suggestions |
| Module isolation | Business modules are self-contained |
| Convention over configuration | Every file has one correct location |
| AI-ready | The codebase is designed for AI agents to navigate |

---

# 2. Documentation Navigation

## 2.1 Document Categories

| Category | Prefix | Purpose |
|----------|--------|---------|
| Governance | `00-governance/` | Project management, glossary, roadmap |
| Product | `01-product/` | Vision, PRD, business rules, user stories |
| Architecture | `02-architecture/` | System design, ADRs, module architecture |
| Database | `03-database/` | Schema, migrations, data dictionary |
| API | `04-api/` | Endpoints, error codes, webhooks |
| Development | `05-development/` | Coding standards, guidelines, workflows |
| Security | `06-security/` | Security architecture, RBAC, threat model |
| DevOps | `07-devops/` | Deployment, Docker, monitoring, runbook |
| UI | `08-ui/` | Design system, components, accessibility |
| AI | `09-ai/` | Agent guides, prompts, context files |
| Testing | `10-testing/` | Test plans, QA checklists, UAT |

## 2.2 Document Dependency Graph

```
ENGINEERING_HANDBOOK.md
        │
        ▼
PROJECT_STRUCTURE.md ─── CODING_STANDARDS.md
        │                        │
        ▼                        ▼
Module documentation       Implementation rules
        │
        ▼
ADRs ─── DATABASE_DESIGN.md ─── API_SPECIFICATION.md
        │
        ▼
SECURITY.md ─── DEPLOYMENT.md ─── TESTING_STRATEGY.md
```

---

# 3. Reading Paths by Role

## 3.1 New Developer (First Day)

| Order | Document | Est. Time |
|-------|----------|-----------|
| 1 | `ENGINEERING_HANDBOOK.md` | 15 min |
| 2 | `00-governance/GLOSSARY.md` | 10 min |
| 3 | `02-architecture/SYSTEM_ARCHITECTURE.md` | 30 min |
| 4 | `02-architecture/PROJECT_STRUCTURE.md` | 20 min |
| 5 | `05-development/CODING_STANDARDS.md` | 30 min |
| 6 | `01-product/BUSINESS_RULES.md` | 20 min |
| 7 | `03-database/DATABASE_DESIGN.md` | 15 min |
| 8 | `04-api/API_SPECIFICATION.md` | 15 min |
| **Total** | | **~2.5 hours** |

## 3.2 Architect

| Order | Document |
|-------|----------|
| 1 | All ADRs (02-architecture/adr/) |
| 2 | `02-architecture/SYSTEM_ARCHITECTURE.md` |
| 3 | `02-architecture/TECHNICAL_ARCHITECTURE.md` |
| 4 | `02-architecture/C4_MODEL.md` |
| 5 | `06-security/SECURITY_ARCHITECTURE.md` |
| 6 | `07-devops/DEPLOYMENT_ARCHITECTURE.md` |

## 3.3 Backend Developer

| Order | Document |
|-------|----------|
| 1 | `05-development/CODING_STANDARDS.md` |
| 2 | `05-development/REPOSITORY_GUIDELINES.md` |
| 3 | `05-development/SERVICE_GUIDELINES.md` |
| 4 | `04-api/API_SPECIFICATION.md` |
| 5 | `03-database/DATA_DICTIONARY.md` |
| 6 | ADRs relevant to current task |

## 3.4 Frontend Developer

| Order | Document |
|-------|----------|
| 1 | `05-development/CODING_STANDARDS.md` |
| 2 | `05-development/COMPONENT_GUIDELINES.md` |
| 3 | `08-ui/DESIGN_SYSTEM.md` |
| 4 | `08-ui/UI_GUIDELINES.md` |
| 5 | `08-ui/ACCESSIBILITY.md` |
| 6 | `04-api/API_SPECIFICATION.md` |

## 3.5 DevOps Engineer

| Order | Document |
|-------|----------|
| 1 | `07-devops/DEPLOYMENT.md` |
| 2 | `07-devops/DOCKER.md` |
| 3 | `07-devops/ENVIRONMENT.md` |
| 4 | `07-devops/OBSERVABILITY.md` |
| 5 | `07-devops/MONITORING.md` |
| 6 | `07-devops/RUNBOOK.md` |

## 3.6 Security Engineer

| Order | Document |
|-------|----------|
| 1 | `06-security/SECURITY.md` |
| 2 | `06-security/SECURITY_ARCHITECTURE.md` |
| 3 | `06-security/THREAT_MODEL.md` |
| 4 | `06-security/INCIDENT_RESPONSE.md` |
| 5 | `02-architecture/adr/ADR-013-File-Upload-Security.md` |

## 3.7 AI Agent

| Order | Document |
|-------|----------|
| 1 | `ENGINEERING_HANDBOOK.md` |
| 2 | `09-ai/AGENTS.md` |
| 3 | `09-ai/AI_CODING_GUIDELINES.md` |
| 4 | `09-ai/ARCHITECTURE_RULES.md` |
| 5 | `09-ai/AI_CHECKLIST.md` |
| 6 | `.context/PROJECT_CONTEXT.md` |
| 7 | `.context/ARCHITECTURE_CONTEXT.md` |

---

# 4. Non-Negotiable Rules

These rules are binding for every developer and AI agent. Violations require immediate reversion.

## 4.1 Architecture

| # | Rule |
|---|------|
| A1 | Business logic lives in services, never in components or Server Actions |
| A2 | Only repositories access Prisma |
| A3 | All external input is validated with Zod |
| A4 | Every protected operation checks authorization |
| A5 | Critical operations emit audit events |

## 4.2 Database

| # | Rule |
|---|------|
| D1 | All schema changes use Prisma migrations |
| D2 | `prisma db push` and `prisma migrate reset` are prohibited in staging and production |
| D3 | Production migrations use `prisma migrate deploy` only |
| D4 | Migration files are immutable once committed |

## 4.3 Security

| # | Rule |
|---|------|
| S1 | Passwords are never stored in plaintext |
| S2 | Secrets are never committed to Git |
| S3 | Frontend visibility never replaces backend authorization |
| S4 | `console.log` is prohibited in committed code |

## 4.4 Code

| # | Rule |
|---|------|
| C1 | TypeScript strict mode is mandatory. No `any` |
| C2 | Every file has a single responsibility |
| C3 | Named exports are preferred over default exports |
| C4 | No circular dependencies |

---

# 5. Environments

## 5.1 Three-Environment Architecture

```
                    Neon
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    Development      Staging        Production
    nba_dev          nba_staging     nba_prod
```

| Environment | Database | Purpose |
|-------------|----------|---------|
| Development | `nba_dev` | Daily development, experiments, migrations |
| Staging | `nba_staging` | Pre-production validation, integration tests |
| Production | `nba_prod` | Live application |

## 5.2 Environment Files

| File | Purpose |
|------|---------|
| `.env.local` | Local development |
| `.env.staging` | Staging configuration |
| `.env.production` | Production configuration |

## 5.3 Commands

```json
{
  "db:dev": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:studio": "prisma studio",
  "db:generate": "prisma generate",
  "db:seed": "tsx prisma/seed.ts"
}
```

---

# 6. Quick Reference

## 6.1 Technology Stack

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

## 6.2 Key Files

| File | Purpose |
|------|---------|
| `lib/db.ts` | Prisma client singleton |
| `lib/auth.ts` | Better Auth configuration |
| `lib/queue.ts` | BullMQ queue instances |
| `lib/middleware.ts` | Next.js middleware |
| `lib/config/app.ts` | Application configuration |
| `prisma/schema.prisma` | Database schema |

## 6.3 Key ADRs

| ADR | Title |
|-----|-------|
| 001 | Modular Monolith |
| 002 | Next.js |
| 003 | Better Auth |
| 004 | Prisma |
| 015 | Repository Pattern |
| 016 | Service Layer |
| 017 | Server Actions |
| 024 | Database Migration Strategy |

---

# 7. Document Index

## 7.1 Governance (`docs/00-governance/`)

| Document | Status | Description |
|----------|--------|-------------|
| README.md | ✅ Done | Governance overview |
| GLOSSARY.md | ✅ Done | Project terminology |
| CHANGELOG.md | ✅ Done | Release history |
| ROADMAP.md | ✅ Done | Development roadmap |
| VERSIONING.md | ✅ Done | Versioning strategy |
| DECISION_LOG.md | ✅ Done | Key project decisions |

## 7.2 Product (`docs/01-product/`)

| Document | Status | Description |
|----------|--------|-------------|
| PRODUCT_VISION.md | ✅ Done | Product vision |
| PRD.md | ✅ Done | Product requirements |
| BUSINESS_RULES.md | ✅ Done | Business logic |
| USER_STORIES.md | ✅ Done | User stories |
| FUNCTIONAL_SPECIFICATION.md | ✅ Done | Functional specs |
| PERSONAS.md | Pending | User personas |
| WORKFLOWS.md | Pending | Business workflows |

## 7.3 Architecture (`docs/02-architecture/`)

| Document | Status | Description |
|----------|--------|-------------|
| SYSTEM_ARCHITECTURE.md | ✅ Done | System overview |
| TECHNICAL_ARCHITECTURE.md | ✅ Done | Technical decisions |
| PROJECT_STRUCTURE.md | ✅ Done | Directory layout |
| DEPENDENCY_GRAPH.md | ✅ Done | Module dependencies |
| MODULE_ARCHITECTURE.md | ✅ Done | Module design |
| C4_MODEL.md | ✅ Done | C4 diagrams |
| adr/ (24 files) | ✅ Done | Architecture decisions |

## 7.4 Database (`docs/03-database/`)

| Document | Status | Description |
|----------|--------|-------------|
| DATABASE_DESIGN.md | ✅ Done | Database architecture |
| ENTITY_RELATIONSHIP.md | ✅ Done | ER diagrams |
| DATA_DICTIONARY.md | ✅ Done | Column definitions |
| MIGRATION_STRATEGY.md | ✅ Done | Migration workflow |
| BACKUP_STRATEGY.md | ✅ Done | Backup procedures |

## 7.5 API (`docs/04-api/`)

| Document | Status | Description |
|----------|--------|-------------|
| API_SPECIFICATION.md | ✅ Done | API reference |
| OPENAPI.yaml | 🟡 Planned | OpenAPI spec |
| ERROR_CODES.md | ✅ Done | Error reference |
| WEBHOOKS.md | ✅ Done | Webhook docs |
| RATE_LIMITING.md | ✅ Done | Rate limits |

## 7.6 Development (`docs/05-development/`)

| Document | Status | Description |
|----------|--------|-------------|
| CODING_STANDARDS.md | ✅ Done | Code rules |
| REPOSITORY_GUIDELINES.md | ✅ Done | Repository patterns |
| SERVICE_GUIDELINES.md | ✅ Done | Service patterns |
| COMPONENT_GUIDELINES.md | ✅ Done | Component patterns |
| TESTING_STRATEGY.md | ✅ Done | Test approach |
| GIT_WORKFLOW.md | ✅ Done | Git conventions |
| CODE_REVIEW.md | ✅ Done | Review process |
| DEPENDENCIES.md | 🟡 Planned | Dependency management |

## 7.7 Security (`docs/06-security/`)

| Document | Status | Description |
|----------|--------|-------------|
| SECURITY.md | ✅ Done | Security policies |
| SECURITY_ARCHITECTURE.md | ✅ Done | Security design |
| RBAC.md | ✅ Done | Role definitions |
| THREAT_MODEL.md | ✅ Done | Threat analysis |
| FILE_UPLOAD_SECURITY.md | ✅ Done | Upload security |
| SESSION_MANAGEMENT.md | ✅ Done | Session docs |
| INCIDENT_RESPONSE.md | ✅ Done | IR procedures |

## 7.8 DevOps (`docs/07-devops/`)

| Document | Status | Description |
|----------|--------|-------------|
| DEPLOYMENT.md | ✅ Done | Deployment guide |
| DEPLOYMENT_ARCHITECTURE.md | ✅ Done | Deployment design |
| DOCKER.md | ✅ Done | Docker setup |
| ENVIRONMENT.md | ✅ Done | Environment config |
| OBSERVABILITY.md | ✅ Done | Observability |
| MONITORING.md | ✅ Done | Monitoring setup |
| LOGGING.md | ✅ Done | Logging strategy |
| DISASTER_RECOVERY.md | ✅ Done | DR procedures |
| RUNBOOK.md | ✅ Done | Operations runbook |

## 7.9 UI (`docs/08-ui/`)

| Document | Status | Description |
|----------|--------|-------------|
| DESIGN_SYSTEM.md | ✅ Done | Design tokens |
| UI_GUIDELINES.md | ✅ Done | UI principles |
| COMPONENT_LIBRARY.md | ✅ Done | Component catalog |
| ACCESSIBILITY.md | ✅ Done | a11y standards |
| BRAND_GUIDELINES.md | ✅ Done | Brand identity |

## 7.10 AI (`docs/09-ai/`)

| Document | Status | Description |
|----------|--------|-------------|
| AGENTS.md | ✅ Done | Agent guide |
| MASTER_PROMPT.md | ✅ Done | Master prompt |
| PROJECT_CONTEXT.md | ✅ Done | Project context |
| AI_CODING_GUIDELINES.md | ✅ Done | AI coding rules |
| ARCHITECTURE_RULES.md | ✅ Done | Architecture rules |
| PROMPT_LIBRARY.md | ✅ Done | Prompt templates |
| AI_WORKFLOW.md | ✅ Done | AI workflow |
| AI_CHECKLIST.md | ✅ Done | AI verification |

## 7.11 Testing (`docs/10-testing/`)

| Document | Status | Description |
|----------|--------|-------------|
| TEST_PLAN.md | ✅ Done | Test strategy |
| TEST_CASES.md | ✅ Done | Test cases |
| QA_CHECKLIST.md | ✅ Done | QA checklist |
| REGRESSION_TESTS.md | ✅ Done | Regression tests |
| UAT.md | ✅ Done | User acceptance |

## 7.12 External Directories

| Location | Purpose |
|----------|---------|
| `.context/` | AI context files (concise summaries) |
| `.prompts/` | Versioned prompt templates |
| `.github/` | CI/CD, templates, code owners |

---

# 8. Contribution Guide

## 8.1 How to Contribute Documentation

1. All documentation is in Markdown.
2. Place files in the correct category directory.
3. Update this handbook's document index.
4. Follow the same structure as existing documents.
5. Document decisions, not implementation details.

## 8.2 How to Add an ADR

1. Create a new file in `docs/02-architecture/adr/ADR-NNN-Title.md`.
2. Follow the ADR template (ADR-000).
3. Include context, decision, alternatives, and consequences.
4. Update this handbook if the ADR affects the document index.

## 8.3 Documentation Standards

- Use `✅ Done`, `🔄 In Progress`, `⏳ Planned` status indicators.
- Every document has a version header.
- Every document references related documents.
- No document exceeds 50 pages.
- AI context documents are 2-5 pages.

---

# 9. Getting Started

## 9.1 Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop
- Neon PostgreSQL account
- Resend account

## 9.2 Quick Start

```bash
git clone https://github.com/neverbrokeagain/nba.git
cd nba
pnpm install
cp .env.example .env.local
docker compose up -d redis
npx prisma migrate dev
npx prisma db seed
pnpm dev
```

## 9.3 First Tasks

New to the project? Start with these tasks:

1. Read this handbook completely.
2. Follow the "New Developer" reading path.
3. Set up your development environment.
4. Read the active ADRs.
5. Pick a small task from the backlog.

---

*This handbook is a living document. Update it as the project evolves.*
