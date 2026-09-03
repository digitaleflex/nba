# 💰 Modèle d'acte de cession de projet logiciel

> **Contrat de cession** du projet **NBA / SignauxX** — modèle à adapter selon la transaction réelle.

---

## ENTRE LES SOUSSIGNÉS

### Le Cédant (Vendeur)

```
Nom / Raison sociale : ___________________________________
Adresse : ___________________________________
SIRET / Registre : ___________________________________
Représenté par : ___________________________________
Ci-après dénommé « le Cédant »
```

### Le Cessionnaire (Acheteur)

```
Nom / Raison sociale : ___________________________________
Adresse : ___________________________________
SIRET / Registre : ___________________________________
Représenté par : ___________________________________
Ci-après dénommé « le Cessionnaire »
```

---

## PRÉAMBULE

Le Cédant est propriétaire exclusif du projet logiciel **NBA / SignauxX** comprenant :
- Code source complet (repository Git)
- Base de données et schémas Prisma
- Infrastructure et configuration (VPS, conteneurs, CI/CD)
- Identifiants d'accès aux services tiers
- Documentation technique et commerciale
- Marques, noms de domaine, identifiants en ligne
- Données utilisateurs en production

Le Cédant souhaite céder l'intégralité de ses droits sur le Projet au Cessionnaire, qui souhaite l'acquérir.

---

## ARTICLE 1 — OBJET

Le présent acte constate la **cession définitive et exclusive** par le Cédant au Cessionnaire de l'ensemble des droits de propriété intellectuelle et des actifs liés au Projet.

---

## ARTICLE 2 — PÉRIMÈTRE DE LA CESSION

### 2.1 — Éléments cédés (propriété intellectuelle)

Le Cédant cède au Cessionnaire :

| Élément | Description |
|---|---|
| **Code source** | Repository Git complet (`github.com/digitaleflex/nba` ou repo privé équivalent) |
| **Schémas Prisma** | Modèle de données + migrations |
| **Documentation** | Documentation technique et commerciale complète |
| **Marques** | « NBA », « SignauxX » et dérivés |
| **Noms de domaine** | signauxx.com et sous-domaines |
| **Identifiants** | VPS1, VPS2, GHCR, Sentry, B2, Resend, Neon, Tailscale |

### 2.2 — Éléments cédés (actifs techniques)

- 2 VPS en service (configurations et données)
- Base de données Neon (dump complet)
- Storage S3 + Backblaze B2 (fichiers KYC, signaux, attachments)
- Backups historiques (90 derniers jours)
- Images Docker publiées sur GHCR

### 2.3 — Éléments cédés (données)

- Données utilisateurs en production (81 utilisateurs)
- Audit logs (intégrité préservée)
- Backups B2

### 2.4 — Éléments NON cédés (réservés au Cédant)

- Comptes personnels du Cédant (email, GitHub)
- Matériel physique (postes de travail, téléphones)
- Comptes bancaires / Stripe / PayPal personnels
- Relations contractuelles personnelles (hébergeurs, freelances)

---

## ARTICLE 3 — PRIX ET MODALITÉS DE PAIEMENT

### 3.1 — Prix de cession

Le prix total de la cession est fixé à :

```
Montant : ___________________ EUROS (€)
        OU ___________________ FCFA
        OU ___________________ USD
```

Arrêté à la somme de (en toutes lettres) :

```
________________________________________________________________________
```

### 3.2 — Modalités de paiement

- **Acompte à la signature** : ____% soit ____€ — payable sous 7 jours
- **Solde à la livraison** : ____% soit ____€ — payable à la livraison complète
- **OU** : Paiement unique à la signature

### 3.3 — Modalités pratiques

- Virement bancaire IBAN : ___________________________________
- Ou paiement crypto (USDC, ETH) : wallet ____________________
- Ou séquestre Escrow.com / avocat : _________________________

---

## ARTICLE 4 — LIVRAISON

La livraison intervient dans les **30 jours** suivant la réception du paiement intégral.

### 4.1 — Éléments livrés

| Type | Format | Délai |
|---|---|---|
| Code source | Archive Git (tar.gz ou accès repo) | Jour 1 |
| Dump DB | SQL ou Prisma dump | Jour 1 |
| Identifiants | Coffre-fort numérique (1Password, Bitwarden) | Jour 1 |
| VPS | Transfert accès root + données | Jour 7 |
| Domaines | Transfert registrar | Jour 14 |
| Marques | Enregistrement INPI / OMPI | Jour 30 |

### 4.2 — Période de transition

- **30 jours post-livraison** : support inclus (questions, debugging, transition)
- Au-delà : facturation au tarif maintenance (cf. grille tarifaire)

---

## ARTICLE 5 — GARANTIES DU CÉDANT

Le Cédant garantit :

1. **Propriété exclusive** : être l'unique propriétaire du Projet cédé
2. **Absence de litige** : aucune contrefaçon, action en justice, réclamation
3. **Absence d'engagement tiers** : aucune licence octroyée à des tiers
4. **Conformité légale** : respect RGPD, droit d'auteur
6. **Absence de code sous licence copyleft forte** (GPL, AGPL) contaminant
7. **Code fonctionnel** : le code livré compile, les tests passent au moment de la livraison

### Limitation de garantie

Le Cédant ne garantit pas l'absence totale de bugs. La garantie est limitée au **bon fonctionnement au moment de la livraison**.

---

## ARTICLE 6 — OBLIGATIONS DU CESSIONNAIRE

Le Cessionnaire s'engage à :

1. **Payer le prix** selon les modalités convenues
2. **Respecter les licences tierces** des composants open source utilisés
3. **Maintenir les utilisateurs existants** (continuit de service)
5. **Informer les utilisateurs** du changement de propriétaire selon les CGU/CGV
6. **Reprendre les engagements contractuels** (Resend, Sentry, B2, Neon) ou les migrer
7. **Ne pas revendre** le Projet à un concurrent direct pendant 12 mois (optionnel)

---

## ARTICLE 7 — CONFIDENTIALITÉ

Les parties s'engagent à garder confidentiels :

- Les termes financiers du présent accord
- Toute information non publique du Projet
- Les données utilisateurs (sauf obligations légales)

Durée : 5 ans après signature.

---

## ARTICLE 8 — RESPONSABILITÉ

### 8.1 — Avant livraison

Le Cédant reste responsable du Projet jusqu'à la livraison complète.

### 8.2 — Après livraison

Le Cessionnaire assume l'entière responsabilité à compter de la livraison.

### 8.3 — Dommages-intérêts

En cas de violation du présent accord, la partie fautive versera des dommages-intérêts fixés à **____ €** forfaitaires ou au montant du préjudice direct subi.

---

## ARTICLE 9 — RÉSILIATION

En cas de non-paiement dans les 30 jours suivant l'échéance, le Cédant peut résilier le contrat de plein droit après mise en demeure restée infructueuse 15 jours.

Aucun remboursement n'est dû en cas de résiliation pour faute du Cessionnaire.

---

## ARTICLE 10 — LOI APPLICABLE ET JURIDICTION

Le présent contrat est régi par le **droit français** (ou droit béninois si applicable).

Tout litige sera soumis à la compétence exclusive du **Tribunal de _______**.

---

## ARTICLE 11 — DISPOSITIONS FINALES

1. **Modification** : Toute modification doit être écrite et signée
2. **Nullité partielle** : Si une clause est nulle, les autres restent valides
3. **Intégralité** : Cet accord remplace tout accord antérieur
4. **Cession** : Aucune des parties ne peut céder ses droits sans accord écrit

---

## SIGNATURES

| Le Cédant | Le Cessionnaire |
|---|---|
| Nom : | Nom : |
| Date : | Date : |
| Signature : | Signature : |
| | |

---

## 📋 CHECKLIST DE LIVRAISON (à cocher)

### Phase 1 — Pré-livraison (J-7)

- [ ] Dump base de données complet exporté et vérifié
- [ ] Archive Git du code source créée (avec dernier commit)
- [ ] Liste des credentials et accès préparée
- [ ] Documentation utilisateur à jour
- [ ] Tests passent en local

### Phase 2 — Livraison (J0)

- [ ] Code source transféré (repo Git ou tar.gz)
- [ ] Credentials partagés via coffre-fort
- [ ] Vérification accès VPS + Neon + GHCR
- [ ] Vérification domaines + marques
- [ ] PV de livraison signé

### Phase 3 — Post-livraison (J+30)

- [ ] Vérification fonctionnement indépendant
- [ ] Support transitionnel (questions, debugging)
- [ ] Documentation des spécificités du repreneur
- [ ] Clôture compte escrow (le cas échéant)

---

*Document confidentiel — usage strictement privé*
*À faire signer par les deux parties AVANT tout transfert de propriété*