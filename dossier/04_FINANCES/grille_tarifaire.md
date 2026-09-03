# 💰 Grille tarifaire — SignauxX

## Référence rapide

| Prestation | Tarif |
|---|---|
| **Valeur de remplacement** (coût recréer) | 18 500 000 FCFA |
| **Cession projet complet** | 150 000 – 200 000 € |
| **Licence white-label / an / client** | 50 000 – 80 000 € |
| **Maintenance annuelle** | 15 – 25 % valeur projet |
| **Évolution feature / jour** | 1 500 € (forfait ou régie) |

---

## 🎯 Détail par scénario

### Scénario 1 — Cession totale (revente du projet)

| Élément | Valeur |
|---|---|
| Coût de développement (89 j-h × 700 € Europe senior) | 62 300 € |
| Bonus qualité production (+58 %) | +36 134 € |
| Documentation + handover (5 j-h) | +3 500 € |
| Marge repreneur | inclus |
| **Total catalogue** | **150 000 – 200 000 €** |

**Inclus dans la cession :**
- Code source complet (repo privé GitHub)
- Base de données de production (dump Neon)
- Accès VPS1 + VPS2
- Comptes GHCR, Sentry, B2, Resend
- Documentation complète
- 30 jours de support post-cession inclus

### Scénario 2 — Maintenance annuelle

| Type | Coût mensuel | Coût annuel |
|---|---|---|
| Maintenance corrective seule (bugfixes prod) | 1 500 € | 18 000 € |
| Maintenance évolutive (5 j/mois features) | 7 500 € | 90 000 € |
| Tier complet (24/7, monitoring, MAJ deps) | 3 000 € | 36 000 € |
| **Recommandé** : Correctif + 2j évolutif/mois | **4 500 €** | **54 000 €** |

### Scénario 3 — Licence white-label

| Élément | Tarif |
|---|---|
| Setup initial (branding + config nouveau client) | 8 000 € (one-shot) |
| Licence annuelle par instance | 30 000 – 60 000 € / an |
| Maintenance + support | 12 000 € / an |
| **Total an 1** | **50 000 – 80 000 €** |

### Scénario 4 — Évolution à la demande

| Type | Tarif / jour | Engagement |
|---|---|---|
| Feature standard | 1 500 € | 5 jours minimum |
| Refonte module | 1 800 € | 10 jours minimum |
| Audit sécurité | 2 000 € | 3-5 jours |
| Migration stack majeure (Next 16 → 17 par ex) | 2 000 € | 10-15 jours |

---

## 💡 Justification de la valeur

### Coût de remplacement (cocher si on devait tout refaire)

```
Code applicatif    : 150 517 LOC  → 753 j-h théoriques
Tests              : 5 410 LOC   → 54 j-h
Infra/config       : 53 fichiers → 2 j-h
────────────────────────────────────────────────
TOTAL théorique    : ~810 j-h

Réalité (équipe senior) : 89 j-h
Efficacité : × 9 (grâce à l'expertise + IA + réutilisation patterns)
```

### Bonus qualité production (+58 %)

| Critère qualité | Bonus |
|---|---|
| 0 vulnérabilité | +8 % |
| 8 releases disciplinées | +5 % |
| Architecture multi-VPS | +10 % |
| CSP + RBAC + audit | +13 % |
| Tests + accessibilité | +9 % |
| Design system premium | +6 % |
| Résilience (B2, Sentry, alertes) | +6 % |
| Documentation | +3 % |
| **Total bonus** | **+60 %** |
| Malus (manque tests E2E, i18n limité) | -15 % |
| **Bonus net** | **+45 %** (conservateur) → +58 % (optimiste) |

---

## 📊 Comparaison marché (2026)

### Afrique de l'Ouest

| Profil | Tarif/jour | 89 j-h |
|---|---|---|
| Junior | 40 000 FCFA | 3,6 M FCFA |
| Confirmé | 75 000 FCFA | 6,7 M FCFA |
| **Senior fullstack (référence)** | **120 000 FCFA** | **10,7 M FCFA** |
| Lead / expert | 180 000 FCFA | 16 M FCFA |

### Europe (France, Belgique, Portugal)

| Profil | Tarif/jour | 89 j-h |
|---|---|---|
| Confirmé | 500 € | 44 500 € |
| **Senior fullstack** | **700 €** | **62 300 €** |
| Lead / architecte | 900 € | 80 100 € |

### États-Unis (San Francisco / NYC)

| Profil | Tarif/jour | 89 j-h |
|---|---|---|
| Confirmé | 800 $ | 71 200 $ |
| Senior fullstack | 1 200 $ | 106 800 $ |
| Lead / staff engineer | 1 500 $ | 133 500 $ |

### Agence / ESN Europe

| Élément | Coût |
|---|---|
| Coût dev interne | 60 000 € |
| Marge agence (× 1,8) | 108 000 € |
| Tests + QA + maintenance 1 an | 25 000 € |
| Gestion de projet | 15 000 € |
| **Total** | **~160 000 €** |

---

## 🎤 Messages clés pour pitch commercial

> *« SignauxX, c'est 89 jours-homme de développement senior, livrés en 67 jours calendaires grâce à une productivité de 1,33×. »*

> *« Zéro vulnérabilité connue, 8 releases versionnées, architecture distribuée VPS1+VPS2 — c'est du production-grade, pas du MVP. »*

> *« Le coût de remplacement seul est de 18 millions FCFA. La valeur catalogue en cession est de 150 000 à 200 000 €. »*

> *« 81 utilisateurs en production après 67 jours. C'est la preuve que ça tourne. »*

---

*Document confidentiel — usage strictement privé*