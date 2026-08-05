#!/usr/bin/env bash
# Cron de maintenance Docker — nettoie le cache et alerte si swap saturé
# À mettre en crontab : */30 * * * * /home/audest/nba/scripts/purge.sh
set -euo pipefail

# ── Discord ──
ENV_FILE="/home/actions-runner/secrets/.env.production"
if [[ -z "${DISCORD_WEBHOOK_URL:-}" && -f "$ENV_FILE" ]]; then
  set -a; . "$ENV_FILE"; set +a
fi

send_discord() {
  local webhook="${DISCORD_WEBHOOK_URL:-}"
  [[ -z "$webhook" ]] && return 0
  curl -fsS -X POST "$webhook" -H "Content-Type: application/json" \
    -d "{\"embeds\":[{\"title\":\"$1\",\"description\":\"$2\",\"color\":$3,\"timestamp\":\"$(date -Iseconds)\"}]}" \
    >/dev/null 2>&1 || true
}

ALERT_STATE_FILE="/tmp/vps-alert-state"

alert_once() {
  # Anti-spam : une seule alerte tant que le problème persiste
  if [[ -f "$ALERT_STATE_FILE" ]]; then
    return 1
  fi
  echo "ALERT" > "$ALERT_STATE_FILE"
  return 0
}

clear_alerts() {
  rm -f "$ALERT_STATE_FILE"
}

ISSUES=0

# ── Alerte swap ──
SWAP_USED=$(free | awk '/Swap/{print $3}')
SWAP_TOTAL=$(free | awk '/Swap/{print $2}')
if [ "$SWAP_TOTAL" -gt 0 ]; then
  SWAP_PCT=$(( SWAP_USED * 100 / SWAP_TOTAL ))
  if [ "$SWAP_PCT" -gt 80 ]; then
    echo "[WARN] Swap usage at ${SWAP_PCT}% — possible memory pressure" | systemd-cat -t purge -p warning
    if alert_once; then
      send_discord "🟠 VPS — Swap élevé" "**Swap :** ${SWAP_PCT}% utilisé\n**Mémoire dispo :** $(free -h | awk '/Mem/{print $7}')" 16753920
    fi
    ISSUES=1
  fi
fi

# ── Alerte mémoire ──
MEM_AVAIL=$(awk '/MemAvailable/{print $2}' /proc/meminfo)
MEM_TOTAL=$(awk '/MemTotal/{print $2}' /proc/meminfo)
MEM_PCT=$(( (MEM_TOTAL - MEM_AVAIL) * 100 / MEM_TOTAL ))
if [ "$MEM_PCT" -gt 90 ]; then
  echo "[CRIT] Memory at ${MEM_PCT}% usage" | systemd-cat -t purge -p err
  if alert_once; then
    send_discord "🔴 VPS — Mémoire saturée" "**RAM :** ${MEM_PCT}% utilisée\n**Dispo :** $(free -h | awk '/Mem/{print $7}')\n**Swap :** ${SWAP_PCT:-0}%" 15548997
  fi
  ISSUES=1
fi

# Si plus aucun problème, on reset l'état (permettra une nouvelle alerte au prochain incident)
if [ "$ISSUES" -eq 0 ]; then
  clear_alerts
fi

# ── Nettoyage léger toutes les 30 min ──
docker image prune -f --filter "until=1h" 2>/dev/null || true
docker container prune -f --filter "until=1h" 2>/dev/null || true

# ── Purge lourde 1x par jour (exécuté aux heures paires ou via cron séparé) ──
if [ "$(date +%H)" = "03" ] && [ "$(date +%M)" -lt 30 ]; then
  docker builder prune -f --filter "until=24h" 2>/dev/null || true
  docker image prune -a -f --filter "until=48h" 2>/dev/null || true
fi
