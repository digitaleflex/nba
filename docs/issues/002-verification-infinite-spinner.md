# Issue #002 — Spinner infini quand le fetch échoue

**Sévérité:** Critical
**Fichier:** `src/app/(dashboard)/dashboard/verification/page.tsx:34`
**Catégorie:** Error Handling

## Problème

Le bloc `catch` ne définit pas de variable `error`. Quand le fetch échoue, `state` reste `null` et la condition `if (loading || !state)` affiche le spinner **pour toujours**.

```tsx
catch {
  setLoading(false)
  // manque : setError("Erreur de chargement")
}
```

## Solution

Ajouter un état `error` avec bouton "Réessayer" :
```tsx
const [error, setError] = useState<string | null>(null)

catch (err) {
  setLoading(false)
  setError("Erreur de chargement")
}

// Dans le render :
if (error) return <ErrorCard message={error} onRetry={fetchState} />
```

## Impact

- Aujourd'hui : utilisateur bloqué éternellement
- Après : message d'erreur + bouton réessayer
