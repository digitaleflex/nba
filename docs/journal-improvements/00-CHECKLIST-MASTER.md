# Journal de Trading — Plan d'Amélioration Complet

## Objectif
Transformer le journal de trading basique en un outil intelligent qui guide le trader (même débutant) avec validation directionnelle, calculs automatiques, suggestions, et erreurs claires.

---

## Fichiers de checklist

| # | Fichier | Priorité | Commit |
|---|---------|----------|--------|
| 01 | `01-validation-directionnelle.md` | 🔴 HAUTE | `feat(journal): add directional validation` |
| 02 | `02-rr-persistence.md` | 🔴 HAUTE | `feat(journal): persist R:R ratio to database` |
| 03 | `03-fix-stats-rr.md` | 🔴 HAUTE | `fix(journal): correct inverted R:R in stats` |
| 04 | `04-autocomplete-tags-paires.md` | 🟠 MOYENNE | `feat(journal): add autocomplete for tags and pairs` |
| 05 | `05-form-fields-commission-swap-date.md` | 🟠 MOYENNE | `feat(journal): add commission, swap, and date fields` |
| 06 | `06-inline-errors.md` | 🟠 MOYENNE | `feat(journal): replace toasts with inline field errors` |
| 07 | `07-lot-size-suggestion.md` | 🟢 BASSE | `feat(journal): suggest lot size based on risk %` |
| 08 | `08-tests-finaux.md` | 🔴 HAUTE | `test(journal): final validation and typecheck` |

---

## Règles
- Un commit par fichier de checklist complété
- Tous les tests passent avant chaque commit
- Aucun commentaire ajouté sauf si demandé
- Conserver le style de code existant
