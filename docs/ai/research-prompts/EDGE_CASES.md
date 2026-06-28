# MASTER RESEARCH PROMPT — EDGE CASES

## Rôle

Tu agis en tant que :
- QA Engineer Senior
- SRE (Site Reliability Engineer)
- Software Architect

## Mission

Identifier **uniquement les cas limites plausibles** à forte charge ou situations exceptionnelles.

---

## Scénario de Charge

> **Imagine que 10 000 utilisateurs utilisent simultanément la plateforme.**

Analyser chaque module pour identifier les **scénarios de défaillance**.

---

## Recherche des Cas Limites

### Infrastructure

- Interruption réseau pendant une requête API
- Double clic sur un bouton de soumission
- Navigateur fermé pendant un upload
- Timeout serveur (504 Gateway Timeout)
- Upload interrompu (déconnexion)
- Email expéré (OTP, reset password)
- BullMQ arrêté (Redis down)
- Redis indisponible
- Conflits de concurrence (race conditions)
- Rafraîchissement de page pendant une opération

### Authentification

- Session expirée pendant l'onboarding
- Token de session invalide
- Mot de passe oublié pendant la saisie
- Deux onglets ouverts avec des formulaires différents

### Fichiers

- Fichier corrompu après upload
- Fichier supprimé manuellement en dehors du système
- Taille de fichier exactement au seuil
- Format de fichier ambigu (ex: .jpg qui est en réalité .png)

### Base de données

- Enregistrement supprimé entre deux requêtes
- Contrainte unique violée (race condition)
- Transaction interrompue
- Verrouillage de ligne

### Notifications

- Email en bounce permanent
- Rate limit de Resend atteint
- Webhook Telegram qui échoue
- Notification déjà lue par un autre onglet

---

## Phase 1 : Audit par Module

| Module | Scénarios à Analyser |
|--------|-------------------|
| **Auth** | Login simultané, session race condition, MFA timeout |
| **KYC** | Upload qui échoue, fichier qui expire, re-soumission |
| **Broker** | Vidéo qui dépasse durée, format non supporté |
| **Signals** | Publication pendant maintenance, signal déjà publié |
| **Notifications** | Queue saturée, delivery échoué, retry infini |
| **Admin** | Deux admins qui valident le même élément |
| **Subscriptions** | Changement de plan pendant une session |

---

## Phase 2 : Classification

Classer les cas par :
- **Probabilité** : Très faible / Faible / Moyenne / Élevée
- **Impact** : Critique / Élevé / Moyen / Faible
- **Catégorie** : Infrastructure / Authentification / Données / UX

---

## Phase 3 : Production

### Format de Sortie

```markdown
## EC-XXX : [Titre cas limite]

**Scénario** : [Description du cas]

**Module affecté** : [Module]

**Probabilité** : [Très faible|Faible|Moyenne|Élevée]

**Impact** : [Critique|Élevé|Moyen|Faible]

**Comportement attendu** :
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

**Référence Business Rule** : [BUSINESS_RULES.md#section]
```

---

## Interdits

- Aucun cas **normal** n'est autorisé
- Uniquement les cas **limites** et **exceptionnels**
- Pas de duplication entre scénarios similaires