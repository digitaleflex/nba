# AI Checklist

> **Version:** 1.0

## Pre-Task

- [ ] Read ENGINEERING_HANDBOOK.md
- [ ] Loaded relevant context files
- [ ] Read relevant ADRs
- [ ] Read BUSINESS_RULES.md if business logic involved

## During Task

- [ ] Files in correct directories
- [ ] Naming conventions followed
- [ ] Business logic in services (not components/actions)
- [ ] Only repositories import Prisma
- [ ] Input validated with Zod
- [ ] Authorization checked
- [ ] Audit events emitted for critical ops
- [ ] Module boundaries respected
- [ ] Named exports used
- [ ] No `any` type

## Post-Task

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] No `console.log` in new code
- [ ] No hardcoded secrets
- [ ] Tests added/modified
- [ ] Documentation updated if needed
