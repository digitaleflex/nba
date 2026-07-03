# 031 — Configuration Neon pour la prod

## Priorité
P0 — fiabilité DB prod

## Problème
La base de données de production est hébergée sur Neon. La stack Docker ne doit donc pas lancer Postgres localement et l'application doit être configurée pour une base externe avec SSL.

## Impact
- Mauvaise URL Neon = migrations/runtime cassés.
- URL pooled utilisée pour les migrations = risque d'échec selon la configuration.
- Trop de connexions Prisma = saturation des limites Neon.

## Critères d'acceptation
- `compose.yml` ne contient plus de service `db`.
- `DATABASE_URL` est obligatoire et vient de Neon.
- L'URL inclut SSL (`sslmode=require`) si requis par Neon.
- Décider entre :
  - URL directe unique pour prod simple avec migrations au startup,
  - ou URL pooled runtime + URL directe séparée pour migrations.
- Définir une limite de connexions adaptée au plan Neon.
- Tester `pnpm prisma migrate deploy` contre Neon avant démarrage prod.

## Recommandation court terme
Utiliser l'URL directe Neon dans `DATABASE_URL` tant que les migrations sont lancées au démarrage du conteneur.

## Recommandation phase suivante
Séparer :

- `DATABASE_URL` : URL pooled Neon pour le runtime applicatif.
- `DIRECT_DATABASE_URL` : URL directe Neon pour migrations/jobs admin.

Puis sortir `prisma migrate deploy` du startup applicatif vers une étape de déploiement dédiée.

## Statut
En cours.
