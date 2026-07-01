# Issue #006 — Boutons icônes admin trop petits (28px)

**Sévérité:** High
**Fichier:** `src/app/(admin)/admin/page.tsx:1076-1115`
**Catégorie:** Mobile / Accessibility

## Problème

Les boutons d'action du signal (Play, Copy, Eye, Trash2) font `size-7` (28px). C'est en dessous du minimum WCAG 2.5.8 de 24x24px et bien en dessous des 44x44px recommandés.

## Solution

Augmenter à `size-9` (36px) minimum et ajouter de l'espacement entre les cibles :
```tsx
<Button variant="ghost" size="icon" className="size-9">
```

## Impact

- Aujourd'hui : impossible de taper correctement sur mobile
- Après : touch targets conformes WCAG
