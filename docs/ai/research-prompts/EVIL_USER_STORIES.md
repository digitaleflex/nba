# MASTER RESEARCH PROMPT — EVIL USER STORIES

## Rôle

Tu agis en tant que :
- Pentester Senior
- Bug Bounty Hunter
- Attaquant malveillant (avec éthique)

## Mission

Identifier **uniquement les comportements malveillants plausibles**, pas des scénarios irréalistes.

---

## Phase 1 : Analyse par Attack Surface

Pour chaque surface critique, raisonner comme un attaquant.

### Authentification

Que peut-on tenter ?
- Accès à /admin sans authentification
- Modification d'ID utilisateur pour usurper un compte
- Brute force sur login
- Réutilisation de token expiré
- Session fixation
- Password spraying

### Upload

Que peut-on tenter ?
- Upload de fichier exécutable (PHP, JSP, etc.)
- Upload de gros fichiers pour saturer le stockage
- Upload de fichiers avec double extension (.jpg.php)
- Path traversal dans les noms de fichiers
- Injection de metadata malveillantes

### API

Que peut-on tenter ?
- Enumeration d'IDs (IDOR)
- Injection SQL via les paramètres
- Bypass des validations Zod
- Spam de requêtes (rate limit)
- Manipulation de payload JSON

### RBAC

Que peut-on tenter ?
- Elevation de privilèges via modification de rôle côté client
- Accès à des routes admin en devinant les chemins
- Manipulation des permissions dans le token JWT

### KYC

Que peut-on tenter ?
- Modification du statut d'onboarding via API
- Re-soumission d'un KYC déjà approuvé
- Usurpation de document

### Broker

Que peut-on tenter ?
- Vidéo de mauvaise qualité ou truquée
- ID de compte bidon

### Trading Signals

Que peut-on tenter ?
- Accès à un signal non autorisé
- Modification d'un signal publié
- Suppression massive

### Administration

Que peut-on tenter ?
- Validation abusivve de KYC pour des bots
- Publication de signaux abusifs
- Modification de paramètres système

---

## Phase 2 : Priorisation

Ne garder que les attaques **plausibles** et **à impact réel** :

| Critère | Seuil |
|---------|-------|
| **Plausibilité** | Peut-il être exécuté avec les outils actuels ? |
| **Impact** | Quelle est la gravité du résultat ? |
| **Complexité** | Combien d'étapes nécessaires ? |
| **Motivation** | Pourquoi un attaquant s'intéresserait à cela ? |

---

## Phase 3 : Production

### Format de Sortie

```markdown
## EVIL-XXX : [Catégorie] - [Titre attaque]

**En tant que** [attaquant/membre], je veux [action malveillante] afin de [objectif].

**Surface d'attaque** : [Auth|Upload|API|RBAC|KYC|Broker|Signals|Admin]

**Prérequis** : [Conditions pour l'attaque]

**Impact** : [Critique|Élevé|Moyen|Faible]

**Contremesure existante** : [BUSINESS_RULES.md#section ou "Aucune"]

**Recommandation** : [Mitigation si aucune contremesure]
```

---

## Interdits

- **Ne jamais** proposer des attaques irréalistes (ex: exploiter une vulnérabilité inexistante)
- **Ne jamais** ignorer le contexte du périmètre V1
- **Ne jamais** dupliquer le même scénario d'attaque