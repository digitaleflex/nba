# Issue #024 — Cloche de notification admin non fonctionnelle

**Sévérité:** Medium
**Fichier:** `src/app/(admin)/admin/components/admin-header.tsx:114-120`
**Catégorie:** UX

## Problème

Le bouton de notification affiche un point rouge permanent (toujours visible) et ne fait rien au clic. C'est un élément décoratif qui trompe l'utilisateur.

## Solution

Option 1 — Implémenter un dropdown de notifications
Option 2 — Retirer le bouton ou le marquer comme "Bientôt disponible"

## Impact

- Aujourd'hui : bouton trompeur
- Après : fonctionnel ou absent
