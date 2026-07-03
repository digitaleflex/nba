# 030 — Restaurer Redis + worker en phase 2

## Priorité
P2 — scalabilité

## Problème
La prod minimale désactive les traitements asynchrones. C'est acceptable temporairement, mais insuffisant pour une prod performante à volume réel.

## Impact
Fonctionnalités dégradées tant que le worker reste désactivé :

- distribution asynchrone des signaux,
- signaux programmés,
- emails via queue,
- nettoyage différé fichiers KYC/Broker.

## Critères d'acceptation
- Redis revient comme service explicite ou service managé.
- Worker validé indépendamment de l'app.
- Jobs critiques rejouables/idempotents.
- Monitoring worker + métriques queue.

## Statut
À faire après stabilisation app + db.
