# ADR-016 — Service Layer

> **Status:** Accepted
> **Date:** June 2026

---

# Context

Business rules must remain independent from UI and persistence layers.

Complex workflows require orchestration across multiple repositories.

---

# Decision

NBA adopts the **Service Layer Pattern**.

Every business operation is implemented inside an application service.

Services orchestrate repositories and enforce business rules.

---

# Responsibilities

Services:

* Execute business rules
* Coordinate repositories
* Manage transactions
* Trigger notifications
* Emit audit events

---

# Reasons

Benefits:

* Centralized business logic
* Easier testing
* Better readability
* Reusable workflows

---

# Alternatives Considered

## Fat Controllers

Rejected.

Reasons:

* Poor maintainability
* Business logic mixed with HTTP layer

---

## Business Logic in Components

Rejected.

Reasons:

* Impossible to reuse
* Violates separation of concerns

---

# Consequences

## Positive

* Clear architecture
* Reusable services
* Better AI-generated code consistency

---

## Negative

* Additional project structure

---

# Architectural Rules

Every business workflow belongs to a service.

Services may use multiple repositories.

Services never access HTTP objects directly.

---

# Related Documents

* BUSINESS_RULES.md
* SYSTEM_ARCHITECTURE.md
