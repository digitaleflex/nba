#!/bin/bash
# Active l'impersonation admin en prod.
# La migration add_ba_role a déjà été appliquée (ADD COLUMN nullable, sans perte).
# Ce script initialise ba_role à partir du RBAC custom : "admin" pour
# ADMIN/SUPER_ADMIN, "user" sinon. À exécuter une fois après le déploiement.
set -euo pipefail

echo "==> backfill ba_role = 'admin' pour ADMIN/SUPER_ADMIN"
pnpm tsx scripts/backfill-ba-role.ts

echo ""
echo "Terminé. L'impersonation est active : un admin peut se connecter"
echo "en tant que membre depuis le panneau membre (bouton 'Se connecter en"
echo "tant que')."
