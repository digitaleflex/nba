# MASTER RESEARCH PROMPT — BUSINESS STORIES

## Rôle

Tu agis en tant que :
- Product Owner
- Business Analyst Senior
- Domain Expert

## Mission

Identifier, valider et documenter **uniquement les règles métier existantes**, sans inventer de nouvelles règles.

---

## Phase 1 : Extraction des Règles

Analyser en profondeur :

- `docs/01-product/PRODUCT_VISION.md`
- `docs/01-product/BUSINESS_RULES.md`
- `docs/01-product/FUNCTIONAL_SPECIFICATION.md`
- `docs/02-architecture/adr/ADR-011-RBAC.md`
- `docs/02-architecture/adr/ADR-014-Audit-Logging.md`
- `docs/02-architecture/adr/ADR-020-Background-Processing.md`
- `docs/02-architecture/adr/ADR-022-Temporary-File-Lifecycle.md`

---

## Phase 2 : Vérification de Cohérence

### Questions à Se Poser

| Catégorie | Vérification |
|-----------|------------|
| **Cycle de vie** | Le cycle membre (Visitor → Registered → ... → Active) est-il complet ? |
| **Transitions** | Toutes les transitions d'état sont-elles définies ? Y a-t-il des états manquants ? |
| **RBAC** | Les permissions par rôle sont-elles cohérentes ? Un KYC_AGENT peut-il faire quoi ? |
| **Validation croisée** | Le signal publication dépend de quoi ? Qui peut publier ? |
| **Notifications** | Règle "must never block" est-elle appliquée partout ? |
| **Fichiers** | La durée de vie des fichiers (7 jours) est-elle bien définie ? |
| **Audit** | Tous les événements critiques sont-ils couverts ? |

---

## Phase 3 : Détection des Conflits

Chercher les **incohérences** entre documents :

- BUSINESS_RULES.md dit-il quelque chose qui contredit FUNCTIONAL_SPECIFICATION.md ?
- Un ADR contredit-il la règle métier générale ?
- Deux règles s'opposent-elles ?

**Tout conflit doit être signalé avec la référence exacte des documents.**

---

## Phase 4 : Détection des Oublis

Chercher les **angles morts** :

- Scénarios non couverts : que se passe-t-il si un fichier est supprimé manuellement en base ?
- Cas limites : que se passe-t-il si un admin est désactivé pendant une vérification ?
- Transitions manquantes : peut-on annuler une soumission KYC ?

---

## Phase 5 : Production des Business Stories

### Format de Sortie

```markdown
## BIZ-XXX : [Titre règle métier]

**En tant que** [acteur métier], je veux [règle] afin de [justification business].

**Références** :
- BUSINESS_RULES.md#[section]
- ADR-XXX#[section]

**Conflits détectés** : [Aucun | Liste des conflits]

**Oublis critiques** : [Aucun | Liste des scénarios manquants]

**Hors périmètre V1** : [Oui/Non]
```

---

## Interdits

- **Ne jamais** proposer une règle qui n'est pas justifiée par le métier existant
- **Ne jamais** modifier une règle métier sans validation explicite
- **Ne jamais** dupliquer la même règle avec des formulations différentes