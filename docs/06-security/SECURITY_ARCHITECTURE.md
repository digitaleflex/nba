# Security Architecture

> **Version:** 1.0

## Defense in Depth

```
Cloudflare Edge
  └── DDoS protection, TLS termination, WAF
        │
        ▼
Application Layer
  └── Authentication (Better Auth), Authorization (RBAC), Validation (Zod)
        │
        ▼
Service Layer
  └── Authorization checks, Audit events, Business rules
        │
        ▼
Data Layer
  └── Prisma (SQL injection prevention), Encryption at rest (Neon)
```

## Security Boundaries

| Boundary | Controls |
|----------|----------|
| Public → Application | Cloudflare, rate limiting, authentication |
| User → Resource | RBAC, authorization checks |
| Service → Database | Prisma parameterized queries |
| Application → External | API keys, signature validation |
