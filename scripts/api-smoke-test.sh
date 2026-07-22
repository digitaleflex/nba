#!/bin/sh
# Smoke test API — vérifie que les routes critiques répondent
# Usage: TEST_URL=https://access.signauxx.com scripts/api-smoke-test.sh
#        TEST_URL=... scripts/api-smoke-test.sh --wait

set -e

BASE="${TEST_URL:-http://localhost:3000}"
PASS=0
FAIL=0

WAIT_MODE=false
if [ "${1:-}" = "--wait" ] || [ "${1:-}" = "-w" ]; then
  WAIT_MODE=true
  shift
fi

if [ "$WAIT_MODE" = true ]; then
  echo ""
  echo "⏳ Attente du démarrage de l'app..."
  for i in $(seq 1 12); do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 10 -L "$BASE/api/auth/captcha" || echo 000)"
    echo "  tentative $i -> HTTP $CODE"
    case "$CODE" in
      2*) echo "✅ App prête."; break ;;
    esac
    [ "$i" -lt 12 ] && sleep 10
  done
  FINAL_CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 10 -L "$BASE/api/auth/captcha" || echo 000)"
  case "$FINAL_CODE" in
    2*) ;;
    *)
      echo "❌ App non disponible après 12 tentatives."
      exit 1
      ;;
  esac
fi

check() {
  local method="$1" path="$2" expected="$3" label="$4"
  local response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" \
    -H "Content-Type: application/json" ${5:+-d "$5"})
  if [ "$response" = "$expected" ]; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label (HTTP $response, attendu $expected)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "🔍 Smoke Test API — $BASE"
echo "══════════════════════════════"

echo ""
echo "📡 Routes publiques :"
check GET "/api/auth/captcha" 200 "CAPTCHA generation"
check POST "/api/auth/captcha/verify" 200 "CAPTCHA verify" '{"token":"x","answer":0}'
check GET "/api/public/health" 200 "Healthcheck"

echo ""
echo "🔒 Routes admin (sans auth → 401/403) :"
check GET "/api/admin/security/fraud/abuse" 401 "Fraud abuse"
check GET "/api/admin/security/fraud/events" 401 "Fraud events"
check GET "/api/admin/security/alerts" 401 "Security alerts"
check GET "/api/admin/metrics" 401 "Metrics"
check GET "/api/admin/sessions" 401 "Sessions"
check GET "/api/admin/support" 401 "Support tickets"
check GET "/api/admin/security/fraud/blocked-ips" 401 "Blocked IPs"
check GET "/api/admin/security/fraud/playbook" 401 "Playbooks"

echo ""
echo "📖 Documentation API :"
check GET "/api/docs/openapi.json" 200 "OpenAPI spec"

echo ""
echo "══════════════════════════════"
echo "Résultat : $PASS passes / $FAIL échecs"
echo "══════════════════════════════"

[ "$FAIL" -eq 0 ] || exit 1
