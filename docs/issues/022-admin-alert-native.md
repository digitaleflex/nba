# Issue #022 — alert() et confirm() natifs dans l'admin

**Sévérité:** Medium
**Fichiers:** `src/app/(admin)/admin/page.tsx:453-477`, `src/app/(admin)/admin/components/signal-editor.tsx:67-88`
**Catégorie:** UX

## Problème

Les actions destructrices utilisent `alert()` et `confirm()` natifs du navigateur. Ils sont incohérents avec le design system, non stylés, et bloquent l'exécution.

## Solution

Remplacer par des toasts (sonner/react-hot-toast) et des Dialogs stylisés du design system.

## Impact

- Aujourd'hui : expérience non professionnelle
- Après : feedback intégré au design
