# ADR-013 — File Upload Security

> **Status:** Accepted
> **Date:** June 2026

---

# Context

Members upload sensitive files during:

* Identity Verification (KYC)
* Broker Verification

These uploads represent a significant security risk if not properly validated.

---

# Decision

Every uploaded file must pass a strict validation pipeline before being accepted.

Uploaded files are stored temporarily on local storage.

Files are automatically deleted after verification.

---

# Validation Rules

Mandatory checks:

* File type
* MIME type
* File size
* Extension
* Upload limits

Accepted KYC formats:

* JPG
* PNG
* PDF

Accepted Video formats:

* MP4
* MOV

---

# Security Measures

* Randomized filenames
* No executable files
* Path traversal protection
* Server-side validation
* Size limits
* Authentication required

---

# Alternatives Considered

## Direct Public Uploads

Rejected.

Reasons:

* Security risks
* No validation
* Uncontrolled storage

---

## Permanent File Storage

Rejected.

Reasons:

* Higher storage cost
* Unnecessary retention
* Increased legal exposure

---

# Consequences

## Positive

* Reduced attack surface
* Lower storage costs
* Better privacy
* Easier maintenance

---

## Negative

* Files cannot be recovered after deletion

This behavior is intentional.

---

# Architectural Rules

Every upload must be authenticated.

Uploads must never bypass validation.

Business logic must never rely on uploaded binaries after verification.

Temporary files must be cleaned automatically by BullMQ workers.

---

# Related Documents

* BUSINESS_RULES.md
* TECHNICAL_ARCHITECTURE.md
