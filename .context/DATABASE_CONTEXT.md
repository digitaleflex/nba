# Database Context

> For AI agents. Concise database summary.

## Technology
- PostgreSQL via Neon (managed)
- Prisma ORM
- UUID v7 primary keys
- snake_case naming

## Core Tables
- users, roles, permissions, sessions, accounts
- subscription_plans, user_subscriptions
- kyc_documents, broker_verifications
- signals, signal_audience
- notifications, notification_deliveries
- audit_logs, settings

## Key Constraints
- Foreign keys on all relationships
- Soft delete: users, subscriptions, signals
- Hard delete: temp uploads, expired sessions, verification tokens
- Immutable: audit_logs (never deleted)

## Migration Rules
- All changes via Prisma migrations
- `prisma db push` forbidden on staging/production
- `prisma migrate reset` forbidden on staging/production
- Production only: `prisma migrate deploy`
