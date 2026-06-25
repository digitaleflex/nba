# ADR-024 — Database Migration Strategy

> **Status:** Accepted
> **Date:** June 2026

---

# Context

The NBA platform manages critical production data.

Database schema changes must preserve data integrity, ensure reproducible deployments, and provide a complete migration history.

Direct schema synchronization without versioned migrations introduces significant operational risk.

---

# Decision

The project adopts a **Migration-First Strategy**.

Every database schema modification must be implemented through a versioned Prisma migration.

Schema changes without migrations are strictly prohibited.

---

# Migration Workflow

Every schema change follows this workflow:

```text
Update schema.prisma

↓

Generate Migration

↓

Review Migration

↓

Test Migration

↓

Commit Migration

↓

Deploy Migration

↓

Start Application
```

---

# Allowed Commands

Development

```bash
npx prisma migrate dev
```

Production

```bash
npx prisma migrate deploy
```

Generate Client

```bash
npx prisma generate
```

---

# Forbidden Commands

The following commands are prohibited outside isolated local experiments.

```bash
npx prisma db push
```

Reason:

* bypasses migration history;
* impossible to audit schema evolution;
* may introduce schema drift.

---

```bash
npx prisma migrate reset
```

Reason:

* destroys existing data;
* unacceptable in shared environments;
* prohibited on staging and production.

---

```bash
DROP DATABASE
```

Strictly prohibited.

---

# Migration Principles

Every migration must:

* be versioned;
* be committed to Git;
* be reproducible;
* be reviewed before deployment;
* preserve existing data whenever possible.

---

# Schema Evolution Rules

Schema evolution must be incremental.

Breaking changes require:

* migration planning;
* backward compatibility analysis;
* rollback strategy;
* approval.

---

# Rollback Strategy

Every production migration must have a documented rollback procedure.

Rollback must never rely on database recreation.

---

# Data Preservation

Existing production data is considered critical.

Schema evolution must prioritize:

* data preservation;
* backward compatibility;
* reversible migrations.

---

# Review Process

Every migration must be reviewed before merge.

Review checklist:

* Naming
* Constraints
* Indexes
* Foreign Keys
* Nullable fields
* Default values
* Performance impact

---

# Deployment Rules

Production deployments must execute migrations before application startup.

Migration execution is automated.

Application startup must fail if migrations are pending.

---

# Environment Rules

## Local Development

Allowed:

* prisma migrate dev
* prisma generate

Forbidden:

* migrate reset (except explicit local database recreation)

---

## Staging

Allowed:

* prisma migrate deploy

Forbidden:

* db push
* migrate reset

---

## Production

Allowed:

* prisma migrate deploy

Strictly Forbidden:

* prisma db push
* prisma migrate reset
* manual schema modifications
* direct SQL schema changes outside approved migrations

---

# Reasons

This strategy provides:

* Complete schema history
* Reproducible deployments
* Safe production upgrades
* Reliable rollback planning
* Team collaboration
* Auditability
* Predictable database evolution

---

# Consequences

## Positive

* Safe schema evolution
* Version-controlled database
* Reliable deployments
* Better collaboration
* Reduced production risk

---

## Negative

* Slightly slower development workflow

This trade-off is considered acceptable given the importance of production data.

---

# Architectural Rules

Database schema changes are never applied directly.

Every schema modification must be represented by a Prisma migration.

Migration files are immutable after being merged.

Production databases must never be reset.

The database schema must always match the latest committed migration.

---

# Related Documents

* DATABASE_DESIGN.md
* TECHNICAL_ARCHITECTURE.md
* DEPLOYMENT.md
* CODING_STANDARDS.md
