# Issue #012 — Toggle mot de passe inaccessible au clavier

**Sévérité:** High
**Fichier:** `src/app/(auth)/login/page.tsx:90`, `src/app/(auth)/reset-password/page.tsx:133`, `src/app/(onboarding)/onboarding/components/step-security.tsx:46`
**Catégorie:** Accessibility

## Problème

Les boutons show/hide password ont `tabIndex={-1}` (retirés du tab order) et 2/3 n'ont pas de `aria-label`.

## Solution

```tsx
// Supprimer tabIndex={-1}
// Ajouter aria-label
<button
  type="button"
  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
>
```

## Impact

- Aujourd'hui : impossible de toggle le mot de passe au clavier
- Après : accessible au clavier avec label
