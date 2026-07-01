# Issue #001 — Page vide si non connecté

**Sévérité:** Critical
**Fichier:** `src/app/(dashboard)/dashboard/page.tsx:9`
**Catégorie:** Auth / UX

## Problème

```tsx
if (!session) return null
```

Rend une page totalement vide sans redirect ni message. L'utilisateur voit un écran blanc avec aucun moyen de récupérer.

## Solution

Remplacer par :
```tsx
import { redirect } from "next/navigation"

if (!session) redirect("/login")
```

## Impact

- Aujourd'hui : écran blanc, utilisateur bloqué
- Après : redirection automatique vers login
