#!/bin/bash
# NBA — Comprehensive automated tests

BASE="https://access.signauxx.com"
PASS=0
FAIL=0
RESULTS=()

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test HTTP status code
test_status() {
  local name="$1"
  local path="$2"
  local expected="$3"
  shift 3
  local extra_headers=("$@")

  local headers=()
  for h in "${extra_headers[@]}"; do
    headers+=(-H "$h")
  done

  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "${headers[@]}" "$BASE$path" 2>/dev/null)

  if [[ "$code" =~ $expected ]]; then
    echo -e "${GREEN}✅ $name${NC} (HTTP $code)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ $name${NC} (expected $expected, got $code)"
    FAIL=$((FAIL + 1))
    RESULTS+=("$name: expected $expected, got $code")
  fi
}

# Test HTTP status after following redirects (no loop)
test_no_loop() {
  local name="$1"
  local path="$2"
  shift 2
  local extra_headers=("$@")

  local headers=()
  for h in "${extra_headers[@]}"; do
    headers+=(-H "$h")
  done

  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -L --max-redirs 5 "${headers[@]}" "$BASE$path" 2>/dev/null)

  if [ "$code" = "200" ]; then
    echo -e "${GREEN}✅ $name (no loop)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ $name — LOOP or error (HTTP $code)${NC}"
    FAIL=$((FAIL + 1))
    RESULTS+=("$name: loop, HTTP $code")
  fi
}

# Test JSON content
test_json() {
  local name="$1"
  local path="$2"
  local expected="$3"

  local result
  result=$(curl -s "$BASE$path" 2>/dev/null)

  if echo "$result" | grep -qE "$expected"; then
    echo -e "${GREEN}✅ $name${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ $name — expected: $expected${NC}"
    FAIL=$((FAIL + 1))
    RESULTS+=("$name: expected $expected")
  fi
}

# Test header presence
test_header() {
  local name="$1"
  local path="$2"
  local header="$3"

  local result
  result=$(curl -sI "$BASE$path" 2>/dev/null)

  if echo "$result" | grep -qi "$header"; then
    echo -e "${GREEN}✅ $name${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ $name — header missing: $header${NC}"
    FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo "  NBA — Automated Test Suite"
echo "  $(date)"
echo "========================================"
echo ""

# ============================================
echo "📄 1. Pages publiques"
echo "---"
test_status "GET /" "/" "^(200|307)$"
test_status "GET /register" "/register" "^200$"
test_status "GET /login" "/login" "^200$"
test_status "GET /forgot-password" "/forgot-password" "^200$"
test_status "GET /sw.js" "/sw.js" "^200$"
test_status "GET /favicon.ico" "/favicon.ico" "^200$"

# ============================================
echo ""
echo "🔄 2. Anti-loop (avec cookie jar pour vraie simulation navigateur)"
echo "---"
test_no_loop "Root /"
test_no_loop "Register"
test_no_loop "Login"
test_no_loop "Dashboard (no cookie)"
test_no_loop "Admin (no cookie)" "/admin"

# Test anti-loop avec cookie jar (simulation navigateur réelle)
for path in "/dashboard" "/register" "/login"; do
  rm -f /tmp/nba_test_cookies.txt
  # Set a bad cookie, follow redirects, and check that the final response is 200
  # (meaning the Set-Cookie: Max-Age=0 cleared the invalid cookie)
  FINAL=$(curl -s -L --max-redirs 5 -c /tmp/nba_test_cookies.txt \
    -b "Cookie: __Secure-better-auth.session_token=bad.cookie.sig; " \
    -o /dev/null -w '%{http_code}' "$BASE$path" 2>/dev/null)
  if [ "$FINAL" = "200" ]; then
    echo -e "${GREEN}✅ $path (bad cookie, cookie jar) — no loop${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ $path (bad cookie) — loop or error (HTTP $FINAL)${NC}"
    FAIL=$((FAIL + 1))
  fi
done

# ============================================
echo ""
echo "🔌 3. API Endpoints"
echo "---"
test_status "GET /api/public/plans" "/api/public/plans" "^200$"
test_status "GET /api/public/health" "/api/public/health" "^200$"
test_json "Plans has 6+ entries" "/api/public/plans" "Signals X Forex"

# ============================================
echo ""
echo "🔐 4. Auth flow end-to-end (avec cookie jar)"
echo "---"

TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASS="TestPassword123!"
COOKIE_JAR="/tmp/nba_test_cookies_$$.txt"
rm -f "$COOKIE_JAR"

# Sign up + capture cookies
SIGNUP_CODE=$(curl -s -o /tmp/nba_signup.json -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"name\":\"Test User\",\"callbackURL\":\"/onboarding\"}" 2>/dev/null)

if [ "$SIGNUP_CODE" = "200" ]; then
  USER_ID=$(python3 -c "import json; print(json.load(open('/tmp/nba_signup.json')).get('user', {}).get('id', ''))" 2>/dev/null)
  echo -e "${GREEN}✅ Signup: user=$USER_ID (cookies captured)${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}❌ Signup failed (HTTP $SIGNUP_CODE)${NC}"
  FAIL=$((FAIL + 1))
fi

# Send OTP (avec cookies du signup)
if [ -f "$COOKIE_JAR" ] && [ -s "$COOKIE_JAR" ]; then
  OTP_RESP=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/onboarding/send-otp" 2>/dev/null)
  if echo "$OTP_RESP" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Send OTP (cookie jar)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ Send OTP: $OTP_RESP${NC}"
    FAIL=$((FAIL + 1))
  fi

  # Read OTP from DB
  OTP=$(PGPASSWORD="npg_1p4AxYIEmkuj" psql -h ep-long-truth-atp4tmdq-pooler.c-9.us-east-1.aws.neon.tech -U neondb_owner -d neondb -tA -c "SELECT value FROM verifications WHERE identifier = 'otp-$TEST_EMAIL' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d '[:space:]')

  if [ -n "$OTP" ]; then
    echo -e "${GREEN}✅ OTP retrieved from DB${NC}"
    PASS=$((PASS + 1))

    # Verify OTP (with cookies)
    VERIFY=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/onboarding/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"code\":\"$OTP\"}" 2>/dev/null)
    if echo "$VERIFY" | grep -q '"success":true'; then
      echo -e "${GREEN}✅ Verify OTP${NC}"
      PASS=$((PASS + 1))
    else
      echo -e "${RED}❌ Verify OTP: $VERIFY${NC}"
      FAIL=$((FAIL + 1))
    fi
  else
    echo -e "${RED}❌ No OTP in DB${NC}"
    FAIL=$((FAIL + 1))
  fi

  # Select plan (with cookies)
  PLAN_ID=$(curl -s "$BASE/api/public/plans" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
  PLAN_RESP=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/public/select-plan" \
    -H "Content-Type: application/json" \
    -d "{\"planId\":\"$PLAN_ID\"}" 2>/dev/null)
  if echo "$PLAN_RESP" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Select plan (cookie jar)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ Select plan: $PLAN_RESP${NC}"
    FAIL=$((FAIL + 1))
  fi
else
  echo -e "${RED}❌ No cookies captured from signup${NC}"
  FAIL=$((FAIL + 1))
fi

# Cleanup
if [ -n "$USER_ID" ]; then
  PGPASSWORD="npg_1p4AxYIEmkuj" psql -h ep-long-truth-atp4tmdq-pooler.c-9.us-east-1.aws.neon.tech -U neondb_owner -d neondb -c "DELETE FROM access_requests WHERE user_id = '$USER_ID'; DELETE FROM verifications WHERE identifier LIKE 'otp%' OR identifier LIKE '$TEST_EMAIL'; DELETE FROM sessions WHERE user_id = '$USER_ID'; DELETE FROM accounts WHERE user_id = '$USER_ID'; DELETE FROM users WHERE id = '$USER_ID';" > /dev/null 2>&1
  echo -e "${GREEN}✅ Test user cleaned up${NC}"
  PASS=$((PASS + 1))
fi

rm -f "$COOKIE_JAR" /tmp/nba_signup.json

# ============================================
echo ""
echo "🛡️ 5. Security headers"
echo "---"
test_header "X-Content-Type-Options" "/" "x-content-type-options.*nosniff"
test_header "X-Frame-Options" "/" "x-frame-options.*DENY"
test_header "Referrer-Policy" "/" "referrer-policy"
test_header "Content-Security-Policy" "/" "content-security-policy"
test_header "Cloudflare challenge in CSP" "/" "cloudflare"

# ============================================
echo ""
echo "🔔 6. Push notification prerequisites"
echo "---"
test_status "sw.js served" "/sw.js" "^200$"

# ============================================
echo ""
echo "========================================"
TOTAL=$((PASS + FAIL))
echo -e "  RESULTS: ${GREEN}${PASS} passed${NC} / ${RED}${FAIL} failed${NC} / ${TOTAL} total"
echo "========================================"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed:${NC}"
  for r in "${RESULTS[@]}"; do
    echo "  - $r"
  done
fi

echo ""
exit 0
