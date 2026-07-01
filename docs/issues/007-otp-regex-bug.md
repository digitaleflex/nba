# Issue #007 — Regex OTP cassée

**Sévérité:** Critical
**Fichier:** `src/app/(onboarding)/onboarding/components/step-email.tsx:120`
**Catégorie:** Bug

## Problème

```tsx
e.target.value.replace(/\\D/g, '')
```

Dans JSX, `\\D` devient le texte littéral `\D`, pas la regex `\D`. L'utilisateur peut taper des lettres dans le champ OTP.

## Solution

```tsx
e.target.value.replace(/\D/g, '')
```

## Impact

- Aujourd'hui : le champ OTP accepte les lettres
- Après : seul les chiffres sont acceptés
