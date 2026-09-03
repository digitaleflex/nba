#!/usr/bin/env bash
# ============================================================================
# Génération automatisée des PDF pour le dossier SignauxX
# Pré-requis : pandoc + wkhtmltopdf installés (voir README.md)
# Usage : bash generer_pdfs.sh
# ============================================================================

set -euo pipefail

# --- Configuration ---
DOSSIER="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$DOSSIER/99_GENERATION_PDF"
DATE=$(date +%Y-%m-%d)

# --- Vérifications ---
command -v pandoc >/dev/null 2>&1 || {
  echo "❌ pandoc non trouvé. Installez-le : apt-get install pandoc"
  exit 1
}

command -v wkhtmltopdf >/dev/null 2>&1 || {
  echo "❌ wkhtmltopdf non trouvé. Installez-le : apt-get install wkhtmltopdf"
  exit 1
}

mkdir -p "$OUTPUT_DIR"

# --- Helpers ---
generer_pdf() {
  local source="$1"
  local output="$2"
  local titre="$3"

  echo "📄 Génération : $output"
  pandoc "$DOSSIER/$source" \
    -o "$OUTPUT_DIR/$output" \
    --pdf-engine=wkhtmltopdf \
    --toc --toc-depth=2 \
    -V title="$titre" \
    -V author="digitaleflex" \
    -V date="$DATE" \
    --quiet
}

# --- Génération des livrables clés ---
echo ""
echo "🚀 Génération des PDF du dossier SignauxX"
echo "==========================================="
echo ""

# 1. Executive Summary (à partager sous accord)
generer_pdf \
  "01_PRESENTATION/executive_summary.md" \
  "executive_summary.pdf" \
  "SignauxX — Executive Summary"

# 2. Grille tarifaire (confidentiel)
generer_pdf \
  "04_FINANCES/grille_tarifaire.md" \
  "grille_tarifaire.pdf" \
  "SignauxX — Grille tarifaire"

# 3. Liste des features
generer_pdf \
  "01_PRESENTATION/features_liste.md" \
  "features_liste.pdf" \
  "SignauxX — Liste des features"

# 4. Documentation complète (pour archive)
echo ""
echo "📚 Génération du dossier complet (peut prendre quelques minutes)..."
pandoc \
  "$DOSSIER/00_INDEX.md" \
  "$DOSSIER"/01_PRESENTATION/*.md \
  "$DOSSIER"/02_TECHNIQUE/*.md \
  "$DOSSIER"/03_METRIQUES_TRAVAIL/*.md \
  "$DOSSIER"/04_FINANCES/*.md \
  "$DOSSIER"/06_PRODUCTION/*.md \
  "$DOSSIER"/08_CONTACTS_HISTORIQUE/*.md \
  -o "$OUTPUT_DIR/dossier_complet.pdf" \
  --pdf-engine=wkhtmltopdf \
  --toc --toc-depth=3 \
  -V title="NBA / SignauxX — Dossier projet complet" \
  -V date="$DATE" \
  -V geometry:margin=2cm \
  -V fontsize=11pt \
  --quiet

echo ""
echo "✅ Génération terminée"
echo ""
echo "📁 Fichiers produits dans : $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"/*.pdf 2>/dev/null || echo "(aucun PDF produit)"

echo ""
echo "⚠️  RAPPELS DE CONFIDENTIALITÉ"
echo "  - executive_summary.pdf : partageable sous NDA"
echo "  - grille_tarifaire.pdf : STRICTEMENT CONFIDENTIEL"
echo "  - features_liste.pdf : partageable sous NDA"
echo "  - dossier_complet.pdf : archive personnelle"
echo ""