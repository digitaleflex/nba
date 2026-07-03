# 028 — Warnings Next.js de build prod

## Priorité
P1 — qualité prod

## Problème
Le build prod signale plusieurs warnings :

- convention `middleware` dépréciée au profit de `proxy`,
- `metadataBase` absent,
- warning NFT/Turbopack lié au tracing du stockage local.

## Impact
- Logs de build moins lisibles.
- Risque de changement cassant lors des prochaines versions Next.
- Potentiel tracing Docker inutilement large.

## Critères d'acceptation
- Migrer `src/middleware.ts` vers `src/proxy.ts` si compatible.
- Définir `metadataBase` depuis `NEXT_PUBLIC_APP_URL`.
- Documenter ou corriger le warning NFT restant.
- `QUEUE_ENABLED=false pnpm build` passe.

## Statut
Partiellement résolu localement.

Résolu :
- `metadataBase` défini depuis `NEXT_PUBLIC_APP_URL`.
- `src/middleware.ts` migré vers `src/proxy.ts`.
- Tests proxy mis à jour.
- Vitest n'inclut plus `.next/**`.

Reste :
- warning NFT/Turbopack lié au tracing du stockage local.
