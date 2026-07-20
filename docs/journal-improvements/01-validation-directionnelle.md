# 01 — Validation Directionnelle

## Objectif
Empêcher les trades invalides d'être soumis. Le système doit bloquer et expliquer clairement ce qui ne va pas.

## Checklist

### Dans `trade-form.tsx` (client-side)
- [ ] Valider que SL est **en dessous** de l'entrée pour BUY
- [ ] Valider que SL est **au-dessus** de l'entrée pour SELL
- [ ] Valider que TP est **au-dessus** de l'entrée pour BUY
- [ ] Valider que TP est **en dessous** de l'entrée pour SELL
- [ ] Valider que lotSize > 0 (pas de champ vide → 0)
- [ ] Valider que entryPrice > 0 quand résultat ≠ BREAKEVEN
- [ ] Valider que exitPrice > 0 quand résultat ≠ BREAKEVEN
- [ ] Afficher un warning si résultat = WIN mais PnL < 0
- [ ] Afficher un warning si résultat = LOSS mais PnL > 0
- [ ] Valider spread >= 0

### Dans `api/dashboard/journal/trades/route.ts` (server-side)
- [ ] Valider SL/TP directionnellement (BUY: SL < entry < TP, SELL: TP < entry < SL)
- [ ] Valider lotSize > 0
- [ ] Ajouter rate limit sur PUT (même que POST : 30/60s)

### Messages d'erreur clairs
- [ ] "Le Stop Loss doit être inférieur au prix d'entrée en position ACHETER"
- [ ] "Le Stop Loss doit être supérieur au prix d'entrée en position VENDRE"
- [ ] "Le Take Profit doit être supérieur au prix d'entrée en position ACHETER"
- [ ] "Le Take Profit doit être inférieur au prix d'entrée en position VENDRE"
- [ ] "Le lot minimum est 0.01"
- [ ] "Le spread ne peut pas être négatif"

## Fichiers modifiés
- `src/app/(dashboard)/dashboard/journal/components/trade-form.tsx`
- `src/app/api/dashboard/journal/trades/route.ts`

## Validation
- [ ] soumettre BUY avec SL au-dessus de l'entrée → erreur
- [ ] soumettre SELL avec TP au-dessus de l'entrée → erreur
- [ ] soumettre avec lot vide → erreur
- [ ] soumettre WIN avec PnL négatif → warning
- [ ] soumettre trade valide → succès
