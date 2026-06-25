# Session Management

> **Version:** 1.0

## Configuration

- Provider: Better Auth
- Storage: PostgreSQL (via Prisma adapter)
- Expiry: 7 days of inactivity
- Cookie: HTTP-only, Secure, SameSite=Lax

## Session Lifecycle

```
Login → Session created → Session validated on each request → Expired/Revoked → Deleted
```

## Rules

- Sessions are server-side
- Sessions are revoked on password change
- Users can view active sessions
- Users can revoke individual sessions
- Administrators can revoke any session
- Expired sessions are rejected with 401
