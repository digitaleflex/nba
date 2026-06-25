# ADR-001 — Modular Monolith

> Status: Accepted

## Context

The project requires rapid development, low operational cost, maintainability and the ability to evolve over time.

The initial user base does not justify a distributed microservice architecture.

---

## Decision

The application will be implemented as a Modular Monolith.

Business modules remain isolated inside a single deployable application.

---

## Alternatives Considered

### Microservices

Rejected.

Reason:

* unnecessary complexity
* distributed transactions
* multiple deployments
* increased operational cost

### Layered Monolith

Rejected.

Reason:

Business boundaries become unclear as the project grows.

---

## Consequences

Positive

* Faster development
* Easier deployment
* Lower hosting cost
* Simpler debugging
* Better compatibility with AI-assisted development

Negative

* Future module extraction requires planning

---

## Future Evolution

The modular architecture must allow gradual extraction of services if required.
