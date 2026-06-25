# ADR-012 — Session Management

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA requires secure authentication sessions.

Users may access the platform from multiple devices.

Sessions must be manageable, revocable and secure.

---

# Decision

Session management is delegated to Better Auth.

The platform uses secure server-side sessions.

Session lifecycle is fully managed by Better Auth.

---

# Requirements

Sessions must support:

* Login
* Logout
* Multiple devices
* Session expiration
* Session revocation
* Logout from all devices

---

# Reasons

Centralized session management:

* improves security;
* reduces implementation complexity;
* integrates with Better Auth;
* supports future scaling.

---

# Alternatives Considered

## JWT Only

Rejected.

Reasons:

* Difficult revocation
* Harder session management
* Less suitable for administrator sessions

---

## Custom Session System

Rejected.

Reasons:

* Higher maintenance
* Increased security risks

---

# Consequences

## Positive

* Better security
* Easier administration
* Consistent authentication

---

## Negative

* Dependency on Better Auth session model

---

# Architectural Rules

Sessions must never be manually implemented.

Session validation must occur before authorization.

Expired sessions must always be rejected.

Sensitive operations may require re-authentication.

---

# Related Documents

* ADR-003
* SECURITY.md
* TECHNICAL_ARCHITECTURE.md
