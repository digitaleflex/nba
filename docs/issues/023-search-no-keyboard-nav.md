# Issue #023 — Recherche admin sans navigation clavier

**Sévérité:** Medium
**Fichier:** `src/app/(admin)/admin/components/admin-header.tsx:166-274`
**Catégorie:** Accessibility

## Problème

Les résultats de recherche n'ont pas de navigation ArrowUp/ArrowDown, pas de `role="listbox"` / `role="option"`. Le pattern combobox n'est pas implémenté.

## Solution

Implémenter le pattern ARIA combobox :
- `role="combobox"` sur l'input
- `role="listbox"` sur le conteneur de résultats
- `role="option"` sur chaque résultat
- Navigation flèches avec `aria-activedescendant`

## Impact

- Aujourd'hui : recherche inaccessible au clavier
- Après : navigation complète aux flèches
