# ADR-018 — Zod Validation

> **Status:** Accepted
> **Date:** June 2026

---

# Context

User input must be validated consistently across client and server.

TypeScript alone cannot validate runtime data.

---

# Decision

Zod is adopted as the standard validation library.

Every external input must be validated before entering the business layer.

---

# Validation Targets

* Forms
* Server Actions
* Route Handlers
* Environment Variables
* Webhooks
* External APIs

---

# Reasons

Benefits:

* Runtime validation
* Type inference
* Excellent TypeScript integration
* Reduced duplication

---

# Alternatives Considered

## Manual Validation

Rejected.

Reasons:

* Error-prone
* Difficult maintenance

---

## Yup

Rejected.

Reasons:

* Less integrated with TypeScript

---

# Architectural Rules

No business service receives unvalidated input.

Validation schemas are reusable.

Validation errors must be explicit.

---

# Related Documents

* SYSTEM_ARCHITECTURE.md
