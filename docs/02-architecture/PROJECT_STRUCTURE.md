# Project Structure

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Table of Contents

1. Philosophy
2. Root Structure
3. Source Structure
4. App Router Structure
5. Module Structure
6. Shared Components
7. Business Modules
8. Repository Layer
9. Service Layer
10. Validators
11. Workers
12. Email Templates
13. Hooks
14. Constants
15. Types
16. Utilities
17. Configuration
18. Scripts
19. Tests
20. Documentation
21. Naming Conventions
22. Import Rules
23. Dependency Rules
24. AI Rules
25. Best Practices

---

# 1. Philosophy

## 1.1 Why This Structure Exists

This document defines the exact directory and file organization of the NeverBrokeAgain (NBA) project.

Every developer and AI agent **must** follow this structure.

Without this document, each AI tool invents its own organization. After two weeks the project becomes incoherent.

## 1.2 Core Principles

The structure follows these principles:

- **Convention over configuration** — every file has a single intended location.
- **Module isolation** — business modules are self-contained and independent.
- **Layer separation** — presentation, application, domain, and infrastructure are clearly separated.
- **Explicit dependencies** — import rules are defined and enforced.
- **AI-ready** — the structure is designed for AI agents to navigate without ambiguity.

## 1.3 Architecture Style

NBA is a **Modular Monolith**.

The entire application is deployed as a single unit. Business logic is organized into isolated modules.

Refer to ADR-001 for the complete architectural rationale.

## 1.4 Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS, Shadcn UI |
| Language | TypeScript (strict mode) |
| Authentication | Better Auth |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Queue | BullMQ |
| Cache | Redis |
| Containerization | Docker |
| Validation | Zod |
| Email | Resend |

---

# 2. Root Structure

The project root contains only configuration files and top-level directories.

```
nba/
├── .env.example
├── .env.local
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── compose.yml
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── README.md
│
├── app/                  # Next.js App Router
├── components/           # Shared UI components
├── modules/              # Business modules
├── services/             # Shared services
├── repositories/         # Shared repositories
├── workers/              # BullMQ workers
├── lib/                  # Shared library code
├── prisma/               # Prisma schema + migrations
├── scripts/              # Utility scripts
├── tests/                # Test files
├── docker/               # Docker configurations
├── public/               # Static assets
├── styles/               # Global styles
└── docs/                 # Project documentation
```

## 2.1 Root File Rules

- `package.json` — single source of truth for dependencies.
- `tsconfig.json` — strict mode enabled. No `any` exceptions.
- `next.config.ts` — only configuration. No business logic.
- `.env.example` — all required variables documented.
- `.env.local` — never committed to Git.

---

# 3. Source Structure

## 3.1 app/

The `app/` directory follows Next.js App Router conventions.

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
├── providers.tsx           # Client providers
├── not-found.tsx           # 404 page
├── error.tsx               # Global error boundary
├── loading.tsx             # Global loading state
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx          # Dashboard layout (auth required)
│   ├── page.tsx            # Dashboard home
│   │
│   ├── signals/
│   ├── members/
│   ├── kyc/
│   ├── broker/
│   ├── subscriptions/
│   ├── notifications/
│   ├── settings/
│   └── admin/
│
└── api/
    ├── auth/               # Better Auth API routes
    ├── webhooks/           # External webhooks
    └── public/             # Public API endpoints
```

### 3.1.1 Route Group Conventions

- `(auth)` — unauthenticated routes (login, register, password reset).
- `(dashboard)` — authenticated routes requiring a valid session.
- `(admin)` — routes restricted to administrators.

### 3.1.2 Route Handler Rules

- Route Handlers are only for public APIs, webhooks, and external integrations.
- All authenticated mutations use Server Actions.
- Route Handlers must delegate to services.

## 3.2 components/

Global shared components live here. These are reusable UI elements not tied to a specific business module.

```
components/
├── ui/                     # Shadcn UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── dropdown-menu.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   └── ...
│
├── layout/
│   ├── sidebar.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   └── mobile-nav.tsx
│
├── shared/
│   ├── data-table.tsx
│   ├── empty-state.tsx
│   ├── error-state.tsx
│   ├── loading-spinner.tsx
│   ├── confirm-dialog.tsx
│   ├── search-input.tsx
│   └── pagination.tsx
│
└── forms/
    ├── form-field.tsx
    ├── form-section.tsx
    └── form-actions.tsx
```

### 3.2.1 Component Rules

- Components in `components/ui/` are generic and reusable across the entire application.
- Components in `components/shared/` are domain-agnostic but application-specific.
- Components in `components/layout/` define the application shell.
- Business-specific components belong inside their module (see Section 5).

## 3.3 lib/

Shared utility code that is not business-specific.

```
lib/
├── config/
│   ├── app.ts              # Application-wide configuration
│   ├── auth.ts             # Better Auth configuration
│   └── jobs.ts             # BullMQ queue configuration
│
├── utils/
│   ├── cn.ts               # Tailwind class merge utility
│   ├── date.ts             # Date formatting utilities
│   ├── format.ts           # Number and currency formatting
│   └── slug.ts             # Slug generation
│
├── errors/
│   ├── app-error.ts        # Base application error
│   ├── validation-error.ts # Validation error
│   ├── auth-error.ts       # Authentication error
│   └── not-found-error.ts  # Resource not found error
│
├── types/
│   ├── common.ts           # Shared type definitions
│   ├── pagination.ts       # Pagination types
│   └── api.ts              # API response types
│
├── constants/
│   ├── roles.ts            # Role definitions
│   ├── status.ts           # Status enumerations
│   └── limits.ts           # Application limits
│
├── middleware.ts           # Next.js middleware
├── auth.ts                 # Better Auth server instance
├── db.ts                   # Prisma client singleton
├── redis.ts                # Redis connection
└── queue.ts                # BullMQ queue instances
```

### 3.3.1 Library Rules

- `lib/` must never import from `modules/`, `components/`, or `app/`.
- `lib/` may import from external packages only.
- `lib/config/` contains environment-aware configuration objects.
- `lib/utils/` contains pure functions with no side effects.
- `lib/errors/` defines custom error classes for the application.
- `lib/db.ts` — Prisma client is instantiated once and cached.

## 3.4 prisma/

```
prisma/
├── schema.prisma           # Database schema definition
├── migrations/             # Versioned migrations
├── seed.ts                 # Database seed script
└── client.ts               # Re-exported Prisma client
```

### 3.4.1 Prisma Rules

- `schema.prisma` is the single source of truth for the database schema.
- All migrations must be generated with `prisma migrate dev`.
- Direct schema changes in production are prohibited.
- Refer to ADR-024 for the complete migration strategy.

## 3.5 public/

```
public/
├── images/
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── favicon.ico
├── fonts/
└── robots.txt
```

Static assets served directly by Next.js.

## 3.6 styles/

```
styles/
└── globals.css             # Tailwind imports and global styles
```

---

# 4. App Router Structure

## 4.1 Page Conventions

Each page file follows a strict pattern:

```typescript
// app/(dashboard)/members/page.tsx
import { MemberList } from "@/modules/members/components/member-list"
import { getMembers } from "@/modules/members/services/get-members"

export default async function MembersPage() {
  const members = await getMembers()
  return <MemberList members={members} />
}
```

### 4.1.1 Page Rules

- Pages are thin — they fetch data and render components.
- Pages never contain business logic.
- Pages never access Prisma directly.
- Pages may use Server Actions for mutations.
- Pages must handle loading, empty, and error states.

## 4.2 Layout Conventions

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { requireAuth } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar user={session.user} />
        <main>{children}</main>
      </div>
    </div>
  )
}
```

## 4.3 Loading and Error States

Every page segment should have corresponding loading and error files:

```
signals/
├── page.tsx
├── loading.tsx             # Skeleton or spinner
├── error.tsx               # Error boundary
└── not-found.tsx           # 404 (if dynamic)
```

---

# 5. Module Structure

This is the most important section. Each business module is self-contained.

## 5.1 Standard Module Template

```
modules/<module-name>/
├── components/
│   ├── <entity>-list.tsx
│   ├── <entity>-card.tsx
│   ├── <entity>-form.tsx
│   └── <entity>-detail.tsx
│
├── pages/
│   └── (module-specific pages if needed)
│
├── services/
│   ├── create-<entity>.ts
│   ├── get-<entity>.ts
│   ├── update-<entity>.ts
│   └── delete-<entity>.ts
│
├── repositories/
│   ├── <entity>-repository.ts
│   └── <entity>-repository.types.ts
│
├── validators/
│   └── <entity>-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-<entity>.ts
│
└── constants/
    └── index.ts
```

## 5.2 Business Modules

### Core

```
modules/core/
├── config/         # App configuration
├── constants/      # Shared constants
├── events/         # Event definitions
├── exceptions/     # Error classes
├── helpers/        # Helper functions
├── logger/         # Logging service
├── types/          # Shared types
├── utils/          # Utility functions
└── validators/     # Base validators
```

Cross-cutting foundation. No business logic. Used by every other module.

### Auth

```
modules/auth/
├── services/
│   ├── login.ts
│   ├── register.ts
│   ├── logout.ts
│   ├── verify-email.ts
│   ├── reset-password.ts
│   ├── two-factor.ts
│   └── session.ts
│
├── validators/
│   ├── login-schema.ts
│   ├── register-schema.ts
│   └── reset-password-schema.ts
│
├── types/
│   └── index.ts
│
└── constants/
    └── index.ts
```

Uses Better Auth for all authentication operations.

### Users

```
modules/users/
├── components/
│   ├── profile-form.tsx
│   ├── avatar-upload.tsx
│   └── device-list.tsx
│
├── services/
│   ├── get-profile.ts
│   ├── update-profile.ts
│   ├── update-avatar.ts
│   ├── change-password.ts
│   └── delete-account.ts
│
├── repositories/
│   └── user-repository.ts
│
├── validators/
│   └── user-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-profile.ts
│
└── constants/
    └── index.ts
```

Personal profile, preferences, devices. Separate from auth.

### RBAC

```
modules/rbac/
├── components/
│   ├── role-badge.tsx
│   └── permission-list.tsx
│
├── services/
│   ├── get-roles.ts
│   ├── assign-role.ts
│   ├── get-permissions.ts
│   └── check-permission.ts
│
├── repositories/
│   ├── role-repository.ts
│   └── permission-repository.ts
│
├── validators/
│   └── rbac-schema.ts
│
├── types/
│   └── index.ts
│
└── constants/
    └── index.ts
```

Roles and permissions management. Extracted from auth.

### Members

```
modules/members/
├── components/
│   ├── member-list.tsx
│   ├── member-card.tsx
│   ├── member-profile.tsx
│   └── member-form.tsx
│
├── services/
│   ├── get-members.ts
│   ├── get-member.ts
│   ├── update-member.ts
│   ├── suspend-member.ts
│   └── delete-member.ts
│
├── repositories/
│   └── member-repository.ts
│
├── validators/
│   └── member-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-members.ts
│
└── constants/
    └── index.ts
```

Member management (admin view of users).

### Plans

```
modules/plans/
├── components/
│   ├── plan-list.tsx
│   ├── plan-card.tsx
│   ├── plan-form.tsx
│   └── subscription-badge.tsx
│
├── services/
│   ├── get-plans.ts
│   ├── create-plan.ts
│   ├── update-plan.ts
│   ├── assign-plan.ts
│   └── cancel-subscription.ts
│
├── repositories/
│   ├── plan-repository.ts
│   └── subscription-repository.ts
│
├── validators/
│   └── plan-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-plans.ts
│
└── constants/
    └── index.ts
```

Subscription plans and user subscriptions.

### KYC

```
modules/kyc/
├── components/
│   ├── kyc-list.tsx
│   ├── kyc-card.tsx
│   ├── kyc-form.tsx
│   ├── kyc-review.tsx
│   └── kyc-status-badge.tsx
│
├── services/
│   ├── submit-kyc.ts
│   ├── approve-kyc.ts
│   ├── reject-kyc.ts
│   ├── get-kyc.ts
│   └── get-pending-kyc.ts
│
├── repositories/
│   └── kyc-repository.ts
│
├── validators/
│   └── kyc-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-kyc.ts
│
└── constants/
    └── index.ts
```

Identity document verification.

### Broker

```
modules/broker/
├── components/
│   ├── broker-list.tsx
│   ├── broker-card.tsx
│   ├── broker-form.tsx
│   └── broker-review.tsx
│
├── services/
│   ├── submit-broker.ts
│   ├── approve-broker.ts
│   ├── reject-broker.ts
│   └── get-broker.ts
│
├── repositories/
│   └── broker-repository.ts
│
├── validators/
│   └── broker-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-broker.ts
│
└── constants/
    └── index.ts
```

Broker account verification.

### Signals

```
modules/signals/
├── components/
│   ├── signal-list.tsx
│   ├── signal-card.tsx
│   ├── signal-form.tsx
│   ├── signal-detail.tsx
│   └── signal-status-badge.tsx
│
├── services/
│   ├── create-signal.ts
│   ├── publish-signal.ts
│   ├── update-signal.ts
│   ├── delete-signal.ts
│   ├── get-signals.ts
│   └── get-signal.ts
│
├── repositories/
│   └── signal-repository.ts
│
├── validators/
│   └── signal-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-signals.ts
│
└── constants/
    └── index.ts
```

Trading signal CRUD. Does not handle distribution.

### Distribution

```
modules/distribution/
├── services/
│   ├── distribute-signal.ts
│   ├── compute-audience.ts
│   └── schedule-distribution.ts
│
├── repositories/
│   └── audience-repository.ts
│
├── types/
│   └── index.ts
│
└── constants/
    └── index.ts
```

Signal audience computation and distribution. Separated from signal CRUD.

### Notifications

```
modules/notifications/
├── components/
│   ├── notification-list.tsx
│   ├── notification-card.tsx
│   ├── notification-bell.tsx
│   └── notification-preferences.tsx
│
├── services/
│   ├── notification-service.ts
│   ├── get-notifications.ts
│   ├── mark-read.ts
│   └── mark-all-read.ts
│
├── repositories/
│   └── notification-repository.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-notifications.ts
│
└── constants/
    └── index.ts
```

Abstract notification layer. Dispatches to providers.

### Email

```
modules/email/
├── services/
│   ├── send-email.ts
│   └── email-service.ts
│
├── repositories/
│   └── email-repository.ts
│
├── validators/
│   └── email-schema.ts
│
├── types/
│   └── index.ts
│
└── constants/
    └── index.ts
```

Resend email provider. Templates in `emails/`.

### Files

```
modules/files/
├── services/
│   ├── upload-file.ts
│   ├── validate-file.ts
│   ├── delete-file.ts
│   └── cleanup-files.ts
│
├── repositories/
│   └── file-repository.ts
│
├── validators/
│   └── file-schema.ts
│
├── types/
│   └── index.ts
│
└── constants/
    └── index.ts
```

Centralized file handling. Upload, validation, temporary storage, cleanup.

### Admin

```
modules/admin/
├── components/
│   ├── admin-dashboard.tsx
│   ├── user-management.tsx
│   ├── license-management.tsx
│   └── system-overview.tsx
│
├── services/
│   ├── get-dashboard-stats.ts
│   ├── get-system-info.ts
│   └── manage-license.ts
│
├── repositories/
│   └── admin-repository.ts
│
├── validators/
│   └── admin-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-admin.ts
│
└── constants/
    └── index.ts
```

BackOffice dashboard, user management, license management.

### Audit

```
modules/audit/
├── components/
│   ├── audit-log-list.tsx
│   ├── audit-log-detail.tsx
│   └── audit-filters.tsx
│
├── services/
│   ├── get-audit-logs.ts
│   └── create-audit-log.ts
│
├── repositories/
│   └── audit-repository.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-audit-logs.ts
│
└── constants/
    └── index.ts
```

Immutable audit trail for critical operations.

### Settings

```
modules/settings/
├── components/
│   ├── system-settings.tsx
│   └── setting-form.tsx
│
├── services/
│   ├── get-settings.ts
│   └── update-setting.ts
│
├── repositories/
│   └── settings-repository.ts
│
├── validators/
│   └── settings-schema.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-settings.ts
│
└── constants/
    └── index.ts
```

System-wide configuration key-value store.

### Reporting

```
modules/reporting/
├── services/
│   ├── get-member-stats.ts
│   ├── get-signal-stats.ts
│   └── get-revenue-stats.ts
│
├── repositories/
│   └── reporting-repository.ts
│
├── types/
│   └── index.ts
│
├── hooks/
│   └── use-reporting.ts
│
└── constants/
    └── index.ts
```

Statistics, KPIs, charts. Lightweight in V1.

---

# 6. Shared Components

## 6.1 services/

Global services used across multiple modules.

```
services/
├── audit-service.ts        # Audit logging service
├── notification-service.ts # Centralized notification dispatch
└── email-service.ts        # Email sending via Resend
```

### 6.1.1 Service Rules

- Global services are shared utilities with no business logic.
- Global services may be used by any module.
- Business logic services live inside their respective module.

## 6.2 repositories/

Shared repositories for cross-cutting data access.

```
repositories/
└── base-repository.ts      # Base class with common CRUD operations
```

### 6.2.1 Repository Rules

- Module-specific repositories live inside their module.
- Only shared repository abstractions live here (e.g. base repository).

## 6.3 workers/

BullMQ worker files that process background jobs.

```
workers/
├── index.ts                # Worker registration
├── signal.worker.ts        # Signal distribution
├── notification.worker.ts  # Notification delivery
├── email.worker.ts         # Email sending
├── cleanup.worker.ts       # Temporary file cleanup
└── scheduler.worker.ts     # Scheduled jobs
```

### 6.3.1 Worker Rules

- Each worker is a standalone process.
- Workers import services from modules.
- Workers must handle retries gracefully.
- Workers must never import from `app/` or `components/`.

## 6.4 Email Templates

```
emails/
├── layouts/
│   └── base-layout.tsx     # Shared email layout
│
├── templates/
│   ├── welcome.tsx
│   ├── verify-email.tsx
│   ├── reset-password.tsx
│   ├── kyc-approved.tsx
│   ├── kyc-rejected.tsx
│   ├── broker-approved.tsx
│   ├── broker-rejected.tsx
│   ├── subscription-activated.tsx
│   └── security-alert.tsx
│
└── components/
    ├── header.tsx
    ├── footer.tsx
    └── button.tsx
```

### 6.4.1 Email Template Rules

- Templates use React Email.
- Templates contain presentation only — no business logic.
- Templates receive all data as props.

---

# 7. Data Access Layer

## 7.1 Repository Pattern

```
modules/<module>/repositories/
└── <entity>-repository.ts
```

Every repository:

- Extends or composes a base repository.
- Encapsulates Prisma queries.
- Returns typed results.
- Never contains business logic.

### 7.1.1 Repository Method Naming

| Method | Purpose |
|--------|---------|
| `findById(id)` | Find by primary key |
| `findMany(filter)` | List with filters |
| `create(data)` | Create new record |
| `update(id, data)` | Update existing record |
| `delete(id)` | Soft or hard delete |
| `count(filter)` | Count matching records |
| `exists(filter)` | Check if record exists |

### 7.1.2 Repository Rules

- Only repositories may import Prisma.
- Components must never import Prisma.
- Services must never import Prisma directly.
- Repositories must return plain objects, not Prisma model instances.

## 7.2 Service Layer

```
modules/<module>/services/
├── get-<entity>.ts
├── create-<entity>.ts
├── update-<entity>.ts
└── delete-<entity>.ts
```

### 7.2.1 Service Rules

- Services contain business logic.
- Services use repositories for data access.
- Services never access Prisma directly.
- Services handle validation, authorization, and audit.
- Services are called by Server Actions, Route Handlers, and other services.

---

# 8. Validation Layer

## 8.1 Validators

```
modules/<module>/validators/
└── <entity>-schema.ts
```

Each validator exports Zod schemas for:

- `createSchema` — validation for creation operations.
- `updateSchema` — validation for update operations.
- `filterSchema` — validation for query filters.

### 8.1.1 Validation Rules

- All external input must be validated.
- Validation occurs before business logic.
- Zod schemas are defined once and reused.
- Client-side and server-side use the same schemas.

---

# 9. Configuration

## 9.1 Environment Variables

All environment variables are documented in `.env.example`:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Resend
RESEND_API_KEY=re_...

# Cloudflare
CLOUDFLARE_API_TOKEN=...
```

### 9.1.1 Environment Variable Rules

- Never hardcode secrets.
- Use Zod to validate environment variables at startup.
- Document every variable in `.env.example`.
- Never commit `.env.local`.

## 9.2 Application Configuration

```typescript
// lib/config/app.ts
export const appConfig = {
  name: "NeverBrokeAgain",
  url: process.env.NEXT_PUBLIC_APP_URL!,
  uploadLimit: 10 * 1024 * 1024, // 10MB
  sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
}
```

---

# 10. Scripts

```
scripts/
├── seed.ts                 # Database seeding
├── migrate.ts              # Migration helper
└── cleanup.ts              # Manual cleanup script
```

### 10.1 Script Rules

- Scripts are executed outside the application runtime.
- Scripts use the same Prisma client as the application.
- Scripts must handle errors gracefully.

---

# 11. Tests

```
tests/
├── unit/
│   ├── services/
│   ├── validators/
│   └── utils/
│
├── integration/
│   ├── repositories/
│   └── services/
│
├── e2e/
│   ├── auth/
│   ├── members/
│   └── signals/
│
├── setup.ts                # Test setup and teardown
├── factories.ts            # Test data factories
└── helpers.ts             # Test utilities
```

### 11.1 Test Rules

- Unit tests test services and validators in isolation.
- Integration tests test repositories with a real database.
- E2E tests test complete user flows.
- Each module has a corresponding test file.
- Tests use factories for data creation.
- Tests must be idempotent.

---

# 12. Docker Configuration

```
docker/
├── nginx/
│   ├── nginx.conf
│   └── sites/
│       └── nba.conf
│
├── Dockerfile              # Multi-stage build
└── compose.yml      # Root compose file
```

### 12.1 Docker Rules

- Multi-stage builds minimize image size.
- Development and production use separate configurations.
- Containers are stateless.
- Configuration is environment-based.

---

# 13. Naming Conventions

## 13.1 Files and Directories

| Element | Convention | Example |
|---------|-----------|---------|
| Directories | kebab-case | `user-profiles/` |
| React components | PascalCase | `MemberList.tsx` |
| Services | camelCase | `getMembers.ts` |
| Repositories | kebab-case | `member-repository.ts` |
| Validators | kebab-case | `member-schema.ts` |
| Hooks | camelCase | `useMembers.ts` |
| Types | PascalCase | `Member.ts` |
| Constants | camelCase | `memberRoles.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Workers | kebab-case | `signal-worker.ts` |
| Email templates | PascalCase | `WelcomeEmail.tsx` |
| Tests | `.test.ts` | `getMembers.test.ts` |

## 13.2 Code

| Element | Convention | Example |
|---------|-----------|---------|
| Interfaces | PascalCase with `I` prefix | `IMember` |
| Types | PascalCase | `MemberRole` |
| Enums | PascalCase | `Role` |
| Enum values | UPPER_SNAKE_CASE | `SUPER_ADMIN` |
| Functions | camelCase | `getMemberById()` |
| Variables | camelCase | `memberList` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| Classes | PascalCase | `MemberService` |
| React components | PascalCase | `MemberList` |
| Props interface | PascalCase + `Props` | `MemberListProps` |
| State variables | camelCase | `isLoading` |
| Boolean variables | `is`/`has`/`can` prefix | `isActive`, `hasPermission` |

---

# 14. Import Rules

## 14.1 Import Order

```typescript
// 1. External packages
import { z } from "zod"
import { prisma } from "@/lib/db"

// 2. Shared utilities
import { cn } from "@/lib/utils/cn"
import { AppError } from "@/lib/errors/app-error"

// 3. Module imports
import { memberRepository } from "./member-repository"

// 4. Types
import type { Member } from "../types"

// 5. Constants
import { MEMBER_ROLES } from "../constants"
```

## 14.2 Allowed Imports

| Layer | Can Import From |
|-------|----------------|
| `app/` | `components/`, `modules/*/`, `services/`, `lib/` |
| `components/` | `lib/`, external packages |
| `modules/*/components/` | `components/`, `modules/*/services/`, `lib/` |
| `modules/*/services/` | `modules/*/repositories/`, `services/`, `lib/` |
| `modules/*/repositories/` | `lib/` (Prisma client), external packages |
| `services/` | `modules/*/repositories/`, `lib/` |
| `workers/` | `modules/*/services/`, `services/`, `lib/` |
| `lib/` | external packages only |

## 14.3 Forbidden Imports

- `modules/` must never import from `app/` or `components/`.
- `repositories/` must never import from `services/` or `modules/`.
- `lib/` must never import from `modules/`, `components/`, or `app/`.
- `services/` must never import Prisma directly.
- Components must never import from `repositories/` directly.

---

# 15. Dependency Rules

## 15.1 Module Independence

Each module must be independently understandable.

- A module must not import from another module's components.
- A module may import from another module's services.
- Cross-module service calls must be explicit.

## 15.2 Layer Dependencies

```
Pages → Services → Repositories → Prisma
```

- Pages depend on Services.
- Services depend on Repositories.
- Repositories depend on Prisma.
- Dependencies flow downward. Never upward.

## 15.3 Circular Dependencies

Circular dependencies are strictly prohibited.

If module A needs module B and module B needs module A, extract the shared logic into a shared service.

---

# 16. AI Rules

## 16.1 Rules for AI Agents

AI coding assistants must follow these rules when generating code:

1. Read PROJECT_STRUCTURE.md before creating any file.
2. Place every file in its correct directory.
3. Follow naming conventions exactly.
4. Respect import rules and dependency rules.
5. Never access Prisma from components or pages.
6. Never put business logic in Server Actions.
7. Always validate input with Zod.
8. Always check authorization in services.
9. Always emit audit events for critical operations.
10. Never hardcode roles, permissions, or plans.

## 16.2 File Creation Protocol

When creating a new module:

1. Create the directory structure first.
2. Define types and constants.
3. Create Zod validators.
4. Create the repository.
5. Create services.
6. Create components.
7. Create pages in `app/`.

## 16.3 Code Review Rules for AI

AI agents must verify:

- Imports match the allowed dependency rules.
- Business logic is in services, not in components.
- All inputs are validated.
- Authorization is checked on the server.
- Audit events are emitted where required.
- Error handling is consistent.
- Naming follows conventions.

---

# 17. Best Practices

## 17.1 File Size Limits

- Services: maximum 200 lines.
- Components: maximum 300 lines.
- Repositories: maximum 200 lines.
- Validators: maximum 100 lines.
- Pages: maximum 50 lines (excluding imports).

If a file exceeds these limits, split it.

## 17.2 Export Patterns

- Prefer named exports over default exports.
- Each file exports one primary function or component.
- Index files re-export from internal modules when convenient.

## 17.3 Comments

- Code should be self-documenting.
- Comments explain WHY, not WHAT.
- Business rules must reference the source document.
- TODO comments must reference a ticket number.

## 17.4 Error Handling

- Every service function returns typed results.
- Errors are never swallowed silently.
- Validation errors are returned to the user.
- Infrastructure errors are logged and monitored.
- Unexpected errors are caught by the global error boundary.

## 17.5 Performance

- Database queries are optimized with indexes.
- N+1 queries are prevented with Prisma includes.
- Heavy operations are delegated to BullMQ workers.
- API responses are paginated.
- Static pages are cached where appropriate.

---

# 18. Complete Directory Tree

```
nba/
├── .env.example
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── compose.yml
├── Dockerfile
├── package.json
├── README.md
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── signals/page.tsx
│   │   ├── members/page.tsx
│   │   ├── kyc/page.tsx
│   │   ├── broker/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── settings/page.tsx
│   │   └── admin/page.tsx
│   │
│   └── api/
│       ├── auth/[...all]/route.ts
│       ├── webhooks/resend/route.ts
│       └── public/health/route.ts
│
├── components/
│   ├── ui/ (shadcn)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── shared/
│   │   ├── data-table.tsx
│   │   ├── empty-state.tsx
│   │   └── pagination.tsx
│   └── forms/
│
├── modules/
│   ├── core/
│   ├── auth/
│   ├── users/
│   ├── rbac/
│   ├── members/
│   ├── plans/
│   ├── kyc/
│   ├── broker/
│   ├── signals/
│   ├── distribution/
│   ├── notifications/
│   ├── email/
│   ├── files/
│   ├── admin/
│   ├── audit/
│   ├── settings/
│   └── reporting/
│
├── services/
│   ├── audit-service.ts
│   ├── notification-service.ts
│   └── email-service.ts
│
├── repositories/
│   └── base-repository.ts
│
├── workers/
│   ├── index.ts
│   ├── signal.worker.ts
│   ├── notification.worker.ts
│   ├── email.worker.ts
│   ├── cleanup.worker.ts
│   └── scheduler.worker.ts
│
├── emails/
│   ├── layouts/base-layout.tsx
│   └── templates/
│
├── lib/
│   ├── config/
│   ├── utils/
│   ├── errors/
│   ├── types/
│   ├── constants/
│   ├── middleware.ts
│   ├── auth.ts
│   ├── db.ts
│   ├── redis.ts
│   └── queue.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts
│   └── client.ts
│
├── scripts/
│   ├── seed.ts
│   ├── migrate.ts
│   └── cleanup.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── setup.ts
│   └── factories.ts
│
├── docker/
│   └── nginx/
│       ├── nginx.conf
│       └── sites/nba.conf
│
├── public/
│   ├── images/
│   ├── fonts/
│   └── robots.txt
│
├── styles/
│   └── globals.css
│
└── docs/
    ├── architecture/adr/
    ├── database/
    ├── PROJECT_STRUCTURE.md
    ├── CODING_STANDARDS.md
    ├── API_SPECIFICATION.md
    ├── DATABASE_DESIGN.md
    ├── ENTITY_RELATIONSHIP.md
    ├── DATA_DICTIONARY.md
    ├── SECURITY.md
    ├── DEPLOYMENT.md
    └── AGENTS.md
```

---

# 19. Related Documents

- ADR-001 — Modular Monolith
- ADR-002 — Next.js
- ADR-015 — Repository Pattern
- ADR-016 — Service Layer
- CODING_STANDARDS.md
- SYSTEM_ARCHITECTURE.md
- TECHNICAL_ARCHITECTURE.md
