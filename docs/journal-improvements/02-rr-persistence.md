# 02 — R:R (calcul à la lecture, PAS de migration)

## Objectif
Le champ `rrRatio` n'existe pas dans le schéma Trade et on ne peut PAS ajouter de champ (pas de migration destructive). On calcule le R:R à la lecture dans les API routes.

## Contrainte
- AUCUNE modification de `prisma/schema.prisma`
- AUCUNE migration
- Calcul on-the-fly dans les services/routes

## Checklist

### `src/lib/services/pnl.ts`
- [ ] Vérifier que `calculateRR(entry, sl, tp)` existe et fonctionne
- [ ] Exporter la fonction si ce n'est pas déjà fait

### `src/app/api/dashboard/journal/trades/route.ts` (GET)
- [ ] Après récupération des trades, calculer `rrRatio` pour chaque trade
- [ ] Utiliser `calculateRR(trade.entryPrice, trade.stopLoss, trade.takeProfit)`
- [ ] Ajouter le champ `rrRatio` dans la réponse JSON

### `src/app/(dashboard)/dashboard/journal/components/trade-card.tsx`
- [ ] Le type Trade local doit inclure `rrRatio: number | null`
- [ ] Afficher R:R s'il est disponible, "—" sinon

### `src/app/(dashboard)/dashboard/journal/components/stats-dashboard.tsx`
- [ ] Calculer R:R moyen à partir des trades (pas depuis la BDD)
- [ ] Utiliser la moyenne des R:R calculés pour chaque trade ayant SL et TP

## Fichiers modifiés
- `src/lib/services/pnl.ts` (vérification export)
- `src/app/api/dashboard/journal/trades/route.ts`
- `src/app/(dashboard)/dashboard/journal/components/trade-card.tsx`
- `src/app/(dashboard)/dashboard/journal/components/stats-dashboard.tsx`

## Validation
- [ ] Trade avec SL=1.08000, TP=1.09000, Entry=1.08500 → R:R = 1.0
- [ ] Trade sans SL/TP → R:R = null, affiche "—"
- [ ] Trade card affiche le R:R correctement
