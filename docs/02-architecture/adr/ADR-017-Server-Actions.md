# ADR-017 — Server Actions

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA uses Next.js App Router.

Modern Next.js applications can execute secure server-side logic through Server Actions.

---

# Decision

Server Actions are the preferred mechanism for form submissions and authenticated mutations.

REST API endpoints remain available for integrations and public APIs.

---

# Usage

Use Server Actions for:

* Login
* Registration
* Profile updates
* KYC submission
* Broker verification
* Administrative actions

Use Route Handlers for:

* Public APIs
* Webhooks
* External integrations

---

# Reasons

Benefits:

* Simpler architecture
* End-to-end type safety
* Reduced boilerplate
* Better developer experience

---

# Alternatives Considered

## REST Only

Rejected.

Reasons:

* More boilerplate
* Less integrated with Next.js

---

## GraphQL

Rejected.

Reasons:

* Unnecessary complexity
* Not required for Version 1

---

# Architectural Rules

Business logic never resides inside Server Actions.

Server Actions call services.

Validation occurs before service execution.

---

# Related Documents

* TECHNICAL_ARCHITECTURE.md
* ADR-016
