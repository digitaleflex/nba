# ADR-020 — Background Processing

> **Status:** Accepted
> **Date:** June 2026

---

# Context

Several operations may take several seconds to complete.

Blocking HTTP requests degrades user experience.

---

# Decision

Long-running operations are executed asynchronously through BullMQ workers.

---

# Background Jobs

* Signal Distribution
* Email Sending
* Notification Delivery
* File Cleanup
* Scheduled Tasks

---

# Reasons

Benefits:

* Faster responses
* Better scalability
* Automatic retries
* Failure isolation

---

# Architectural Rules

HTTP requests should finish quickly.

Background jobs must be idempotent.

Retries must be configured.

---

# Related Documents

* ADR-007
* TECHNICAL_ARCHITECTURE.md
