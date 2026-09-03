# 📜 ReadMe — Dossier projet NBA / SignauxX

> **Dossier strictement confidentiel** — usage privé uniquement.

---

## 🎯 À propos

Ce dossier a été créé le **3 septembre 2026** pour servir à **3 usages** :

1. **Archive personnelle** : tracer l'historique intellectuel du projet
2. **Justification client** : démontrer la valeur en cas de litige ou demande de remise
3. **Cession / reprise** : fournir un dossier complet à un repreneur ou investisseur

Il documente le projet **NBA / SignauxX**, plateforme de signaux de trading développée entre le **25 juin et le 31 août 2026** (67 jours, 89 jours-homme, 773 commits humains).

---

## 📂 Structure

```
dossier/
├── 00_INDEX.md                            ← Point d'entrée
├── 01_PRESENTATION/                       ← Pour clients / prospects
│   ├── executive_summary.md               ← 1 page vitrine
│   ├── features_liste.md                  ← Inventaire complet
│   └── parcours_utilisateur.md            ← (à compléter)
├── 02_TECHNIQUE/                          ← Pour CTO / devs repreneurs
│   ├── stack_technique.md                 ← Versions + archi
│   ├── architecture.md                    ← (à compléter)
│   ├── base_de_donnees.md                 ← (à compléter)
│   ├── api_endpoints.md                   ← (à compléter)
│   ├── securite.md                        ← (à compléter)
│   └── cicd_deploiement.md                ← (à compléter)
├── 03_METRIQUES_TRAVAIL/                  ← Preuve de travail
│   ├── git_analytics.md                   ← ✅
│   ├── volumetrie_code.md                 ← (à compléter)
│   ├── burndown_par_phase.md              ← (à compléter)
│   ├── releases_changelog.md              ← (à compléter)
│   └── heatmap_activite.md                ← (à compléter)
├── 04_FINANCES/                           ← Tarification
│   ├── grille_tarifaire.md                ← ✅
│   ├── comparaison_marche.md              ← (à compléter)
│   ├── decomposition_prix.md              ← (à compléter)
│   └── conditions_commerciales.md         ← (à compléter)
├── 05_JURIDIQUE/                          ← Propriété intellectuelle
│   ├── preuve_anteriorite.md              ← ✅
│   ├── propriete_intellectuelle.md        ← (à compléter)
│   ├── registre_contributions.md          ← (à compléter)
│   ├── modele_nda.md                      ← ✅
│   └── modele_acte_cession.md             ← ✅
├── 06_PRODUCTION/                         ← Preuves que ça tourne
│   ├── dashboard_status.md                ← ✅
│   ├── utilisateurs_actifs.md             ← (à compléter)
│   ├── securite_audit.md                  ← (à compléter)
│   └── infrastructure.md                  ← (à compléter)
├── 07_GRAPHIQUE_UI/                       ← Captures + design system
│   ├── logo_brand.md                      ← (à compléter)
│   ├── captures_par_module.md             ← (à compléter)
│   ├── design_system.md                   ← (à compléter)
│   └── avant_apres.md                     ← (à compléter)
├── 08_CONTACTS_HISTORIQUE/                ← Contributeurs + jalons
│   ├── contributeurs.md                   ← ✅
│   ├── jalons_cles.md                     ← (à compléter)
│   └── stack_evolution.md                 ← (à compléter)
└── 99_GENERATION_PDF/                     ← Scripts PDF
    ├── README.md                          ← Instructions pandoc
    ├── generer_pdfs.sh                    ← Script automatisé
    └── (PDF générés ici)
```

✅ = fichier prêt | 🔲 = à compléter selon besoin

---

## 🚀 Démarrage rapide

### Pour justifier un prix au client (5 min de préparation)

```bash
# 1. Lire l'executive summary
cat 01_PRESENTATION/executive_summary.md

# 2. Lire la grille tarifaire
cat 04_FINANCES/grille_tarifaire.md

# 3. Générer le PDF (si pandoc installé)
bash 99_GENERATION_PDF/generer_pdfs.sh
```

### Pour céder à un repreneur (30 min de préparation)

1. Signer un **NDA** (`05_JURIDIQUE/modele_nda.md`)
2. Préparer un **acte de cession** (`05_JURIDIQUE/modele_acte_cession.md`)
3. Présenter la **stack technique** (`02_TECHNIQUE/stack_technique.md`)
4. Présenter la **grille tarifaire** (`04_FINANCES/grille_tarifaire.md`)
5. Fournir la **preuve d'antériorité** (`05_JURIDIQUE/preuve_anteriorite.md`)
6. Générer le dossier complet en PDF

### Pour ton archive personnelle (lecture séquentielle)

1. `00_INDEX.md`
2. `08_CONTACTS_HISTORIQUE/contributeurs.md`
3. `03_METRIQUES_TRAVAIL/git_analytics.md`
4. `02_TECHNIQUE/stack_technique.md`
5. `01_PRESENTATION/features_liste.md`
6. `04_FINANCES/grille_tarifaire.md`
7. `06_PRODUCTION/dashboard_status.md`

---

## 📊 Synthèse du projet

| | Valeur |
|---|---|
| Période | 25 juin → 31 août 2026 (67 j) |
| Jours-homme | **89** |
| Commits humains | **773** |
| LOC code | **157 381** |
| LOC tests | 5 410 |
| Releases | **8** (v1.0.0 → v2.5.0) |
| Utilisateurs prod | **81** (76 membres + 5 admins) |
| Vulnérabilités | **0** |
| **Valeur catalogue** | **18 500 000 FCFA** (~27 500 €) |
| **Valeur cession agence** | **100 000 – 160 000 €** |

---

## ⚠️ Confidentialité

**Ce dossier est strictement confidentiel.** Ne jamais :

- ❌ Transmettre sans NDA signé
- ❌ Poster publiquement en ligne
- ❌ Inclure dans une présentation client générique
- ❌ Partager via email non chiffré

Toujours :

- ✅ Signer un NDA avant transmission
- ✅ Chiffrer les fichiers (AES-256 ou coffre-fort numérique)
- ✅ Watermarker les PDF avec le nom du destinataire
- ✅ Garder trace des destinataires (registre des transmissions)

---

## 📞 Métadonnées du dossier

| | |
|---|---|
| **Auteur** | digitaleflex |
| **Date de création** | 3 septembre 2026 |
| **Version** | 1.0 |
| **Statut** | Strictement privé |
| **Format** | Markdown (`.md`) + scripts de génération PDF |

---

*Document confidentiel — usage strictement privé*