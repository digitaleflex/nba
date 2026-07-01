# Issue #021 — Onboarding blank page si fetch échoue

**Sévérité:** Critical
**Fichier:** `src/app/(onboarding)/onboarding/page.tsx:46`
**Catégorie:** Error Handling

## Problème

Le `catch` dans `fetchState` ne définit pas de variable `error`. Le spinner disparaît et l'utilisateur voit une page totalement vide sans message ni bouton réessayer.

## Solution

```tsx
const [error, setError] = useState<string | null>(null)

catch (err) {
  setLoading(false)
  setError("Erreur de chargement de votre progression")
}

// Render :
if (error) return (
  <Card>
    <CardContent className="flex flex-col items-center gap-3 py-16">
      <AlertCircle className="size-10 text-destructive" />
      <p>{error}</p>
      <Button onClick={fetchState}>Réessayer</Button>
    </CardContent>
  </Card>
)
```

## Impact

- Aujourd'hui : page blanche sans récupération
- Après : erreur explicite avec réessayer
