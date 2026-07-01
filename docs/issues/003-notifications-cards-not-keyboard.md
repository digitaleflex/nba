# Issue #003 — Cartes notifications inaccessibles au clavier

**Sévérité:** Critical
**Fichier:** `src/app/(dashboard)/dashboard/notifications/page.tsx:129`
**Catégorie:** Accessibility

## Problème

Les cartes de notifications ont `onClick` mais pas de `role="button"`, `tabIndex`, ni `onKeyDown`. Impossible d'activer avec le clavier.

```tsx
<div onClick={() => markAsRead(n.id)} className="cursor-pointer ...">
```

## Solution

Option A — Utiliser un `<button>` :
```tsx
<button onClick={() => markAsRead(n.id)} className="text-left w-full ...">
```

Option B — Ajouter les attributs :
```tsx
<div
  role="button"
  tabIndex={0}
  onClick={() => markAsRead(n.id)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') markAsRead(n.id) }}
>
```

## Impact

- Aujourd'hui : les utilisateurs clavier ne peuvent pas interagir
- Après : navigation complète au clavier
