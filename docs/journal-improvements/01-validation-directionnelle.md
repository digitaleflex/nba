# 01 — Validation Directionnelle ✅ COMPLÉTÉ

## Fichiers modifiés
- `src/app/(dashboard)/dashboard/journal/components/trade-form.tsx`
- `src/app/api/dashboard/journal/trades/route.ts`

## Ce qui a été implémenté

### Client-side (trade-form.tsx)
- [x] Valider SL/TP directionnellement (BUY: SL < entry, TP > entry)
- [x] Valider lotSize > 0 et <= 100
- [x] Valider entryPrice > 0 quand résultat ≠ BREAKEVEN
- [x] Valider exitPrice > 0 quand résultat ≠ BREAKEVEN
- [x] Valider spread >= 0
- [x] Warning si résultat = WIN mais PnL < 0
- [x] Warning si résultat = LOSS mais PnL > 0
- [x] Erreurs inline sous chaque champ (composant FieldError)

### Server-side (route.ts)
- [x] Valider SL/TP directionnellement
- [x] Valider lotSize > 0
- [x] Messages d'erreur clairs en français
