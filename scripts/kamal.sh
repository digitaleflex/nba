#!/usr/bin/env bash
# Wrapper pour les commandes Kamal
# Expose automatiquement le token GHCR et le PATH Ruby
set -e

cd "$(dirname "$0")/.."

export KAMAL_REGISTRY_PASSWORD="${KAMAL_REGISTRY_PASSWORD:-$(gh auth token 2>/dev/null)}"
export NEXT_PUBLIC_VAPID_PUBLIC_KEY="${NEXT_PUBLIC_VAPID_PUBLIC_KEY}"
export PATH="$HOME/.local/share/gem/ruby/3.2.0/bin:$PATH"

if [ -z "$KAMAL_REGISTRY_PASSWORD" ]; then
  echo "Error: KAMAL_REGISTRY_PASSWORD not set and gh not authenticated"
  exit 1
fi

exec kamal "$@"
