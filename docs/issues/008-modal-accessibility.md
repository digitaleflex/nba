# Issue #008 — Modales sans focus trap ni Escape

**Sévérité:** High
**Fichier:** `src/app/(admin)/admin/components/admin-context-panel.tsx:48`, `src/app/(admin)/admin/components/signal-editor.tsx:455`
**Catégorie:** Accessibility

## Problème

Les modales/panneaux n'ont pas :
- `role="dialog"`
- `aria-modal="true"`
- Focus trap (le clavier sort de la modale)
- Gestion de la touche Escape pour fermer

## Solution

Utiliser un composant Dialog du design system ou ajouter manuellement :
```tsx
<div role="dialog" aria-modal="true" aria-label={title}>
  {/* Focus trap */}
  {/* Escape handler */}
</div>
```

## Impact

- Aujourd'hui : le clavier sort de la modale, inaccessible
- Après : navigation correcte dans les modales
