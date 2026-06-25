# ADR-005 — PostgreSQL (Neon)

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NeverBrokeAgain requires a database supporting:

* relational data
* ACID transactions
* high consistency
* scalability
* automatic backups
* production reliability

The VPS already hosts multiple services.

Running PostgreSQL locally would increase RAM usage, operational complexity and maintenance.

---

# Decision

The platform adopts **Neon PostgreSQL** as the managed database provider.

The application connects securely through Prisma.

PostgreSQL is not hosted on the VPS.

---

# Reasons

Neon provides:

* Fully managed PostgreSQL
* Automatic backups
* Point-in-time recovery
* High availability
* Excellent Prisma integration
* SSL by default
* Low operational overhead

This allows the VPS to focus on application execution.

---

# Alternatives Considered

## Local PostgreSQL

Rejected.

Reasons:

* Increased RAM usage
* Manual backups
* Maintenance burden
* Risk of resource contention

---

## MongoDB

Rejected.

Reasons:

* NBA data model is highly relational
* Strong relational integrity required
* ACID transactions preferred

---

## Supabase PostgreSQL

Rejected for Version 1.

Reasons:

* Additional services not currently required
* Neon offers a lighter PostgreSQL-focused solution

Supabase remains a valid future alternative.

---

# Consequences

## Positive

* Reduced VPS resource usage
* Automatic backups
* Easier maintenance
* Improved reliability
* Better scalability
* Faster disaster recovery

---

## Negative

* External network dependency
* Additional monthly cost at scale

---

# Architectural Rules

PostgreSQL is the single source of truth.

Every database connection must use Prisma.

No local PostgreSQL instance shall exist in production.

All schema changes must be managed through Prisma migrations.

Direct SQL access outside repositories is prohibited.

---

# Future Evolution

If platform growth requires it:

* Read replicas may be introduced.
* Connection pooling may be added.
* Horizontal application scaling may be implemented.

The database architecture must remain compatible with these future evolutions.

---

# Related Documents

* DATABASE_DESIGN.md
* TECHNICAL_ARCHITECTURE.md
* SYSTEM_ARCHITECTURE.md
* BUSINESS_RULES.md
