# ADR-015 — Repository Pattern

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA requires a clean separation between business logic and data persistence.

Direct database access from UI components or services would create tight coupling and reduce maintainability.

---

# Decision

The application adopts the **Repository Pattern**.

Repositories are responsible for all database interactions.

Repositories abstract Prisma and expose business-oriented data access methods.

---

# Responsibilities

Repositories:

* Read data
* Write data
* Execute transactions
* Encapsulate Prisma queries

Repositories do not contain business logic.

---

# Reasons

Benefits:

* Clear separation of concerns
* Easier testing
* Better maintainability
* Easier ORM replacement
* Reduced code duplication

---

# Alternatives Considered

## Direct Prisma Usage

Rejected.

Reasons:

* Tight coupling
* Query duplication
* Difficult testing

---

## Active Record Pattern

Rejected.

Reasons:

* Business logic leaks into models
* Lower maintainability

---

# Consequences

## Positive

* Centralized persistence
* Cleaner architecture
* Improved scalability

---

## Negative

* Additional abstraction layer

---

# Architectural Rules

Only repositories may interact with Prisma.

Services must never execute database queries directly.

Components must never import Prisma.

Repositories must remain framework-independent whenever possible.

---

# Related Documents

* SYSTEM_ARCHITECTURE.md
* TECHNICAL_ARCHITECTURE.md
