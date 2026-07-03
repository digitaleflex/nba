# Issue #018 — Code dupliqué : steps vs pages standalone

**Sévérité:** Medium
**Fichiers:**
- `step-kyc.tsx` (~400 lignes) vs `kyc/page.tsx` (269 lignes)
- `step-broker.tsx` (~117 lignes) vs `broker/page.tsx` (116 lignes)
**Catégorie:** Maintenance

## Problème

Les composants de step d'onboarding sont quasi-identiques aux pages standalone. La logique IndexedDB, DocumentPreview, guidelines qualité, et soumission sont dupliquées.

## Solution

Extraire les composants partagés :
```tsx
// components/kyc-shared.tsx
export function KycForm({ mode }: { mode: 'onboarding' | 'standalone' }) { ... }

// components/broker-shared.tsx
export function BrokerForm({ mode }: { mode: 'onboarding' | 'standalone' }) { ... }
```

## Impact

- Aujourd'hui : maintenance difficile, risque de divergence
- Après : code unique, maintenance simplifiée
