# Issue #011 — XSS potentiel via markdown preview

**Sévérité:** Critical (Sécurité)
**Fichier:** `src/app/(admin)/admin/components/signal-editor.tsx:368`
**Catégorie:** Sécurité

## Problème

```tsx
dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content.trim() || "...") }}
```

Si `parseSimpleMarkdown` ne sanitise pas la sortie, c'est un vecteur de XSS stocké. Un utilisateur pourrait écrire `<script>` dans le contenu du signal.

## Solution

Sanitiser avec DOMPurify :
```tsx
import DOMPurify from 'dompurify'

dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parseSimpleMarkdown(content.trim() || "...")) }}
```

## Impact

- Aujourd'hui : potentiel de XSS stocké
- Après : sortie HTML sanitisée

---

## ✅ Résolu

`parseSimpleMarkdown()` dans `src/lib/utils.ts` escape déjà les entités HTML (`&`, `<`, `>`, `"`, `'`) avant d'appliquer les transformations markdown. Le vecteur XSS est déjà mitigé.

```tsx
let html = text
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;")
```

Aucune action requise.
