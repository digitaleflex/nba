# ADR-011 — Role-Based Access Control (RBAC)

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NeverBrokeAgain provides different functionalities depending on the user's responsibilities.

Not every authenticated user should have access to administrative features.

Authorization must be centralized, maintainable and scalable.

---

# Decision

The platform adopts a **Role-Based Access Control (RBAC)** authorization model.

Permissions are assigned to roles.

Users inherit permissions from their assigned role.

Authorization is enforced by Better Auth and validated in the application layer.

---

# Defined Roles

* SUPER_ADMIN
* ADMIN
* KYC_AGENT
* SUPPORT_AGENT
* MEMBER

---

# Permission Categories

Examples:

* users.read
* users.update
* users.suspend
* subscriptions.manage
* kyc.review
* broker.review
* signals.create
* signals.publish
* notifications.send
* settings.manage
* audit.read

---

# Reasons

RBAC provides:

* Centralized authorization
* Easy maintenance
* Predictable security model
* Extensible permission system

---

# Alternatives Considered

## Hardcoded Role Checks

Rejected.

Reasons:

* Difficult maintenance
* Code duplication
* Poor scalability

---

## Access Control Lists (ACL)

Rejected.

Reasons:

* Unnecessary complexity
* Version 1 does not require user-specific permissions

---

# Consequences

## Positive

* Consistent authorization
* Simplified permission management
* Future extensibility

---

## Negative

* Requires role planning

---

# Architectural Rules

Permissions must never be hardcoded inside UI components.

Authorization must always occur on the server.

Frontend visibility never replaces backend authorization.

---

# Related Documents

* BUSINESS_RULES.md
* SYSTEM_ARCHITECTURE.md
* TECHNICAL_ARCHITECTURE.md
