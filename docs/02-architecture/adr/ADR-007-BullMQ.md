# ADR-007 — BullMQ

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA executes multiple asynchronous operations:

* signal publication;
* notification delivery;
* email sending;
* scheduled tasks;
* temporary file cleanup.

These operations must never block user requests.

---

# Decision

BullMQ is selected as the background job processing framework.

BullMQ uses Redis as its queue backend.

Dedicated workers execute asynchronous jobs independently from the web application.

---

# Reasons

BullMQ provides:

* Excellent Redis integration
* Automatic retries
* Delayed jobs
* Scheduled jobs
* Queue monitoring
* High reliability

---

# Alternatives Considered

## Cron Jobs

Rejected.

Reasons:

* Limited flexibility
* No retries
* Difficult monitoring

---

## Custom Queue

Rejected.

Reasons:

* Reinventing existing solutions
* Higher maintenance cost

---

## RabbitMQ Workers

Rejected.

Reasons:

* Higher operational complexity

---

# Consequences

## Positive

* Non-blocking user experience
* Reliable processing
* Retry support
* Better scalability

---

## Negative

* Additional worker process required

---

# Architectural Rules

Every long-running process must execute through BullMQ.

HTTP requests must remain short.

Workers must remain stateless.

---

# Related Documents

* ADR-006
* TECHNICAL_ARCHITECTURE.md
