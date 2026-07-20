# 04 — Autocomplete Tags et Paires

## Objectif
Faciliter la saisie en proposant les tags et paires déjà utilisés par le trader.

## Checklist

### API Route — Tags disponibles
- [ ] Créer `GET /api/dashboard/journal/tags` qui retourne les tags uniques de l'utilisateur
- [ ] Limiter à 50 tags les plus fréquents
- [ ] Rate limiter

### API Route — Paires disponibles
- [ ] Créer `GET /api/dashboard/journal/pairs` qui retourne les paires uniques de l'utilisateur
- [ ] Inclure le nombre de trades par paire
- [ ] Trier par fréquence décroissante

### Trade Form (`trade-form.tsx`)
- [ ] Charger les tags disponibles au mount
- [ ] Afficher une dropdown avec les tags suggérés quand l'utilisateur tape
- [ ] Cliquer sur un tag suggéré l'ajoute
- [ ] Charger les paires disponibles au mount
- [ ] Afficher une dropdown avec les paires suggérées quand l'utilisateur tape
- [ ] Cliquer sur une paire suggérée la remplit

### Trade List (`trade-list.tsx`)
- [ ] Utiliser les paires de l'API `/journal/pairs` pour le filtre (au lieu de celle existante)

## Fichiers modifiés
- `src/app/api/dashboard/journal/tags/route.ts` (nouveau)
- `src/app/api/dashboard/journal/pairs/route.ts` (nouveau)
- `src/app/(dashboard)/dashboard/journal/components/trade-form.tsx`
- `src/app/(dashboard)/dashboard/journal/components/trade-list.tsx`

## Validation
- [ ] Taper "EU" → affiche EURUSD, EURGBP, etc.
- [ ] Ajouter un tag existant → pas de doublon
- [ ] Les tags s'affichent dans l'ordre de fréquence
- [ ] La liste des paires dans le filtre est à jour
