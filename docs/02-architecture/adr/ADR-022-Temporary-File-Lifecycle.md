# ADR-022 — Temporary File Lifecycle

> **Status:** Accepted
> **Date:** June 2026

---

# Context

Verification files are temporary.

Keeping them indefinitely increases storage costs and privacy risks.

---

# Decision

Every uploaded verification file follows a defined lifecycle.

---

# Lifecycle

Upload

↓

Validation

↓

Pending Review

↓

Approved / Rejected

↓

Marked for Deletion

↓

BullMQ Cleanup Job

↓

Physical Deletion

↓

Audit Log

---

# Reasons

Benefits:

* Lower storage usage
* Better privacy
* Reduced operational costs
* Compliance with data minimization principles

---

# Alternatives Considered

## Permanent Storage

Rejected.

Reasons:

* Unnecessary retention
* Increased storage costs
* Higher legal exposure

---

# Architectural Rules

Files must never become the system of record.

Metadata remains in PostgreSQL.

Deletion jobs are mandatory.

Cleanup failures must trigger retries.

---

# Related Documents

* ADR-009
* ADR-020
* BUSINESS_RULES.md
