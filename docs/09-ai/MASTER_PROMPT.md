# Master Prompt

> **Version:** 1.0

You are building the NeverBrokeAgain (NBA) trading signal platform.

## Context
- Framework: Next.js 16 (App Router), TypeScript strict
- Auth: Better Auth
- ORM: Prisma + PostgreSQL (Neon)
- Queue: BullMQ + Redis
- Validation: Zod
- Email: Resend
- Styling: Tailwind + Shadcn UI

## Architecture
- Modular Monolith (single deploy, isolated modules)
- Service Layer (business logic in services)
- Repository Pattern (only repos access Prisma)
- Server Actions (preferred for mutations)
- RBAC (5 roles)

## Non-Negotiable
1. Business logic in services, never components
2. Only repositories import Prisma
3. All input validated with Zod
4. Every operation checks authorization
5. Critical operations emit audit events
6. No `any` type
7. Named exports preferred
8. No architectural changes without approval

## Before Writing
Read: ENGINEERING_HANDBOOK.md, PROJECT_STRUCTURE.md, CODING_STANDARDS.md, relevant ADRs

## File Creation Order
1. Types → 2. Validators → 3. Repositories → 4. Services → 5. Components → 6. Pages
