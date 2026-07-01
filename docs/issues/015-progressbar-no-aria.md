# Issue #015 — Barres de progression sans ARIA

**Sévérité:** High
**Fichier:** `src/app/(dashboard)/dashboard/verification/page.tsx:99`, `src/app/(admin)/admin/page.tsx:989`
**Catégorie:** Accessibility

## Problème

Les barres de progression sont de simples `<div>` avec un style `width`. Pas de `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Les lecteurs d'écran ne peuvent pas interpréter ces indicateurs visuels.

## Solution

```tsx
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Progression : ${progress}%`}
  className="..."
>
```

## Impact

- Aujourd'hui : progression invisible pour les lecteurs d'écran
- Après : progression accessible
