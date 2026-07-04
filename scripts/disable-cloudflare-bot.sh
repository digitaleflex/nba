#!/bin/bash
# Disable Cloudflare Bot Fight Mode
# Fix: CSP violations from Cloudflare's bot challenge blocking our scripts
# When Bot Fight Mode is on, Cloudflare injects an iframe challenge with
# a strict CSP (script-src 'unsafe-inline' 'unsafe-eval' without 'self')
# that blocks our app's own scripts from loading.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ -z "$CF_API_TOKEN" ]; then
  echo -e "${RED}❌ CF_API_TOKEN manquant${NC}"
  echo "   Usage: CF_API_TOKEN=xxx CF_ZONE_ID=yyy $0"
  exit 1
fi

if [ -z "$CF_ZONE_ID" ]; then
  echo -e "${RED}❌ CF_ZONE_ID manquant${NC}"
  exit 1
fi

API="https://api.cloudflare.com/client/v4"

echo "========================================"
echo "  Cloudflare Bot Management"
echo "  Zone: $CF_ZONE_ID"
echo "========================================"

# 1. Get current bot management settings
echo ""
echo "📋 Lecture des paramètres actuels..."
CURRENT=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "$API/zones/$CF_ZONE_ID/bot_management" 2>&1)

if ! echo "$CURRENT" | grep -q '"success":true'; then
  echo -e "${RED}❌ Erreur API${NC}"
  echo "$CURRENT" | head -5
  exit 1
fi

FIGHT_MODE=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['fight_mode'])")
echo "   Bot Fight Mode actuel: $FIGHT_MODE"

if [ "$FIGHT_MODE" = "false" ]; then
  echo -e "${GREEN}✅ Bot Fight Mode déjà désactivé${NC}"
  exit 0
fi

# 2. Disable Bot Fight Mode
echo ""
echo "🔧 Désactivation du Bot Fight Mode..."
RESPONSE=$(curl -s -X PUT \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fight_mode":"false"}' \
  "$API/zones/$CF_ZONE_ID/bot_management" 2>&1)

if ! echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${RED}❌ Erreur${NC}"
  echo "$RESPONSE" | head -5
  exit 1
fi

NEW_MODE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['fight_mode'])")
echo "   Nouveau: $NEW_MODE"

if [ "$NEW_MODE" = "false" ]; then
  echo ""
  echo -e "${GREEN}✅ Bot Fight Mode désactivé !${NC}"
  echo "   Les CSP violations devraient disparaître dans ~30s"
  echo "   (propagation Cloudflare)"
else
  echo -e "${RED}⚠️ Valeur inattendue${NC}"
  exit 1
fi
