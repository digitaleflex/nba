# ADR-021 — Notification Architecture

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA communicates with members through multiple notification channels.

Future channels must be added without changing business logic.

---

# Decision

The platform adopts a centralized Notification Service.

Supported channels:

* In-App
* Email (Resend)
* Telegram

Future:

* Push Notifications
* SMS
* WhatsApp

---

# Workflow

Business Event

↓

Notification Service

↓

Queue

↓

Worker

↓

Delivery Provider

---

# Reasons

Benefits:

* Decoupled architecture
* Easy channel expansion
* Consistent notification logic

---

# Architectural Rules

Business services never call providers directly.

Providers are interchangeable.

Failures in one channel must not affect others.

---

# Related Documents

* ADR-007
* TECHNICAL_ARCHITECTURE.md
