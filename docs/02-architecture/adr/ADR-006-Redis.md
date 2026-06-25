# ADR-006 — Redis

> **Status:** Accepted
> **Date:** June 2026

---

# Context

The NBA platform performs operations that should not execute during HTTP requests.

Examples include:

* signal distribution;
* notification processing;
* scheduled tasks;
* temporary caching;
* rate limiting.

A fast in-memory datastore is required.

---

# Decision

Redis is selected as the in-memory data store.

Redis will be used for:

* BullMQ queues
* Rate limiting
* Temporary cache
* Distributed locks (future)
* Session cache (future if required)

Redis is not the primary database.

PostgreSQL remains the source of truth.

---

# Reasons

Redis provides:

* Extremely low latency
* High throughput
* Native BullMQ integration
* Mature ecosystem
* Low resource usage
* Simple deployment

---

# Alternatives Considered

## PostgreSQL Queue

Rejected.

Reasons:

* Poor performance
* Increased database workload
* Not optimized for queue processing

---

## RabbitMQ

Rejected.

Reasons:

* Operational complexity
* Unnecessary for Version 1

---

## Apache Kafka

Rejected.

Reasons:

* Over-engineering
* High operational cost
* Not justified by expected traffic

---

# Consequences

## Positive

* Fast background processing
* Low latency
* Easy scalability
* Simple Docker deployment

---

## Negative

* Additional infrastructure component
* In-memory persistence only

---

# Architectural Rules

Redis must never contain business data.

Redis failures must never corrupt application data.

PostgreSQL remains the single source of truth.

---

# Related Documents

* TECHNICAL_ARCHITECTURE.md
* SYSTEM_ARCHITECTURE.md
