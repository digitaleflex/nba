# ADR-009 — Local Temporary Storage

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA temporarily stores:

* KYC documents
* Broker verification videos

These files are required only until the verification process is completed.

Persistent cloud object storage is unnecessary for Version 1.

---

# Decision

Verification files will be stored on the VPS local NVMe storage.

After approval or rejection, files will be automatically deleted by background workers.

Only metadata remains inside PostgreSQL.

---

# Reasons

Advantages:

* Zero additional infrastructure cost
* Extremely fast access
* Very low complexity
* Easy implementation

---

# Alternatives Considered

## Cloudflare R2

Rejected.

Reasons:

* Additional complexity
* Unnecessary for temporary storage

---

## Amazon S3

Rejected.

Reasons:

* Higher operational cost
* Overkill for Version 1

---

## Supabase Storage

Rejected.

Reasons:

* Not required
* Local storage is sufficient

---

# Consequences

## Positive

* Lower costs
* Simpler deployment
* Faster uploads

---

## Negative

* Files are lost if the server fails

This is acceptable because uploaded files are temporary.

---

# Architectural Rules

Files must never remain permanently on disk.

Cleanup jobs are mandatory.

Business data must never depend on temporary files.

---

# Related Documents

* BUSINESS_RULES.md
* TECHNICAL_ARCHITECTURE.md
