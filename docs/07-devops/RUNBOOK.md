# Runbook

> **Version:** 1.0

## Common Operations

### Deploy New Version

```bash
git pull origin main
docker compose up -d --build
docker compose exec -T nba-app npx prisma migrate deploy
```

### View Logs

```bash
docker compose logs -f nba-app
docker compose logs -f nba-worker
```

### Restart Service

```bash
docker compose restart nba-app
docker compose restart nba-worker
```

### Backup Database

Automatic via Neon. Manual: use Neon console.

### Check Queue Status

```bash
docker compose exec redis redis-cli LLEN bull:signal-distribution:wait
docker compose exec redis redis-cli LLEN bull:notification:wait
```

### Health Check

```bash
curl https://neverbrokeagain.com/api/public/health
```
