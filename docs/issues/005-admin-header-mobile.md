# Issue #005 — Header admin non fonctionnel sur mobile

**Sévérité:** Critical
**Fichier:** `src/app/(admin)/admin/page.tsx:89`, `src/app/(admin)/admin/components/admin-header.tsx:89`
**Catégorie:** Mobile / Responsive

## Problème

Le header entier est wrappé dans `hidden md:flex`. Sur mobile (<768px) :
- Pas de navigation
- Pas de recherche
- Pas de profil utilisateur
- Pas de switch d'onglets

L'admin est **totalement inutilisable sur mobile**.

## Solution

Créer un header mobile avec hamburger menu ou bottom tab bar spécifique à l'admin, similaire au dashboard utilisateur.

## Impact

- Aujourd'hui : admin inaccessible sur mobile
- Après : navigation complète sur tous les appareils
