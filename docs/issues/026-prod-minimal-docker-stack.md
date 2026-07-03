# 026 — Stack Docker prod minimale

## Priorité
P0 — bloquant prod initiale

## Problème
La stack Docker contenait Redis, un worker et une base Postgres locale alors que l'objectif court terme est de démarrer une prod simple avec le minimum de services fiables. La base de données est hébergée sur Neon.

## Impact
- Déploiement plus complexe.
- Risque de panne Redis/worker bloquant l'app.
- Build/runtime plus long à valider.

## Critères d'acceptation
- `compose.yml` ne lance que `app`.
- Redis est désactivé explicitement.
- Le worker n'est pas requis pour démarrer l'app.
- Aucune base Postgres locale n'est lancée en prod.
- `DATABASE_URL` pointe vers Neon et est obligatoire.
- Les secrets critiques sont obligatoires.

## Statut
En cours — simplification Neon appliquée. Validation Docker finale en attente du daemon Docker.
