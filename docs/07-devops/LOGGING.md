# Logging

> **Version:** 1.0

## Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Unexpected errors, infrastructure failures |
| WARN | Business rule violations, rate limit exceeded |
| INFO | Important events (login, signal published) |
| DEBUG | Development only — never in production |

## Log Format

```json
{
  "timestamp": "2026-06-25T12:00:00.000Z",
  "level": "INFO",
  "service": "nba-app",
  "message": "Signal published",
  "metadata": {
    "signalId": "uuid",
    "userId": "uuid"
  }
}
```

## Rules

- No sensitive data in logs
- No `console.log` — use logging service
- Structured JSON logging in production
- Audit events in PostgreSQL, not log files
