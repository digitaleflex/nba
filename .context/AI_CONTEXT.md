# AI Context

> For AI agents. How to work with this project.

## Before Any Task
Read, in order:
1. `ENGINEERING_HANDBOOK.md`
2. `.context/PROJECT_CONTEXT.md`
3. `.context/ARCHITECTURE_CONTEXT.md`
4. `docs/09-ai/AI_CODING_GUIDELINES.md`
5. `docs/09-ai/AI_CHECKLIST.md`

## Golden Rules
- Business logic → services, never components or Server Actions
- Prisma access → repositories only
- Input validation → Zod always
- Authorization → check on every protected operation
- Audit events → all critical operations
- No architectural changes without approval
- No dependency additions without approval

## Task Execution
1. Read context files
2. Read relevant docs (BUSINESS_RULES.md, ADRs, etc.)
3. Create types → validators → repositories → services → components → pages
4. Follow CODING_STANDARDS.md exactly
5. Run lint and typecheck before finishing
