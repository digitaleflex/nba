# Issue #017 — Contenu non centré sur grands écrans

**Sévérité:** Medium
**Fichiers:** `subscription/page.tsx:74`, `notifications/page.tsx:94`, `profile/page.tsx:234`
**Catégorie:** Layout

## Problème

Plusieurs pages ont `max-w-3xl` ou `max-w-2xl` sans `mx-auto`. Sur les écrans larges, le contenu reste aligné à gauche au lieu d'être centré.

## Solution

Ajouter `mx-auto` :
```tsx
<div className="space-y-6 max-w-3xl mx-auto">
```

## Impact

- Aujourd'hui : layout décalé sur desktop
- Après : centré cohérent sur toutes les pages
