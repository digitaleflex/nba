# 027 — Mode sans Redis pour les queues

## Priorité
P0 — stabilité runtime

## Problème
Le code importait BullMQ/Redis dans des chemins API. Sans Redis disponible, la build ou le runtime pouvaient tenter une connexion à `REDIS_URL`.

## Impact
- Build Next bruyant ou fragile.
- Routes API sensibles à une dépendance désactivée.
- Impossible de simplifier la prod sans changer le code.

## Critères d'acceptation
- `QUEUE_ENABLED=false` désactive réellement Redis.
- Les jobs sont ignorés proprement sans exception.
- Les imports API ne dépendent plus directement de `workers/queue`.
- `pnpm typecheck` passe.
- `QUEUE_ENABLED=false pnpm build` passe.

## Statut
Résolu localement.
