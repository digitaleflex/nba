#!/bin/bash
# Active l'impersonation admin en prod.
# Enchaîne : migration schéma (colonne ba_role) + backfill des rôles better-auth.
# À exécuter une seule fois après le déploiement du commit d'impersonation.
set -euo pipefail

echo "==> 1/2 prisma db push (ajout colonne ba_role)"
pnpm prisma db push --skip-generate

echo "==> 2/2 backfill ba_role = 'admin' pour ADMIN/SUPER_ADMIN"
pnpm tsx scripts/backfill-ba-role.ts

echo ""
echo "Terminé. L'impersonation est active : un admin peut se connecter"
echo "en tant que membre depuis le panneau membre (bouton 'Se connecter en"
echo "tant que'). Pense à redéployer si le déploiement précède ce script."
