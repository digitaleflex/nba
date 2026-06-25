# Deployment Architecture

> **Version:** 1.0

## Architecture

```
Cloudflare (CDN, WAF, TLS)
     │
     ▼
Nginx (Reverse Proxy)
     │
     ▼
┌──────────────┐  ┌──────────────┐
│  NBA App     │  │  NBA Worker  │
│  (Next.js)   │  │  (BullMQ)    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
           ┌────▼────┐
           │  Redis  │
           └─────────┘
                │
           ┌────▼────┐
           │  Neon   │
           │PostgreSQL│
           └─────────┘
```

## Environments

| Environment | Domain | Database |
|-------------|--------|----------|
| Development | localhost:3000 | nba_dev |
| Staging | staging.neverbrokeagain.com | nba_staging |
| Production | neverbrokeagain.com | nba_prod |
