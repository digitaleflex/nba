#!/bin/sh
# Script d'installation pour VPS2
# Usage: sh setup-vps2.sh
set -e

echo "=== Setup VPS2 - NBA Worker ==="

# 1. Installer Docker (si pas déjà présent)
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
fi

# 2. Installer Tailscale
if ! command -v tailscale >/dev/null 2>&1; then
  echo "Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
fi

# 3. Démarrer Tailscale (auth key à récupérer sur https://login.tailscale.com/admin/settings/keys)
if ! tailscale status >/dev/null 2>&1; then
  echo "Starting Tailscale..."
  echo "Récupère une auth key sur https://login.tailscale.com/admin/settings/keys"
  echo "Puis lance: tailscale up --authkey=tskey-auth-XXXXX"
  exit 1
fi

# 4. Afficher l'IP Tailscale de VPS2 (à noter pour VPS1)
echo ""
echo "=== Tailscale IP de ce VPS2: ==="
tailscale ip -4
echo ""
echo "Note cette IP et configure l'ACL sur https://login.tailscale.com/admin/acls/file"
echo "pour autoriser VPS1 <-> VPS2 sur le port 6379 (Redis)"

# 5. Créer le dossier storage (partagé via B2 ou NFS plus tard)
mkdir -p /app/storage

echo ""
echo "=== Setup terminé ==="
echo "Prochaines étapes:"
echo "  1. Sur VPS1, récupère l'IP Tailscale: tailscale ip -4"
echo "  2. Édite compose.vps2.yml et remplace VPS1_TAILSCALE_IP par cette IP"
echo "  3. Copie .env de VPS1 vers VPS2 (scp)"
echo "  4. Lance: docker compose -f compose.vps2.yml up -d"
