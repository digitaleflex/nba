#!/usr/bin/env bash
# Cron de maintenance Docker — nettoie le cache et alerte si swap saturé
# À mettre en crontab : */30 * * * * /home/audest/nba/scripts/purge.sh
set -euo pipefail

# ── Alerte swap ──
SWAP_USED=$(free | awk '/Swap/{print $3}')
SWAP_TOTAL=$(free | awk '/Swap/{print $2}')
if [ "$SWAP_TOTAL" -gt 0 ]; then
  SWAP_PCT=$(( SWAP_USED * 100 / SWAP_TOTAL ))
  if [ "$SWAP_PCT" -gt 80 ]; then
    echo "[WARN] Swap usage at ${SWAP_PCT}% — possible memory pressure" | systemd-cat -t purge -p warning
  fi
fi

# ── Alerte mémoire ──
MEM_AVAIL=$(awk '/MemAvailable/{print $2}' /proc/meminfo)
MEM_TOTAL=$(awk '/MemTotal/{print $2}' /proc/meminfo)
MEM_PCT=$(( (MEM_TOTAL - MEM_AVAIL) * 100 / MEM_TOTAL ))
if [ "$MEM_PCT" -gt 90 ]; then
  echo "[CRIT] Memory at ${MEM_PCT}% usage" | systemd-cat -t purge -p err
fi

# ── Nettoyage léger toutes les 30 min ──
docker image prune -f --filter "until=1h" 2>/dev/null || true
docker container prune -f --filter "until=1h" 2>/dev/null || true

# ── Purge lourde 1x par jour (exécuté aux heures paires ou via cron séparé) ──
if [ "$(date +%H)" = "03" ] && [ "$(date +%M)" -lt 30 ]; then
  docker builder prune -f --filter "until=24h" 2>/dev/null || true
  docker image prune -a -f --filter "until=48h" 2>/dev/null || true
fi
