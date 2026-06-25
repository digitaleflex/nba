# System Architecture

# NeverBrokeAgain (NBA)

> Version: 1.0
> Status: Approved
> Last Updated: June 2026

---

# Purpose

This document defines the software architecture of NeverBrokeAgain.

It establishes the technical standards, architectural principles, module organization, development rules, and system interactions.

Every developer and AI coding agent must follow this document.

---

# Architectural Philosophy

NBA is built as a **Modular Monolith**.

The objective is to maximize:

* maintainability;
* developer productivity;
* deployment simplicity;
* scalability;
* code consistency.

Microservices are intentionally avoided in Version 1.

---

# High-Level Architecture

```text
                    Internet
                        │
                  Cloudflare CDN
                        │
                 Reverse Proxy (Nginx)
                        │
                  Docker Network
        ┌───────────────┼───────────────┐
        │               │               │
    NBA App         NBA Worker       Redis
        │               │
        └───────────────┘
                │
          Neon PostgreSQL
```

---

# Technology Stack

## Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* Shadcn UI

---

## Backend

* Next.js Route Handlers
* Server Actions
* Service Layer
* Repository Pattern

---

## Authentication

* Better Auth
* Prisma Adapter
* RBAC
* Two-Factor Authentication
* Session Management

---

## Database

* PostgreSQL
* Neon Managed Database

---

## ORM

* Prisma

---

## Cache & Queue

* Redis
* BullMQ

---

## Infrastructure

* Docker
* Docker Compose
* Nginx
* Cloudflare

---

# Architecture Layers

```text
Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

↓

Database
```

---

# Presentation Layer

Responsibilities:

* Pages
* Components
* Forms
* Layouts
* UI State

Rules:

* No business logic
* No database access
* No authorization logic

---

# Application Layer

Responsibilities:

* Use Cases
* Workflows
* Transactions
* Orchestration

Rules:

* Calls repositories
* Calls services
* Coordinates modules

---

# Domain Layer

Contains:

* Business Rules
* Entities
* Value Objects
* Domain Services

This layer must remain independent of frameworks.

---

# Infrastructure Layer

Contains:

* Prisma
* Redis
* Better Auth
* BullMQ
* External APIs
* File Storage
* Email Providers

---

# Module Organization

```text
modules/

auth/
members/
plans/
kyc/
broker/
signals/
notifications/
admin/
settings/
audit/
```

Each module is self-contained.

---

# Internal Module Structure

```text
module/

components/

pages/

services/

repositories/

validators/

types/

hooks/

constants/
```

---

# Folder Structure

```text
app/

components/

modules/

services/

repositories/

workers/

lib/

prisma/

scripts/

tests/

docker/

docs/
```

---

# Data Flow

```text
User

↓

Page

↓

Server Action

↓

Application Service

↓

Repository

↓

Prisma

↓

PostgreSQL
```

No component may access Prisma directly.

---

# Background Jobs

BullMQ workers handle:

* signal publication
* notifications
* scheduled jobs
* temporary file cleanup
* maintenance tasks

Background jobs must never block user requests.

---

# Authentication Flow

```text
User

↓

Better Auth

↓

Session

↓

Authorization

↓

Application
```

Authorization is centralized.

---

# Authorization Model

Roles:

* SUPER_ADMIN
* ADMIN
* KYC_AGENT
* SUPPORT_AGENT
* MEMBER

Permissions are role-based.

Role checks must occur in the application layer.

---

# Signal Distribution

```text
Administrator

↓

Create Signal

↓

Database

↓

Queue Job

↓

Redis

↓

BullMQ Worker

↓

Notifications

↓

Members
```

Distribution must be asynchronous.

---

# File Management

Temporary uploads:

```text
uploads/

kyc/

videos/
```

Files are deleted automatically after processing.

Only metadata remains in PostgreSQL.

---

# Database Access Rules

Allowed:

Repository

↓

Prisma

↓

Database

Forbidden:

Component

↓

Prisma

---

# Error Handling

Errors must be:

* typed
* meaningful
* logged
* user-friendly

Unhandled exceptions are prohibited.

---

# Validation

Validation occurs at:

Client

↓

Server

↓

Database

Validation is never optional.

---

# Logging

Every important event must be logged.

Examples:

* Login
* Logout
* Registration
* KYC Approval
* Signal Publication
* Subscription Changes

---

# Security

Mandatory:

* HTTPS
* Password Hashing
* CSRF Protection
* Rate Limiting
* RBAC
* Input Validation
* Secure Sessions

---

# Performance

Target response time:

Dashboard:

< 2 seconds

Signal publication:

Immediate

Heavy processing:

Background workers

---

# Scalability

Current architecture supports:

* thousands of members;
* asynchronous processing;
* modular growth.

Future scalability includes:

* multiple application instances;
* dedicated workers;
* managed Redis;
* read replicas.

---

# Coding Principles

Always:

* Use TypeScript strict mode.
* Use Prisma for database access.
* Use Better Auth for authentication.
* Keep business logic inside services.
* Keep repositories focused on persistence.
* Prefer composition over inheritance.
* Write reusable modules.

Never:

* Access the database from components.
* Duplicate business logic.
* Hardcode permissions.
* Hardcode subscription plans.
* Bypass validation.
* Bypass authorization.

---

# AI Development Rules

AI coding assistants must:

* read PRODUCT_VISION.md;
* read PRD.md;
* read BUSINESS_RULES.md;
* read SYSTEM_ARCHITECTURE.md;
* follow repository conventions;
* preserve architectural consistency.

AI agents must never redesign the architecture without explicit approval.

---

# Definition of Done

A technical implementation is complete only if:

* architecture rules are respected;
* module boundaries are preserved;
* business rules remain intact;
* tests pass;
* code review is approved;
* documentation is updated.
