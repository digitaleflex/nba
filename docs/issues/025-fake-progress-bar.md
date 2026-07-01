# Issue #025 — Barre de progression fausse (KYC)

**Sévérité:** Medium
**Fichier:** `src/app/(onboarding)/onboarding/kyc/page.tsx:72-79`
**Catégorie:** UX

## Problème

La barre de progression est simulée : `setUploadProgress(25)` → `setUploadProgress(60)` → `setUploadProgress(80)` → `setUploadProgress(100)` sont appelés synchroneusement. La barre saute de 25% à 60% d'un coup, ce qui est trompeur.

## Solution

Option 1 — Utiliser XMLHttpRequest avec `onprogress` pour un vrai suivi
Option 2 — Remplacer par un spinner simple "Envoi en cours..."

## Impact

- Aujourd'hui : progression mensongère
- Après : feedback réel ou spinner honnête
