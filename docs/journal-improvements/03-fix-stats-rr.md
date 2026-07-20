# 03 — Fix Stats R:R Inversé

## Objectif
Dans `stats/route.ts`, `riskRewardRatio` calcule `avgLoser / avgWinner` au lieu de `avgWinner / avgLoser`. C'est l'inverse de la convention trading.

## Checklist

### `src/app/api/dashboard/journal/stats/route.ts`
- [ ] Trouver la ligne `riskRewardRatio = ...`
- [ ] Inverser le calcul : `avgWinner / avgLoser` (ou `0` si `avgLoser === 0`)
- [ ] Renommer la variable si nécessaire pour la clarté

### `src/app/(dashboard)/dashboard/journal/components/stats-dashboard.tsx`
- [ ] Vérifier l'affichage du R:R moyen
- [ ] Adapter le format d'affichage si le calcul a changé

## Fichiers modifiés
- `src/app/api/dashboard/journal/stats/route.ts`
- `src/app/(dashboard)/dashboard/journal/components/stats-dashboard.tsx`

## Validation
- [ ] Vérifier que le R:R moyen affiché est cohérent (ex: avgWinner=100, avgLoser=50 → R:R=2.0)
- [ ] Cas edge: aucun loss → afficher "∞" ou "—"
- [ ] Cas edge: aucun win → afficher "0"
