# Issue #019 — Sélecteurs natifs au lieu du design system

**Sévérité:** Medium
**Fichiers:** `admin/page.tsx:1643`, `onboarding/profile/page.tsx:70-97`
**Catégorie:** Consistency

## Problème

Les champs `<select>` utilisent des éléments HTML natifs avec des classes Tailwind inline au lieu du composant `Select` du design system. Cela casse la cohérence visuelle et les améliorations d'accessibilité partagées.

## Solution

Utiliser le composant `Select` du design system :
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nba/design-system"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionnez" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="tls">TLS</SelectItem>
  </SelectContent>
</Select>
```

## Impact

- Aujourd'hui : UI incohérent
- Après : design system uniforme
