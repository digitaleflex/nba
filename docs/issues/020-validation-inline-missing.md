# Issue #020 — Validation uniquement à la soumission

**Sévérité:** Medium
**Fichiers:** Tous les formulaires (login, register, forgot-password, reset-password, profile, onboarding)
**Catégorie:** UX / Forms

## Problème

La validation ne se fait qu'au clic sur "Soumettre". Pas de feedback inline quand l'utilisateur quitte un champ (`onBlur`) ou tape en temps réel. L'utilisateur remplit tout le formulaire, clique, et découvre les erreurs.

## Solution

Ajouter la validation `onBlur` :
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

function validateField(name: string, value: string) {
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setErrors(prev => ({ ...prev, email: "Email invalide" }))
  }
}

<Input onBlur={(e) => validateField(e.target.name, e.target.value)} />
{errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
```

## Impact

- Aujourd'hui : erreurs découvertes tardivement
- après : feedback immédiat à la saisie
