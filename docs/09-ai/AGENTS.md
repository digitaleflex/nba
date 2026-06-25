# AI Agents Guide

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Table of Contents

1. Introduction
2. Required Reading
3. Architecture Overview
4. Development Workflow
5. File Creation Rules
6. Code Generation Rules
7. Testing Rules
8. Documentation Rules
9. Prohibited Actions
10. Project Context

---

# 1. Introduction

## 1.1 Purpose

This document instructs AI coding agents on how to work with the NeverBrokeAgain (NBA) codebase.

Every AI agent must follow these instructions exactly.

## 1.2 Who This Is For

- Claude Code
- GitHub Copilot
- ChatGPT / GPT
- Qwen
- DeepSeek
- Cursor AI
- Any other AI coding assistant

## 1.3 Core Principle

AI agents must **read before writing**. Understanding the existing architecture is mandatory before creating or modifying any file.

---

# 2. Required Reading

Before performing any task, the agent must read these documents in order:

## 2.1 Mandatory Reading

| Order | Document | Purpose |
|-------|----------|---------|
| 1 | `PROJECT_STRUCTURE.md` | Understand file locations and conventions |
| 2 | `CODING_STANDARDS.md` | Understand code style and rules |
| 3 | `SYSTEM_ARCHITECTURE.md` | Understand the architecture |
| 4 | `TECHNICAL_ARCHITECTURE.md` | Understand technical decisions |
| 5 | `BUSINESS_RULES.md` | Understand business logic |

## 2.2 Task-Specific Reading

| Task | Additional Documents |
|------|---------------------|
| Database changes | `DATABASE_DESIGN.md`, `DATA_DICTIONARY.md`, relevant ADRs |
| API changes | `API_SPECIFICATION.md`, relevant ADRs |
| Security changes | `SECURITY.md`, `CODING_STANDARDS.md` (security section) |
| New feature | All ADRs, `BUSINESS_RULES.md`, `PRD.md` |
| Bug fix | `BUSINESS_RULES.md`, related module files |

---

# 3. Architecture Overview

## 3.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + Shadcn UI |
| Authentication | Better Auth |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Queue | BullMQ |
| Cache | Redis |
| Validation | Zod |
| Email | Resend |
| Containerization | Docker |

## 3.2 Key Architecture Decisions

- **Modular Monolith** — the application is a single deployable unit with isolated business modules.
- **Service Layer** — all business logic lives in services.
- **Repository Pattern** — only repositories access Prisma.
- **Server Actions** — preferred for authenticated mutations.
- **RBAC** — role-based authorization centralized in the service layer.

---

# 4. Development Workflow

## 4.1 Task Execution Order

When given a task, the agent must:

1. **Read** all relevant documents (see Section 2).
2. **Plan** the implementation based on the existing architecture.
3. **Create** files in the correct order:
   - Types and constants first.
   - Validators second.
   - Repositories third.
   - Services fourth.
   - Components fifth.
   - Pages last.
4. **Verify** the implementation follows all coding standards.

## 4.2 Module Creation

When creating a new module:

1. Create `modules/<module-name>/` directory.
2. Create subdirectories: `components/`, `services/`, `repositories/`, `validators/`, `types/`, `hooks/`, `constants/`.
3. Create `types/index.ts` with entity types.
4. Create `constants/index.ts` with module-specific constants.
5. Create validators with Zod schemas.
6. Create repository for data access.
7. Create services with business logic.
8. Create components for UI.
9. Create or update pages in `app/`.

---

# 5. File Creation Rules

## 5.1 Directory Placement

Every file type has a designated location:

| File Type | Location |
|-----------|----------|
| Pages | `app/` |
| Shared components | `components/` |
| Module components | `modules/<name>/components/` |
| Services | `modules/<name>/services/` |
| Repositories | `modules/<name>/repositories/` |
| Validators | `modules/<name>/validators/` |
| Types | `modules/<name>/types/` |
| Hooks | `modules/<name>/hooks/` |
| Constants | `modules/<name>/constants/` |
| Workers | `workers/` |
| Email templates | `emails/templates/` |
| Tests | `tests/` (mirror source structure) |

## 5.2 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Directories | kebab-case | `kyc-documents/` |
| React components | PascalCase | `MemberList.tsx` |
| Services | camelCase | `getMembers.ts` |
| Repositories | kebab-case | `member-repository.ts` |
| Validators | kebab-case | `member-schema.ts` |
| Hooks | camelCase | `useMembers.ts` |
| Constants | camelCase | `memberRoles.ts` |
| Tests | `.test.ts` | `getMembers.test.ts` |

---

# 6. Code Generation Rules

## 6.1 TypeScript Rules

- Use strict TypeScript. No `any` type.
- All functions have typed parameters and return types.
- Use `interface` for objects, `type` for unions.
- Use `import type` for type-only imports.

## 6.2 Component Rules

- Components are Server Components by default.
- Add `"use client"` only when browser APIs or state are needed.
- One component per file.
- Props interface uses `ComponentNameProps` naming.
- Destructure props in the function signature.

## 6.3 Server Action Rules

- File-level `"use server"` directive.
- Validate input with Zod before processing.
- Delegate to services for business logic.
- Check authorization before execution.
- Return typed response objects (`ActionResult<T>`).
- Never contain business logic directly.

## 6.4 Service Rules

- Named exports (one function per file).
- Business logic only — no Prisma, no HTTP.
- Call repositories for data access.
- Check authorization at the start of each public method.
- Emit audit events for critical operations.
- Throw typed errors for business rule violations.

## 6.5 Repository Rules

- Only imports Prisma for data access.
- Exposes business-oriented methods.
- Returns plain objects, not Prisma model instances.
- Contains no business logic or authorization logic.
- Uses Prisma includes to prevent N+1 queries.

## 6.6 Validation Rules

- Zod schemas define all validation rules.
- Use `safeParse` instead of `parse` in services.
- Derive TypeScript types from schemas using `z.infer`.

---

# 7. Testing Rules

## 7.1 Test Structure

- Unit tests: test services and validators in isolation.
- Integration tests: test repositories with a real database.
- E2E tests: test complete user flows.

## 7.2 Test Guidelines

- Use factories for test data creation.
- Tests must be idempotent — running them multiple times produces the same result.
- Test edge cases and error paths, not just the happy path.
- Mock external services (Redis, Resend).

---

# 8. Documentation Rules

## 8.1 Code Documentation

- Public functions must have JSDoc comments.
- Use comments to explain WHY, not WHAT.
- Reference business rules by document name.

## 8.2 What Not to Document

- Do not add obvious comments (e.g., `// This function gets a member`).
- Do not create README files unless requested.
- Do not modify ADRs without explicit approval.

---

# 9. Prohibited Actions

## 9.1 Never Do These

AI agents must never:

1. **Modify business rules** without explicit instruction.
2. **Bypass authorization** — always check roles and permissions.
3. **Access Prisma from components** — use services.
4. **Put business logic in Server Actions** — use services.
5. **Skip input validation** — always use Zod.
6. **Hardcode roles, permissions, or plan IDs** — use the database.
7. **Add dependencies** without approval.
8. **Create new architectural patterns** without approval.
9. **Modify ADRs** without approval.
10. **Commit directly to main** — unless instructed.

## 9.2 Security Violations

- Never expose secrets in code or logs.
- Never return passwords or sensitive data in API responses.
- Never disable security checks.
- Never use `console.log` in committed code.

---

# 10. Project Context

## 10.1 Project Name

NeverBrokeAgain (NBA)

## 10.2 Project Description

A trading signal platform for members. Administrators create trading signals and distribute them to members based on subscription plans.

## 10.3 Key Features

- Member authentication and management
- Subscription plans
- KYC verification
- Broker verification
- Trading signal publication and distribution
- Multi-channel notifications (in-app, email, Telegram)
- Role-based administration
- Audit logging

## 10.4 Business Modules

| Module | Description |
|--------|-------------|
| auth | Authentication and session management |
| members | Member profile management |
| plans | Subscription plans and user subscriptions |
| kyc | KYC document verification |
| broker | Broker account verification |
| signals | Trading signal creation and distribution |
| notifications | Multi-channel notification delivery |
| admin | Administrative functions |
| settings | User and system settings |
| audit | Immutable audit logging |

---

# 11. Agent Self-Checklist

Before completing any task, the agent must verify:

- [ ] All files are placed in the correct directories.
- [ ] Naming conventions are followed.
- [ ] Business logic is in services, not in components or Server Actions.
- [ ] Input validation is in place (Zod).
- [ ] Authorization is checked.
- [ ] Audit events are emitted for critical operations.
- [ ] Error handling is consistent.
- [ ] Imports follow the dependency rules.
- [ ] No business rules were modified.
- [ ] No architectural patterns were changed.

---

# Related Documents

- PROJECT_STRUCTURE.md
- CODING_STANDARDS.md
- SYSTEM_ARCHITECTURE.md
- TECHNICAL_ARCHITECTURE.md
- All ADRs (001-024)
