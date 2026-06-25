# AI Coding Guidelines

> **Version:** 1.0

## Before Code

1. Read ENGINEERING_HANDBOOK.md
2. Read PROJECT_STRUCTURE.md
3. Read CODING_STANDARDS.md
4. Read relevant ADRs
5. Read BUSINESS_RULES.md for business logic

## During Code

1. One file at a time — verify before moving on
2. Follow naming conventions exactly
3. Respect module boundaries
4. Import only from allowed layers

## After Code

1. Run `pnpm lint`
2. Run `pnpm typecheck`
3. Verify no `console.log`
4. Verify no `any` type

## Prohibited

- Accessing Prisma from components or pages
- Putting business logic in Server Actions
- Skipping input validation
- Skipping authorization checks
- Adding dependencies without approval
- Modifying architecture without approval
