# Observability

> **Version:** 1.0

## Logging

- Application logs → stdout (Docker)
- Audit logs → PostgreSQL (audit_logs table)
- Error tracking → Logged with context
- No `console.log` in production code

## Monitoring

| Metric | Source | Alert |
|--------|--------|-------|
| Application health | Health check endpoint | Down alert |
| Error rate | Application logs | High error rate |
| Queue length | BullMQ | Backlog alert |
| Failed jobs | BullMQ | Failure alert |
| CPU/Memory | Docker stats | Resource alert |

## Health Check

**Endpoint:** `GET /api/public/health`

**Response:** `{ "status": "healthy", "timestamp": "..." }`

Configured in Docker Compose for container health checks.
