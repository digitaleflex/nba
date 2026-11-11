#!/usr/bin/env bash
# Prépare un environnement local complet SANS Docker : Postgres + Redis + schéma + données de démo.
# Idempotent : peut être relancé sans risque. NE JAMAIS pointer vers une base de production.
#
# Usage : bash scripts/dev/setup-local.sh
# Variables : DB_NAME (défaut nba_dev), DB_PASSWORD (défaut postgres)
set -euo pipefail
cd "$(dirname "$0")/../.."

DB_NAME="${DB_NAME:-nba_dev}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
ADMIN_EMAIL="admin@example.com";  ADMIN_PASSWORD='Admin12345!x'
MEMBER_EMAIL="membre@example.com"; MEMBER_PASSWORD='Membre12345!x'
PSQL_ADMIN="psql -h localhost -U postgres -v ON_ERROR_STOP=1 -q"
export PGPASSWORD="$DB_PASSWORD"

say() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

say "1/7 PostgreSQL"
if ! pg_isready -h localhost -q 2>/dev/null; then
  (service postgresql start || sudo service postgresql start || brew services start postgresql) >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do pg_isready -h localhost -q 2>/dev/null && break; sleep 1; done
fi
pg_isready -h localhost -q || { echo "PostgreSQL injoignable sur localhost:5432. Démarrez-le (ou : docker compose up -d)."; exit 1; }
if ! $PSQL_ADMIN -d postgres -c '\q' 2>/dev/null; then
  # premier lancement : fixer le mot de passe de l'utilisateur postgres
  (su postgres -c "psql -c \"ALTER USER postgres PASSWORD '$DB_PASSWORD'\"" \
   || sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASSWORD'") >/dev/null
fi
$PSQL_ADMIN -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || $PSQL_ADMIN -d postgres -c "CREATE DATABASE $DB_NAME"

say "2/7 Redis"
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes >/dev/null
redis-cli ping >/dev/null || { echo "Redis injoignable sur localhost:6379."; exit 1; }

say "3/7 Fichiers d'environnement (.env.local et .env, ignorés par git)"
if [ ! -f .env.local ]; then
  cat > .env.local <<ENV
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost:5432/${DB_NAME}
REDIS_URL=redis://localhost:6379
WS_ENABLED=false
BETTER_AUTH_SECRET=local-dev-secret-local-dev-secret-0123456789
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=re_dummy
RESEND_FROM_EMAIL=noreply@example.com
CAPTCHA_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=Admin
ENV
  echo "  .env.local créé"
fi
[ -f .env ] || cp .env.local .env

say "4/7 Dépendances et client Prisma"
pnpm install --frozen-lockfile >/dev/null
pnpm db:generate >/dev/null

say "5/7 Schéma de la base"
# `prisma migrate deploy` échoue sur une base VIDE (relation "trades" does not exist) : on génère le
# SQL complet depuis schema.prisma. NB : `prisma db push` est bloqué dans les sessions d'agents IA.
if ! $PSQL_ADMIN -d "$DB_NAME" -tc "SELECT to_regclass('public.users')" | grep -q users; then
  pnpm -s prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script \
    | $PSQL_ADMIN -d "$DB_NAME" >/dev/null
  echo "  schéma créé"
else
  echo "  schéma déjà présent"
fi

say "6/7 Données de référence (rôles, plans) et comptes de démo"
pnpm -s db:seed >/dev/null
for acct in "$ADMIN_EMAIL|$ADMIN_PASSWORD|Admin" "$MEMBER_EMAIL|$MEMBER_PASSWORD|Jean.Membre"; do
  IFS='|' read -r email pass name <<<"$acct"
  if $PSQL_ADMIN -d "$DB_NAME" -tc "SELECT 1 FROM users WHERE email='$email'" | grep -q 1; then
    echo "  $email existe déjà"
  else
    timeout 120 pnpm -s tsx scripts/createAdmin.ts --email="$email" --password="$pass" --name="$name" >/dev/null 2>&1 || true
    $PSQL_ADMIN -d "$DB_NAME" -tc "SELECT 1 FROM users WHERE email='$email'" | grep -q 1 \
      || { echo "Échec de la création de $email"; exit 1; }
    echo "  $email créé"
  fi
done

say "7/7 Données de démonstration (signaux, prospects, abonnement)"
$PSQL_ADMIN -d "$DB_NAME" -f scripts/dev/demo-data.sql

cat <<DONE

✅ Environnement prêt.
   Lancer l'application : pnpm dev           (http://localhost:3000)
   Admin  : ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}
   Membre : ${MEMBER_EMAIL}  /  ${MEMBER_PASSWORD}
DONE
