# ADR-003 — Better Auth

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NeverBrokeAgain requires a secure authentication system supporting:

* Email & Password authentication
* Email verification
* Password reset
* Session management
* Role-Based Access Control (RBAC)
* Two-Factor Authentication (2FA)
* Prisma integration
* PostgreSQL
* TypeScript
* Modern Next.js architecture

The authentication solution must minimize maintenance while remaining extensible.

---

# Decision

The project adopts **Better Auth** as the official authentication framework.

Better Auth will manage:

* authentication
* user sessions
* account verification
* password recovery
* role integration
* administrator security

Authentication will be fully integrated with Prisma and PostgreSQL.

---

# Reasons

Better Auth provides:

* Native Next.js support
* Excellent TypeScript integration
* Prisma Adapter
* Modern architecture
* Session-based authentication
* Built-in security
* Modular plugin system
* Excellent developer experience

It significantly reduces authentication boilerplate while remaining flexible.

---

# Enabled Plugins

The following plugins are mandatory.

## Authentication

* Email & Password

---

## Verification

* Email Verification

---

## Security

* Password Reset
* Session Management
* Two Factor Authentication

---

## Authorization

* RBAC
* Admin Plugin

---

# Alternatives Considered

## Custom Authentication

Rejected.

Reasons:

* High maintenance cost
* Increased security risks
* Longer development time

---

## NextAuth.js

Rejected.

Reasons:

* Better Auth provides a cleaner API
* Better plugin architecture
* Better TypeScript experience
* Simpler configuration

---

## Supabase Auth

Rejected.

Reasons:

* Tightly coupled with Supabase ecosystem
* Reduced flexibility
* Authentication should remain infrastructure-independent

---

# Consequences

## Positive

* Faster development
* Strong security
* Modern architecture
* Easier maintenance
* Reduced custom code
* Excellent Prisma integration

---

## Negative

* Dependency on Better Auth ecosystem
* Team must learn Better Auth conventions

---

# Architectural Rules

Authentication must always use Better Auth.

Passwords must never be handled manually.

Sessions must never be implemented manually.

Authorization must never bypass Better Auth.

---

# Related Documents

* PRODUCT_VISION.md
* PRD.md
* BUSINESS_RULES.md
* SYSTEM_ARCHITECTURE.md
* TECHNICAL_ARCHITECTURE.md
