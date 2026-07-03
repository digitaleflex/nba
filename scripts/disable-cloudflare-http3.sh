#!/bin/bash
# Disable HTTP/3 (QUIC) on Cloudflare for a zone
# Fixes: ERR_TOO_MANY_REDIRECTS / 502 Bad Gateway on RSC requests
# Cause: Cloudflare HTTP/3 edge has compatibility issues with some Next.js responses

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check env vars
if [ -z "$CF_API_TOKEN" ]; then
  echo -e "${RED}❌ CF_API_TOKEN manquant${NC}"
  echo "   Crée un token sur https://dash.cloudflare.com/profile/api-tokens"
  echo "   Permissions requises: Zone > Zone Settings > Edit"
  echo "   Zone Resources: Include > Specific zone > signauxx.com"
  echo ""
  echo "   Usage: CF_API_TOKEN=xxx CF_ZONE_ID=yyy ./scripts/disable-cloudflare-http3.sh"
  exit 1
fi

if [ -z "$CF_ZONE_ID" ]; then
  echo -e "${RED}❌ CF_ZONE_ID manquant${NC}"
  echo "   Trouve-le sur https://dash.cloudflare.com → signauxx.com → Overview (colonne droite)"
  echo ""
  echo "   Usage: CF_API_TOKEN=xxx CF_ZONE_ID=yyy ./scripts/disable-cloudflare-http3.sh"
  exit 1
fi

API="https://api.cloudflare.com/client/v4"

echo "========================================"
echo "  Cloudflare HTTP/3 Toggle"
echo "  Zone: $CF_ZONE_ID"
echo "========================================"
echo ""

# 1. Get current setting
echo "📋 Lecture du paramètre actuel..."
CURRENT=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "$API/zones/$CF_ZONE_ID/settings/http3" 2>&1)

if ! echo "$CURRENT" | grep -q '"success":true'; then
  echo -e "${RED}❌ Erreur API Cloudflare${NC}"
  echo "$CURRENT" | head -5
  exit 1
fi

CURRENT_VALUE=$(echo "$CURRENT" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['value'])")
echo "   HTTP/3 actuel: $CURRENT_VALUE"

if [ "$CURRENT_VALUE" = "off" ]; then
  echo -e "${GREEN}✅ HTTP/3 est déjà désactivé — rien à faire${NC}"
  exit 0
fi

# 2. Set HTTP/3 to off
echo ""
echo "🔧 Désactivation de HTTP/3..."
RESPONSE=$(curl -s -X PATCH \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"off"}' \
  "$API/zones/$CF_ZONE_ID/settings/http3" 2>&1)

if ! echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${RED}❌ Erreur lors de la désactivation${NC}"
  echo "$RESPONSE" | head -10
  exit 1
fi

NEW_VALUE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['value'])")
echo "   HTTP/3 nouveau: $NEW_VALUE"

if [ "$NEW_VALUE" = "off" ]; then
  echo ""
  echo -e "${GREEN}✅ HTTP/3 désactivé avec succès !${NC}"
  echo "   Attendre ~30s pour la propagation Cloudflare"
  echo "   Les 502 sur les requêtes RSC devraient disparaître"
else
  echo -e "${YELLOW}⚠️ Valeur inattendue: $NEW_VALUE${NC}"
  exit 1
fi
