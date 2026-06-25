# ADR-008 — Docker Compose

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA must be easily deployable on development and production environments.

The infrastructure should remain reproducible.

---

# Decision

Docker Compose is selected for local development and production deployment.

Every infrastructure component runs inside its own container.

---

# Services

* nba-app
* nba-worker
* redis
* nginx

PostgreSQL is hosted externally on Neon.

---

# Reasons

Docker Compose provides:

* Reproducible environments
* Service isolation
* Simplified deployment
* Easy upgrades
* Consistent environments

---

# Alternatives Considered

## Native Installation

Rejected.

Reasons:

* Difficult maintenance
* Environment inconsistencies

---

## Kubernetes

Rejected.

Reasons:

* Excessive complexity
* Not justified for Version 1

---

# Consequences

## Positive

* Simplified deployments
* Easy rollback
* Infrastructure portability

---

## Negative

* Additional Docker knowledge required

---

# Architectural Rules

Every internal service must run inside Docker.

Configuration must be environment-based.

Containers must be stateless whenever possible.

---

# Related Documents

* DEPLOYMENT.md
* TECHNICAL_ARCHITECTURE.md
