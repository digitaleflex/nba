# ADR-002 — Next.js as Application Framework

> Status: Accepted

## Context

NBA requires a unified framework supporting frontend, backend, server rendering, authentication and rapid development.

---

## Decision

Next.js is selected as the application framework.

---

## Alternatives Considered

React + Express

Rejected due to maintaining two independent applications.

TanStack Start

Rejected because the ecosystem is less mature and AI tooling is currently less optimized.

NestJS + React

Rejected because the architecture is unnecessarily complex for Version 1.

---

## Consequences

Advantages

* Single codebase
* Server Components
* Server Actions
* Excellent TypeScript support
* Strong AI ecosystem

Disadvantages

* Vendor-specific conventions
