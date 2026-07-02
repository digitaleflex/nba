# Revue de Code - SignalsView Component

**Date:** 2026-07-02  
**Fichier:** `src/app/(dashboard)/signals/components/signals-view.tsx`  
**Revieweur:** Agent AI  
**Statut:** ✅ Bon avec recommandations

---

## 🎯 Vue d'ensemble

Composant React client-side pour l'affichage et la gestion des signaux de trading. Le code est bien structuré, mais présente quelques opportunités d'amélioration.

---

## ✅ Points Positifs

### Architecture
- ✅ Séparation claire des responsabilités (SignalCard, SignalsView)
- ✅ Utilisation appropriée de TypeScript avec interfaces bien définies
- ✅ Hooks React utilisés correctement (useState, useEffect, useCallback, useMemo)
- ✅ Custom hook `useDebounce` pour la recherche optimisée

### Performance
- ✅ Mémoïsation avec `useMemo` pour les calculs coûteux (filteredSignals, groupedFiltered)
- ✅ `useCallback` pour éviter les re-rendus inutiles de fetchSignals
- ✅ Pagination avec chargement progressif ("Load More")
- ✅ Debounce sur la recherche (300ms)

### UX/UI
- ✅ États de chargement bien gérés (loading, loadingMore, error)
- ✅ Feedback visuel approprié (spinners, messages d'erreur)
- ✅ Responsive design avec classes Tailwind adaptatives
- ✅ Rafraîchissement automatique quand l'onglet redevient visible

### Internationalisation
- ✅ Textes en français cohérents
- ✅ Formatage de dates localisé (fr-FR)

---

## ⚠️ Problèmes Identifiés

### 1. 🔴 CRITIQUE - Redirection Hard-Coded
**Ligne 198:**
```typescript
if (res.status === 401) {
  window.location.href = "/login"
  return
}
```

**Problème:**  
Utilisation de `window.location.href` au lieu du routeur Next.js. Cela provoque un rechargement complet de la page et perd l'état de l'application.

**Solution recommandée:**
```typescript
import { useRouter } from 'next/navigation'

// Dans le composant
const router = useRouter()

// Dans fetchSignals
if (res.status === 401) {
  router.push("/login")
  return
}
```

---

### 2. 🟡 MOYEN - Duplication de Logique de Date

**Lignes 63-94:**  
Les fonctions `formatRelativeDate` et `getDateGroup` contiennent une logique de calcul de dates très similaire.

**Problème:**  
- Code dupliqué (calcul de `today`, `yesterday`, `diffDays`)
- Difficile à maintenir
- Risque d'incohérence

**Solution recommandée:**
```typescript
// Créer une fonction utilitaire partagée
function getDateDiff(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  
  return { date, diffDays, today, target }
}

function formatRelativeDate(dateStr: string): string {
  const { date, diffDays } = getDateDiff(dateStr)
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays <= 7) return "Cette semaine"
  return date.toLocaleDateString("fr-FR", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  })
}

function getDateGroup(dateStr: string): string {
  const { target, diffDays } = getDateDiff(dateStr)
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  return target.toLocaleDateString("fr-FR", { 
    day: "numeric", 
    month: "long" 
  })
}
```

---

### 3. 🟡 MOYEN - Gestion d'Erreur Simpliste

**Ligne 213:**
```typescript
setError(err instanceof Error ? err.message : "Erreur inconnue")
```

**Problème:**  
Les messages d'erreur ne sont pas assez descriptifs pour le débogage.

**Solution recommandée:**
```typescript
catch (err) {
  const errorMessage = err instanceof Error 
    ? err.message 
    : "Erreur inconnue lors du chargement des signaux"
  
  console.error('[SignalsView] Fetch error:', err)
  setError(errorMessage)
}
```

---

### 4. 🟢 MINEUR - Magie Number

**Ligne 186:**
```typescript
params.set("limit", "20")
```

**Problème:**  
Valeur hard-codée sans constante nommée.

**Solution recommandée:**
```typescript
const SIGNALS_PER_PAGE = 20

// Plus tard
params.set("limit", String(SIGNALS_PER_PAGE))
```

---

### 5. 🟢 MINEUR - Style Inline

**Ligne 329:**
```typescript
style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
```

**Problème:**  
Styles inline alors que Tailwind est utilisé partout ailleurs.

**Solution recommandée:**
Créer une classe CSS globale ou utiliser une classe Tailwind personnalisée:

```css
/* globals.css */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

```typescript
<div className="flex gap-2 overflow-x-auto no-scrollbar ...">
```

---

### 6. 🟢 MINEUR - Type Implicite Any

**Ligne 206, 246:**
```typescript
setSignals((prev) => [...prev, ...data.signals])
return signals.filter((s) => !s.read)
```

**Problème:**  
TypeScript peut inférer les types, mais pour la clarté, les paramètres pourraient être typés explicitement.

**Solution recommandée:**
```typescript
setSignals((prev: SignalData[]) => [...prev, ...data.signals])
return signals.filter((s: SignalData) => !s.read)
```

---

## 📝 Recommandations Supplémentaires

### 1. Extraction de Constantes
Extraire les URLs de l'API dans un fichier de configuration:

```typescript
// config/api.ts
export const API_ENDPOINTS = {
  SIGNALS: '/api/dashboard/signals',
} as const
```

### 2. Tests
Ajouter des tests unitaires pour:
- Les fonctions utilitaires de date (`formatRelativeDate`, `getDateGroup`, `formatTime`)
- Le hook `useDebounce`
- Le hook `useCallback` de `fetchSignals`

### 3. Accessibilité
- Ajouter des labels ARIA sur les boutons de filtre
- Ajouter un `role="status"` sur les messages de chargement
- Gérer le focus clavier sur la liste de signaux

### 4. Refactoring Potentiel
Considérer l'extraction de la logique de fetch dans un custom hook:

```typescript
// hooks/useSignals.ts
export function useSignals() {
  // Toute la logique de state et fetch
  return {
    signals,
    loading,
    error,
    pagination,
    handleLoadMore,
    handleRefresh,
    // ...
  }
}
```

---

## 📊 Métriques de Qualité

| Critère | Note | Commentaire |
|---------|------|-------------|
| Lisibilité | 8/10 | Code bien structuré et commenté implicitement |
| Maintenabilité | 7/10 | Quelques duplications à refactoriser |
| Performance | 9/10 | Excellente optimisation avec mémoïsation |
| Sécurité | 8/10 | Bonne gestion des erreurs, amélioration possible |
| Tests | 3/10 | Aucun test visible |
| Accessibilité | 6/10 | Basique, peut être améliorée |

**Note Globale: 7.5/10** ⭐⭐⭐⭐

---

## 🎯 Plan d'Action Prioritaire

1. **Immédiat** (Cette semaine)
   - [ ] Corriger la redirection avec useRouter (Ligne 198)
   - [ ] Extraire les constantes (SIGNALS_PER_PAGE, API endpoints)

2. **Court terme** (Ce mois)
   - [ ] Refactoriser la duplication de logique de dates
   - [ ] Améliorer la gestion d'erreurs avec logs
   - [ ] Remplacer le style inline par des classes CSS

3. **Long terme** (Prochain sprint)
   - [ ] Ajouter des tests unitaires
   - [ ] Améliorer l'accessibilité
   - [ ] Considérer l'extraction dans un custom hook

---

## 📄 Conclusion

Le composant `SignalsView` est **bien conçu et fonctionnel**. Les problèmes identifiés sont principalement des optimisations et des améliorations de maintenabilité plutôt que des bugs critiques.

**Recommandation:** ✅ Approuvé pour production avec corrections mineures suggérées.

---

**Révisé par:** Agent AI  
**Prochaine revue:** Après implémentation des corrections prioritaires
