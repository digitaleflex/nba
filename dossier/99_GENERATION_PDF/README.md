# 📄 Génération des PDF

> **Outils nécessaires** : `pandoc` (et optionnellement `wkhtmltopdf` pour les templates HTML).

---

## 🔧 Installation des dépendances

### Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y pandoc wkhtmltopdf texlive-latex-recommended \
  texlive-fonts-extra texlive-latex-extra
```

### macOS

```bash
brew install pandoc wkhtmltopdf
brew install --cask mactex
```

### Alpine (Docker)

```bash
apk add pandoc wkhtmltopdf
```

---

## 🚀 Génération rapide

### 1. Executive Summary → PDF

```bash
cd /home/audest/nba/dossier
pandoc 01_PRESENTATION/executive_summary.md \
  -o 99_GENERATION_PDF/executive_summary.pdf \
  --pdf-engine=wkhtmltopdf \
  --toc --toc-depth=2 \
  --css=template.css \
  -V title="SignauxX — Executive Summary" \
  -V author="digitaleflex" \
  -V date="$(date +%Y-%m-%d)"
```

### 2. Grille tarifaire → PDF

```bash
pandoc 04_FINANCES/grille_tarifaire.md \
  -o 99_GENERATION_PDF/grille_tarifaire.pdf \
  --pdf-engine=wkhtmltopdf \
  --toc --toc-depth=2 \
  -V title="SignauxX — Grille tarifaire"
```

### 3. Documentation complète → PDF

```bash
pandoc 00_INDEX.md \
  01_PRESENTATION/*.md \
  02_TECHNIQUE/*.md \
  03_METRIQUES_TRAVAIL/*.md \
  04_FINANCES/*.md \
  05_JURIDIQUE/*.md \
  06_PRODUCTION/*.md \
  07_GRAPHIQUE_UI/*.md \
  08_CONTACTS_HISTORIQUE/*.md \
  -o 99_GENERATION_PDF/dossier_complet.pdf \
  --pdf-engine=wkhtmltopdf \
  --toc --toc-depth=3 \
  -V title="NBA / SignauxX — Dossier projet complet" \
  -V geometry:margin=2cm \
  -V fontsize=11pt \
  -V mainfont="DejaVu Sans" \
  -V monofont="DejaVu Sans Mono"
```

---

## 🎨 Template HTML imprimable (sans pandoc)

Pour les cas où `pandoc` n'est pas disponible, voir `executive_summary.html` dans ce dossier.

```bash
# Pour générer un PDF depuis le HTML
wkhtmltopdf \
  --enable-local-file-access \
  --print-media-type \
  99_GENERATION_PDF/executive_summary.html \
  99_GENERATION_PDF/executive_summary.pdf
```

---

## 🤖 Script automatisé complet

Voir : `generer_pdfs.sh` dans ce dossier.

```bash
chmod +x 99_GENERATION_PDF/generer_pdfs.sh
bash 99_GENERATION_PDF/generer_pdfs.sh
```

---

## ⚠️ Confidentialité

Tous les PDF générés contiennent des informations confidentielles :

- **executive_summary.pdf** : partageable avec prospects sous NDA
- **grille_tarifaire.pdf** : confidentiel, JAMAIS transmis en clair
- **dossier_complet.pdf** : confidentiel, à protéger

Stockage recommandé :
- Vault personnel (1Password, Bitwarden, KeePass)
- Chiffrement AES-256
- Pas de partage via email non chiffré
- Watermark avec nom du destinataire si partagé

---

*Document confidentiel — usage strictement privé*