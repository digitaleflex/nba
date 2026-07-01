# Issue #016 — Messages d'erreur sans role="alert"

**Sévérité:** Medium
**Fichiers:** Toutes les pages avec messages d'erreur
**Catégorie:** Accessibility

## Problème

Aucun message d'erreur dans l'application n'utilise `role="alert"` ou `aria-live="assertive"`. Les utilisateurs de lecteurs d'écran ne sont jamais notifiés quand une erreur apparaît.

## Fichiers affectés

- `login/page.tsx`
- `register/page.tsx`
- `forgot-password/page.tsx`
- `reset-password/page.tsx`
- `profile/page.tsx`
- `verification/page.tsx`
- `notifications/page.tsx`
- Tous les steps d'onboarding

## Solution

```tsx
<p role="alert" className="text-destructive">{errorMessage}</p>
```

## Impact

- Aujourd'hui : erreurs silencieuses pour les lecteurs d'écran
- Après : annonces automatiques des erreurs
