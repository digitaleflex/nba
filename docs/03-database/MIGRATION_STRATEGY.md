# Migration Strategy

> **Version:** 1.0

## Workflow

```
Update schema.prisma
        │
        ▼
Generate migration (prisma migrate dev)
        │
        ▼
Review migration SQL
        │
        ▼
Test migration
        │
        ▼
Commit migration file
        │
        ▼
Deploy (prisma migrate deploy)
```

## Environment Rules

| Environment | Command | Notes |
|-------------|---------|-------|
| Development | `prisma migrate dev` | Creates + applies migration |
| Staging | `prisma migrate deploy` | Applies pending migrations only |
| Production | `prisma migrate deploy` | Applies pending migrations only |

## Forbidden Commands

| Command | Reason |
|---------|--------|
| `prisma db push` | Bypasses migration history |
| `prisma migrate reset` | Destroys data |

## Migration Naming

Migrations are named descriptively:

```
20260625000001_add_kyc_status_column
20260625000002_create_subscription_plans
```

## Rollback

Every migration must have a documented rollback procedure documented in the migration file.
