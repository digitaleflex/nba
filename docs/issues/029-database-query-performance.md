# 029 — Performance requêtes DB et index

## Priorité
P1 — performance prod

## Problème
Les performances réelles dépendront fortement des index Postgres, des `select`, de la pagination et des requêtes admin/dashboard.

## Impact
- Dashboards lents quand le volume augmente.
- Charge DB excessive.
- Latence API instable.

## Critères d'acceptation
- Identifier les requêtes fréquentes avec `where`/`orderBy`.
- Vérifier/ajouter les index Prisma nécessaires.
- Vérifier que les listes critiques sont paginées.
- Éviter les `include` trop larges.

## Statut
À faire.
