# C4 Model

> **Version:** 1.0

## Level 1 — System Context

```
[Member] ──> [NBA Platform] ──> [Neon PostgreSQL]
                │
                ├──> [Resend (Email)]
                ├──> [Cloudflare (CDN)]
                └──> [Telegram API]
```

## Level 2 — Container

```
[Web Browser]
     │
     ▼
[Cloudflare CDN]
     │
     ▼
[Nginx Reverse Proxy]
     │
     ▼
┌─────────────────────────────────────┐
│         NBA Application             │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Next.js  │  │ BullMQ Workers   │ │
│  │ App      │  │ ┌──────────────┐ │ │
│  │ Router   │  │ │ Signal       │ │ │
│  │          │  │ │ Notification │ │ │
│  │ Server   │  │ │ Email        │ │ │
│  │ Actions  │  │ │ Cleanup      │ │ │
│  └──────────┘  │ │ Scheduler    │ │ │
│                │ └──────────────┘ │ │
│  ┌──────────┐  └──────────────────┘ │
│  │ Services │                       │
│  └──────────┘                       │
│  ┌──────────┐                       │
│  │ Repos    │                       │
│  └──────────┘                       │
└─────────────────────────────────────┘
     │                    │
     ▼                    ▼
[Neon PostgreSQL]    [Redis]
```

## Level 3 — Component

See `docs/02-architecture/MODULE_ARCHITECTURE.md` for component-level details.
