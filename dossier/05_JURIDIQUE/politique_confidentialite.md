# 🔒 Politique de confidentialité — SignauxX

> **Conformité RGPD** (Règlement Général sur la Protection des Données)
> **Date d'effet** : 25 juin 2026
> **Éditeur** : digitaleflex
> **Délégué à la Protection des Données (DPO)** : dpo@signauxx.com

---

## 1. 🎯 PRÉAMBULE

La présente Politique de confidentialité décrit la manière dont **SignauxX** collecte, utilise, partage et protège les données personnelles de ses Utilisateurs.

Elle est conforme au **Règlement Général sur la Protection des Données (RGPD)** — Règlement (UE) 2016/679 — et à la loi **Informatique et Libertés** modifiée.

---

## 2. 📋 RESPONSABLE DU TRAITEMENT

```
Responsable du traitement : digitaleflex
Email : dpo@signauxx.com
Adresse : ____________________
SIRET : ____________________
```

---

## 3. 📊 DONNÉES COLLECTÉES

### 3.1 Données d'identification

| Donnée | Source | Finalité | Base légale |
|---|---|---|---|
| Nom, prénom | Inscription | Identification | Exécution contrat |
| Email | Inscription | Communication | Exécution contrat |
| Téléphone | Profil | Support | Consentement |
| Photo de profil | Profil | Personnalisation | Consentement |
| WhatsApp | Profil | Support | Consentement |

### 3.2 Données de vérification d'identité (KYC)

| Donnée | Source | Finalité | Base légale | Conservation |
|---|---|---|---|---|
| Pièce d'identité (recto/verso) | KYC | Vérification d'identité | Obligation légale (LCB-FT) | **7 jours** |
| Selfie | KYC | Vérification d'identité | Obligation légale (LCB-FT) | **7 jours** |
| Document broker | KYC broker | Vérification broker | Obligation légale | **7 jours** |

> ⚠️ Ces données sont automatiquement supprimées après **7 jours** conformément au principe de minimisation.

### 3.3 Données de connexion

| Donnée | Source | Finalité | Base légale | Conservation |
|---|---|---|---|---|
| Adresse IP | Connexion | Sécurité, anti-fraude | Intérêt légitime | 30 jours |
| User-Agent (navigateur/OS) | Connexion | Sécurité | Intérêt légitime | 30 jours |
| Fingerprint device | Connexion | Anti-fraude | Intérêt légitime | 1 an |
| Géolocalisation IP | Connexion | Sécurité | Intérêt légitime | 30 jours |
| Logs de connexion | Connexion | Sécurité, audit | Obligation légale | 1 an |

### 3.4 Données d'utilisation

| Donnée | Source | Finalité | Base légale |
|---|---|---|---|
| Signaux consultés | Utilisation | Personnalisation | Exécution contrat |
| Favoris et archives | Utilisation | Fonctionnalité | Exécution contrat |
| Historique de lecture | Utilisation | Statistiques | Exécution contrat |
| Messages échangés | Utilisation | Service de messagerie | Exécution contrat |
| Journal de trading | Utilisation | Module coaching | Consentement |
| Streaks, badges | Utilisation | Gamification | Consentement |

### 3.5 Données de paiement

Les données de paiement (carte bancaire, IBAN) sont collectées et traitées **directement par nos prestataires de paiement** (Stripe, PayPal). Nous ne stockons **aucune** donnée bancaire sur nos serveurs.

Seules les informations suivantes sont conservées :
- Référence de transaction (4 derniers chiffres)
- Montant et date
- Plan souscrit

---

## 4. 🎯 FINALITÉS DU TRAITEMENT

Vos données sont traitées pour les finalités suivantes :

### 4.1 Gestion du compte et du service
- Création et gestion du compte utilisateur
- Authentification et sécurité des sessions
- Fourniture des signaux et fonctionnalités souscrites
- Gestion des abonnements et paiements
- Support client

### 4.2 Sécurité et conformité
- Vérification d'identité (KYC) — obligation LCB-FT
- Détection de la fraude (doublons, IP suspectes)
- Audit logs (traçabilité)
- Journalisation des tentatives de connexion
- Conservation des preuves en cas de litige

### 4.3 Amélioration du service
- Statistiques d'usage agrégées et anonymisées
- Détection de bugs et erreurs (Sentry)
- Tests A/B sur certaines fonctionnalités

### 4.4 Communication
- Envoi de signaux et notifications
- Emails transactionnels (confirmation, sécurité)
- Newsletter (avec consentement)
- Réponses aux demandes de support

---

## 5. 🔗 SOUS-TRAITANTS ET TRANSFERTS HORS UE

Les données sont partagées avec les sous-traitants suivants :

| Sous-traitant | Service | Localisation | Garanties |
|---|---|---|---|
| **Neon** | Base de données PostgreSQL | 🇺🇸 États-Unis | SCC + chiffrement TLS |
| **Resend** | Envoi d'emails | 🇺🇸 États-Unis | SCC + Privacy Shield (obsolète) → SCC |
| **Sentry** | Monitoring erreurs | 🇺🇸 États-Unis | SCC + DPA signé |
| **Backblaze B2** | Stockage fichiers | 🇺🇸 États-Unis | SCC |
| **GitHub (GHCR)** | Registre images Docker | 🇺🇸 États-Unis | SCC |
| **Cloudflare** | DNS + CDN | 🇺🇸 États-Unis | SCC |
| **Tailscale** | VPN inter-VPS | 🇺🇸 États-Unis | SCC |
| **AWS S3** | Stockage médias | 🇺🇸 États-Unis | SCC |
| **Stripe / PayPal** | Paiement | 🇺🇸 / 🇮🇪 | Standard Contractuel |

### Garanties pour les transferts hors UE

Tous les transferts vers les États-Unis sont encadrés par les **Standard Contractual Clauses (SCC)** de la Commission européenne (Décision 2021/914) ou par des règles d'entreprise contraignantes (BCR).

Une copie des SCC peut être obtenue sur demande à : `dpo@signauxx.com`.

---

## 6. ⏱️ DURÉE DE CONSERVATION

| Catégorie de données | Durée |
|---|---|
| Données de compte (nom, email, profil) | Pendant la durée du compte + **3 ans** après suppression |
| Documents KYC (CNI, selfie) | **7 jours** après vérification (RGPD minimisation) |
| Documents broker | **7 jours** après vérification |
| Logs de connexion | **1 an** (obligation légale) |
| Audit logs | **1 an** (obligation légale) |
| Cookies de session | **30 jours** maximum |
| Cookies de préférences | **12 mois** maximum |
| Données de paiement | **10 ans** (obligation comptable) |
| Messages privés | Pendant la durée du compte + **1 an** après suppression |
| Backups B2 | **30 jours** rotation automatique |

À l'expiration de ces durées, les données sont **supprimées ou anonymisées de manière irréversible**.

---

## 7. 🍪 COOKIES

### 7.1 Cookies utilisés

| Cookie | Type | Finalité | Durée |
|---|---|---|---|
| Session ID | Fonctionnel | Authentification | Session |
| Theme | Préférence | Dark/light mode | 1 an |
| Language | Préférence | Langue interface | 1 an |
| Timezone | Préférence | Fuseau horaire | 1 an |
| Notification sound | Préférence | Son notifications | 1 an |
| Device fingerprint | Sécurité | Anti-fraude | 1 an |
| Sentry session | Sécurité | Monitoring erreurs | Session |

### 7.2 Gestion du consentement

À votre première visite, un **bandeau de consentement** vous permet d'accepter ou refuser les cookies non essentiels.

Vous pouvez modifier vos préférences à tout moment via le lien « Cookies » en bas de page.

---

## 8. 🛡️ MESURES DE SÉCURITÉ

### 8.1 Mesures techniques

- **Chiffrement en transit** : HTTPS (TLS 1.3)
- **Chiffrement au repos** : AES-256 sur les données sensibles
- **CSP dynamique** avec nonce (Content Security Policy)
- **Rate limiting** sur tous les endpoints critiques
- **CSRF protection** activée
- **Cookies sécurisés** (httpOnly, secure, sameSite=strict)
- **Validation stricte** de toutes les entrées (Zod `.strict()`)
- **Magic bytes** validation anti-MIME falsification
- **Audit logs** avec intégrité (recherche + recovery)

### 8.2 Mesures organisationnelles

- Accès aux données limité aux administrateurs autorisés (RBAC)
- Authentification forte recommandée
- Backups quotidiens chiffrés
- Plan de reprise d'activité (PRA)
- Formation des administrateurs à la sécurité des données

### 8.3 Audit de sécurité

- `pnpm audit` : **0 vulnérabilité** connue
- Audit code par auditeur externe : voir `dossier/06_PRODUCTION/securite_audit.md`

---

## 9. 👤 VOS DROITS

Conformément au RGPD, vous disposez des droits suivants :

| Droit | Description | Comment l'exercer |
|---|---|---|
| **Accès** | Obtenir copie de vos données | `dpo@signauxx.com` |
| **Rectification** | Corriger des données inexactes | Espace « Mon profil » |
| **Effacement** | Supprimer vos données (droit à l'oubli) | `delete-account@signauxx.com` |
| **Portabilité** | Recevoir vos données (JSON) | `export-data@signauxx.com` |
| **Opposition** | Vous opposer à un traitement | `dpo@signauxx.com` |
| **Limitation** | Limiter temporairement un traitement | `dpo@signauxx.com` |
| **Retrait du consentement** | Retirer votre consentement à tout moment | Via votre profil |

### Délai de réponse

Nous nous engageons à répondre à toute demande dans un délai de **30 jours** à compter de sa réception.

### Réclamation auprès de la CNIL

Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la **CNIL** :

```
Commission Nationale de l'Informatique et des Libertés
3 Place de Fontenoy
TSA 80715
75334 PARIS CEDEX 07
www.cnil.fr
```

---

## 10. 🔐 SOUS-TRAITANCE ULTÉRIEURE

Si nous faisons appel à un nouveau sous-traitant, nous nous engageons à :
- Réaliser un audit préalable de ses pratiques
- Signer un accord de sous-traitance conforme à l'article 28 du RGPD
- Vous informer en cas de changement significatif

---

## 11. 📈 DÉCISIONS AUTOMATISÉES

La Plateforme utilise des algorithmes de détection automatisée pour :
- **Anti-fraude** (doublons, IP suspectes, comportement anormal)
- **Personnalisation** (suggestion de signaux basée sur l'historique)

Ces traitements ne produisent **pas de décision juridique** vous affectant significativement au sens de l'article 22 du RGPD.

Vous pouvez à tout moment demander une **intervention humaine** en écrivant à `dpo@signauxx.com`.

---

## 12. 👶 MINEURS

La Plateforme n'est pas destinée aux personnes de moins de **18 ans**.

Aucune donnée de personne mineure n'est intentionnellement collectée.

Si vous êtes parent et découvrez que votre enfant mineur a créé un compte, contactez-nous à `dpo@signauxx.com` pour suppression immédiate.

---

## 13. 🔄 MODIFICATIONS DE LA POLITIQUE

Nous pouvons modifier la présente Politique pour :
- Refléter des évolutions de nos pratiques
- Répondre à des exigences légales ou réglementaires
- Intégrer de nouveaux traitements

En cas de modification substantielle, vous serez informé par :
- Email
- Notification sur la Plateforme
- Bandeau à la prochaine connexion

La date de dernière mise à jour est indiquée en haut du document.

---

## 14. 📞 CONTACT DPO

Pour toute question relative à la protection de vos données :

```
Délégué à la Protection des Données
Email : dpo@signauxx.com
Courrier : [adresse postale]
```

---

## 📑 ANNEXES

- **Annexe A** : Liste détaillée des cookies (à publier séparément)
- **Annexe B** : Registre des activités de traitement (interne)
- **Annexe C** : Analyses d'impact (AIPD) pour les traitements à risque

---

*Document confidentiel — usage strictement privé*
*À faire valider par un DPO ou avocat spécialisé RGPD avant publication*