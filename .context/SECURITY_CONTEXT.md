# Security Context

> For AI agents. Concise security summary.

## Authentication
- Better Auth for all auth
- Email/password, email verification, password reset
- 2FA available
- Sessions expire after 7 days inactivity

## Authorization
- RBAC with 5 roles: SUPER_ADMIN, ADMIN, KYC_AGENT, SUPPORT_AGENT, MEMBER
- Authorization checked at service layer
- Frontend visibility never replaces backend authorization

## Critical Rules
- Never store passwords (Better Auth handles hashing)
- Never expose secrets in code or logs
- Validate all input with Zod
- Check authorization on every protected operation
- Audit all critical actions
- No `console.log` in committed code
- Rate limiting on auth endpoints
