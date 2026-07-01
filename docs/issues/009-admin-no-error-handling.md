# Issue #009 — Aucune gestion d'erreur dans l'admin

**Sévérité:** High
**Fichier:** `src/app/(admin)/admin/page.tsx:212-354`
**Catégorie:** Error Handling

## Problème

Toutes les fonctions `fetch*` (10+) swallow silencieusement les erreurs. Pas de variables `errorOps`, `errorMembers`, etc. Quand un fetch échoue, le spinner disparaît et l'utilisateur voit une page vide sans explication.

## Solution

Ajouter des états d'erreur pour chaque module et un composant d'erreur avec bouton réessayer :
```tsx
const [errorOps, setErrorOps] = useState<string | null>(null)

// Dans le render :
if (errorOps) return <ErrorCard message={errorOps} onRetry={fetchOps} />
```

## Impact

- Aujourd'hui : écrans blancs silencieux
- Après : messages d'erreur explicites avec réessayer
