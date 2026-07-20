# 06 — Erreurs Inline ✅ COMPLÉTÉ

## Fichiers modifiés
- `src/app/(dashboard)/dashboard/journal/components/trade-form.tsx`

## Ce qui a été implémenté
- [x] Composant `FieldError` avec icône AlertTriangle
- [x] État `errors` (FieldErrors) et `touched` (Record<string, boolean>)
- [x] Validation en temps réel via useEffect sur touched
- [x] Validation complète au submit (tous les champs marqués touched)
- [x] Bordure rose sur les champs en erreur (`border-rose-500/50`)
- [x] Messages d'erreur sous chaque champ concerné
- [x] Toast.error pour les erreurs générales (SL/TP incohérents)
- [x] Toast.error avec le message du serveur en cas d'erreur API
