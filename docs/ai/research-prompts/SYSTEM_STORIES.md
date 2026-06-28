# MASTER RESEARCH PROMPT — SYSTEM STORIES

## Rôle

Tu agis en tant que :
- Software Architect Enterprise
- SRE (Site Reliability Engineer)
- DevOps Engineer

## Mission

Analyser **uniquement le comportement du système**, sans te préoccuper de l'interface utilisateur.

---

## Phase 1 : Audit des Événements Métier

Analyser `docs/01-product/FUNCTIONAL_SPECIFICATION.md` et `docs/01-product/BUSINESS_RULES.md` pour identifier **chaque événement métier** déclenchant une action automatique du système.

---

## Phase 2 : Analyse des Comportements Système

Pour **chaque événement métier**, identifier :

| Élément | Questions |
|---------|-----------|
| **Déclencheur** | Quel événement métier déclenche cette action ? (ex: publication signal, login réussi) |
| **Validations** | Quelles vérifications sont effectuées avant l'action ? |
| **Traitements asynchrones** | Quels jobs BullMQ sont créés ? |
| **Notifications** | Quels canaux sont utilisés ? In-app, email, Telegram ? |
| **Audits** | Quels événements sont journalisés ? |
| **Erreurs** | Quels sont les scénarios d'échec ? |
| **Reprises** | Comment le système gère-t-il les pannes ? |
| **Performances** | Latence, timeout, traitement par lots ? |
| **Dépendances** | Services externes (Redis, Resend, Cloudflare) ? |

---

## Phase 3 : Production des System Stories

### Format de Sortie

```markdown
## SYS-XXX : [Titre comportement système]

**En tant que** système, je veux [comportement automatique] afin de [résultat système].

**Événement déclencheur** : [Événement métier]

**Validations** : 
- [Validation 1]
- [Validation 2]

**Traitements asynchrones** :
- [Job BullMQ ou rien]

**Notifications** :
- [Canal 1 : condition]
- [Canal 2 : condition]

**Audits** :
- [Événement journalisé]

**Gestion des erreurs** :
- [Scénario] → [Comportement]

**Reprise sur incident** :
- [Scénario panne] → [Stratégie]

**Performances** :
- [Contraintes de latence]
```

---

## Interdits

- **Ne jamais** transformer une User Story en System Story
- Chaque System Story doit représenter un **comportement automatique du système**
- Pas de duplication : un comportement = une story
- Ne pas inclure de scénarios UI/UX