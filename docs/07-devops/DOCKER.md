# Docker

> **Version:** 1.0

## Services

| Service | Image | Port |
|---------|-------|------|
| nba-app | Custom Next.js build | 3000 |
| nba-worker | Custom worker build | - |
| redis | redis:7-alpine | 6379 |
| nginx | nginx:alpine | 80, 443 |

## Commands

```bash
docker compose build     # Build all services
docker compose up -d     # Start all services
docker compose down      # Stop all services
docker compose logs -f   # View logs
```

## Multi-stage Build

```
Stage 1: deps     → Install dependencies
Stage 2: build    → Build application
Stage 3: prod     → Minimal production image
```

## Rules

- Containers run as non-root
- Use Alpine-based images
- Scan images for vulnerabilities
- No secrets in Dockerfiles
