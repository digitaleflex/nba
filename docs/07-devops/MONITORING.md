# Monitoring

> **Version:** 1.0

## Health Checks

| Service | Check | Interval |
|---------|-------|----------|
| nba-app | HTTP 200 on /api/public/health | 30s |
| nba-worker | BullMQ queue active | 60s |
| redis | Redis ping | 30s |

## Alerts

| Condition | Method | Severity |
|-----------|--------|----------|
| Application unreachable | Email + Telegram | Critical |
| Worker queue backlog > 1000 | Email | High |
| Failed jobs > 5 in 10 min | Email | High |
| Error rate > 1% | Email | Medium |
| Disk < 20% | Email | Medium |

## Runbook

See `docs/07-devops/RUNBOOK.md` for operational procedures.
