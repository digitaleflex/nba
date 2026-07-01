# Issue #010 — Actions destructrices sans confirmation

**Sévérité:** High
**Fichier:** `src/app/(admin)/admin/components/admin-context-panel.tsx:156`, `src/app/(admin)/admin/page.tsx:544`
**Catégorie:** UX / Safety

## Problème

Plusieurs actions critiques se déclenchent immédiatement au clic sans aucune confirmation :
- Changement de rôle utilisateur
- Approbation/Rejet KYC
- Approbation/Rejet Broker
- Approbation/Rejet demandes d'accès
- Suppression de signal

## Solution

Ajouter un composant de confirmation stylé (pas `confirm()` natif) :
```tsx
<ConfirmDialog
  title="Changer le rôle"
  description="Êtes-vous sûr de vouloir attribuer le rôle {role} à {user.name} ?"
  onConfirm={handleRoleChange}
/>
```

## Impact

- Aujourd'hui : risque d'actions accidentelles irréversibles
- Après : safeguard avant chaque action critique
