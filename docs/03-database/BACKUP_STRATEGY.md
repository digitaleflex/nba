# Backup Strategy

> **Version:** 1.0

## Neon Managed Backups

Neon PostgreSQL provides automatic backups:

- **Point-in-time recovery** — 7 days retention
- **Daily backups** — automatic
- **Automatic failover** — HA configuration

## Application Data

The application stores data in PostgreSQL only. Temporary files (KYC documents, broker videos) are not backed up.

## Recovery Procedure

1. Identify the recovery point
2. Use Neon console to restore
3. Verify data integrity
4. Update DATABASE_URL if restored to a new instance
5. Restart application

## Backup Testing

Backup restoration is tested quarterly.
