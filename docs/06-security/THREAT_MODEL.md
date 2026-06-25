# Threat Model

> **Version:** 1.0

## Identified Threats

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| Brute force login | High | Medium | Rate limiting, account lockout |
| SQL injection | Critical | Low | Prisma parameterized queries |
| XSS | High | Low | React escaping, CSP headers |
| CSRF | High | Low | Next.js built-in CSRF protection |
| Session hijacking | High | Medium | HTTP-only cookies, session expiry |
| Privilege escalation | Critical | Low | RBAC, authorization checks |
| Data breach | Critical | Low | Encryption at rest, access controls |
| DDoS | High | Medium | Cloudflare protection |
| File upload exploit | High | Low | MIME validation, size limits |

## Mitigation Priority

1. Authentication and session security
2. Authorization controls
3. Input validation
4. Rate limiting
5. Monitoring and alerting
