# Issue #014 — Révocation de session sans confirmation

**Sévérité:** High
**Fichier:** `src/app/(dashboard)/components/session-list.tsx:67-69`
**Catégorie:** UX / Safety

## Problème

Le bouton de révocation de session déclenche immédiatement sans confirmation. Un seul clic accidentel détruit la session. Pas de gestion d'erreur non plus — si l'API échoue, la session disparaît quand même de l'UI.

## Solution

1. Ajouter un `confirm()` ou un `Dialog` de confirmation
2. Ne retirer la session de l'UI qu'après succès de l'API
3. Ajouter un toast d'erreur en cas d'échec

## Impact

- Aujourd'hui : révocation accidentelle possible
- Après : confirmation avant révocation
