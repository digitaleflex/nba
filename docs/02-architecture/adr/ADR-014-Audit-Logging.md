# ADR-014 — Audit Logging

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA processes sensitive operations involving:

* identity verification;
* broker validation;
* subscription management;
* administrator actions;
* signal publication.

Every critical action must be traceable.

---

# Decision

The platform implements a centralized audit logging system.

Audit logs are immutable and stored in PostgreSQL.

Every critical operation generates an audit event.

---

# Events to Record

Authentication:

* Login
* Logout
* Password Reset
* Email Verification

Members:

* Registration
* Profile Update
* Account Suspension

Verification:

* KYC Approved
* KYC Rejected
* Broker Approved
* Broker Rejected

Trading:

* Signal Created
* Signal Updated
* Signal Published

Administration:

* Permission Changes
* Subscription Changes
* Settings Updates

---

# Audit Record Structure

Each record contains:

* Timestamp
* User ID
* Role
* Action
* Target Resource
* Target Identifier
* Metadata
* IP Address
* User Agent

---

# Alternatives Considered

## Application Logs Only

Rejected.

Reasons:

* Difficult querying
* Not immutable
* Poor audit capabilities

---

## No Audit Logging

Rejected.

Reasons:

* Loss of traceability
* Security concerns
* Operational limitations

---

# Consequences

## Positive

* Complete traceability
* Easier incident investigation
* Improved compliance
* Better administrative visibility

---

## Negative

* Increased database storage

This impact is considered acceptable.

---

# Architectural Rules

Audit logs must never be modified or deleted.

Audit creation must be automatic.

Every administrative action must generate an audit record.

Business services are responsible for emitting audit events.

---

# Related Documents

* BUSINESS_RULES.md
* SECURITY.md
* TECHNICAL_ARCHITECTURE.md
