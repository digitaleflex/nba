# Issue #004 — Labels cassés dans le formulaire profil

**Sévérité:** Critical
**Fichier:** `src/app/(dashboard)/dashboard/profile/page.tsx`
**Catégorie:** Accessibility / Forms

## Problème

Tous les `<label>` n'ont pas de `htmlFor` et tous les `<Input>` n'ont pas de `id`. Cliquez sur un label ne focus pas le champ. Les lecteurs d'écran ne peuvent pas associer labels aux champs.

Champs affectés (12+) : name, email, password actuel, nouveau mot de passe, confirmation, téléphone, etc.

## Solution

Pour chaque champ, ajouter `htmlFor` et `id` :
```tsx
<label htmlFor="name">Nom</label>
<Input id="name" ... />
```

## Impact

- Aujourd'hui : formulaires inutilisables pour les lecteurs d'écran
- Après : accessibilité conforme WCAG
