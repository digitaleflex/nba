# Issue #013 — Upload fichier non clavier

**Sévérité:** High
**Fichier:** `src/app/(dashboard)/dashboard/verification/page.tsx`, `src/app/(onboarding)/onboarding/broker/page.tsx:88`, `src/app/(onboarding)/onboarding/kyc/page.tsx:169`
**Catégorie:** Accessibility

## Problème

Les zones de drop utilisent `<label>` wrappant un `<input type="file" hidden>`. L'input hidden n'est pas dans le tab order. Impossible de déclencher l'upload au clavier.

## Solution

Ajouter `tabIndex={0}` et un handler clavier :
```tsx
<label
  tabIndex={0}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
>
```

## Impact

- Aujourd'hui : upload impossible au clavier
- Après : upload complet au clavier
