# MASTER RESEARCH PROMPT — ADMIN STORIES

## Rôle

Tu agis en tant que :
- Senior Product Manager
- Principal Software Architect
- CTO
- Product Owner

## Mission

Ta mission **n'est PAS de générer immédiatement des Admin Stories**.

Tu dois d'abord analyser complètement le produit, puis identifier **uniquement** les opérations administrateur réellement nécessaires à la V1.

---

## Phase 1 : Audit des Documents Sources

Analyser en détail :
- `docs/01-product/PRODUCT_VISION.md`
- `docs/01-product/FUNCTIONAL_SPECIFICATION.md`
- `docs/01-product/BUSINESS_RULES.md`
- `docs/02-architecture/SYSTEM_ARCHITECTURE.md`
- `docs/02-architecture/DATABASE_DESIGN.md`
- `docs/02-architecture/adr/*.md` (tous les ADR)
- `docs/02-architecture/PROJECT_STRUCTURE.md`

---

## Phase 2 : Identification des Opérations Administrateur

Identifier **toutes** les opérations réalisables par un administrateur.

### Domaines à Couvertir

| Domaine | Questions à Se Poser |
|---------|-------------------|
| **Gestion des utilisateurs** | Qui peut créer/supprimer/modifier des membres ? Le statut soft-delete est-il géré ? |
| **Gestion des accès** | Comment les demandes d'accès sont-elles traitées ? Qui peut approuver ? |
| **Gestion des signaux** | Quelles actions sur les signaux ? Création, édition, archivage, programmation ? |
| **KYC** | Qui valide ? Que se passe-t-il en cas de rejet ? Comment la ré-soumission est-elle gérée ? |
| **Broker** | Mêmes questions que KYC |
| **Notifications** | Un admin peut-il déclencher des notifications manuelles ? |
| **Paramètres** | Quels paramètres système sont configurables ? |
| **Audit** | Quels événements sont journalisés ? Comment les consulter ? |
| **Sécurité** | Gestion des rôles ? Session revocation ? |
| **Statistiques** | Quels KPI sont suivis ? Dashboard admin existe-t-il ? |

---

## Phase 3 : Déduplication et Consolidation

- Supprimer les doublons
- Fusionner les actions identiques (ex: approbation KYC + broker dans le même flow)
- Ne jamais créer deux Admin Stories décrivant la même fonctionnalité

---

## Phase 4 : Identification des Dépendances

Pour chaque Admin Story, identifier :
- Les stories dépendantes (ex: ne peut pas publier de signal sans groupe ciblé)
- Les règles métier applicables (BUSINESS_RULES.md)
- Les contrôles d'accès requis (RBAC)
- Les audits associés

---

## Phase 5 : Production Finale

Produire uniquement des Admin Stories **réellement nécessaires à la V1**.

### Format de Sortie

```markdown
## ADM-XXX : [Titre action]

**En tant qu'** administrateur, je veux [action] afin de [but business].

**Domaine** : [Gestion des utilisulisateurs|KYC|Broker|Signaux|...]

**Dépendances** : [Autres stories ou rien]

**Règles métier applicables** : [BUSINESS_RULES.md sections]

**Hors périmètre V1** : [Oui/Non - si oui, justifier pourquoi]
```

---

## Interdits

- Ne pas inventer de fonctionnalités non mentionnées dans les docs
- Ne pas créer de stories hors du périmètre V1 sans justification explicite
- Ne pas doubler la même action avec des formulations différentes