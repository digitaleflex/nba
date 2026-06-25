# Disaster Recovery

> **Version:** 1.0

## Recovery Scenarios

### Application Failure

1. Restart container: `docker compose restart nba-app`
2. If persistent: rebuild: `docker compose up -d --build`
3. If still failing: rollback to previous image

### Database Failure

1. Neon auto-failover activates
2. Verify connection: `npx prisma db push --dry-run`
3. Update DATABASE_URL if new endpoint
4. Restart application

### Complete Server Failure

1. Provision new VPS
2. Install Docker and dependencies
3. Clone repository
4. Restore from Neon backup
5. Start services: `docker compose up -d`
6. Run migrations: `npx prisma migrate deploy`
7. Verify health check

## RTO / RPO

| Metric | Target |
|--------|--------|
| Recovery Time Objective | 4 hours |
| Recovery Point Objective | 1 hour (Neon PITR) |
