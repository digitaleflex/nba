# ADR-004 — Prisma ORM

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA requires an ORM supporting:

* PostgreSQL
* Type Safety
* Transactions
* Migrations
* Excellent Next.js integration
* High developer productivity
* AI-assisted development

The ORM should reduce SQL boilerplate while preserving performance.

---

# Decision

Prisma is selected as the official ORM.

Every database interaction must go through Prisma.

Repositories are responsible for encapsulating Prisma queries.

---

# Reasons

Prisma provides:

* Type-safe queries
* Automatic TypeScript generation
* Migration system
* Transaction support
* Excellent PostgreSQL compatibility
* Excellent Better Auth integration
* Strong AI tooling support

---

# Alternatives Considered

## Raw SQL

Rejected.

Reasons:

* Poor maintainability
* Increased risk of SQL errors
* Lower productivity

---

## Drizzle ORM

Rejected.

Reasons:

* Prisma ecosystem is more mature
* Better tooling
* Better AI compatibility
* Larger community

---

## TypeORM

Rejected.

Reasons:

* Less predictable
* Higher complexity
* Inferior developer experience

---

# Consequences

## Positive

* Strong typing
* Faster development
* Easier refactoring
* Better maintainability
* Simplified migrations

---

## Negative

* Additional abstraction layer
* Learning curve for advanced queries

---

# Architectural Rules

Prisma is the only ORM.

Repositories are the only layer allowed to interact with Prisma.

Components must never import Prisma.

Business services must never contain SQL.

Migrations must always be generated using Prisma.

---

# Related Documents

* DATABASE_DESIGN.md
* SYSTEM_ARCHITECTURE.md
* TECHNICAL_ARCHITECTURE.md
