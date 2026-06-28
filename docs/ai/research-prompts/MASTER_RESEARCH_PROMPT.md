# Master Research Prompt — NeverBrokeAgain (NBA)

> **Version:** 1.0  
> **Status:** Approved  
> **Last Updated:** June 2026

---

## Règle Fondamentale

**Avant de produire le moindre contenu, réalise un audit complet de l'existant.**

Identifier :
- Les fonctionnalités déjà couvertes dans les documents existants
- Les règles métier déjà documentées
- Les décisions d'architecture (ADR) pertinents
- Les dépendances entre modules
- Les limites du périmètre V1

Ne jamais :
- Ajouter une fonctionnalité déjà documentée
- Créer des doublons entre documents
- Proposer une fonctionnalité qui ne répond pas à un besoin métier clairement identifié
- Inventer de nouvelles fonctionnalités sans justification métier

**L'objectif est une couverture exhaustive avec le minimum de complexité, sans sur-ingénierie.**

---

## Documents de Référence Oblatoires

Tout prompt de recherche doit s'appuyer sur :

| Document | Objectif |
|----------|----------|
| `docs/01-product/PRODUCT_VISION.md` | Vision produit et objectifs |
| `docs/01-product/BUSINESS_RULES.md` | Règles métier exhaustives |
| `docs/01-product/FUNCTIONAL_SPECIFICATION.md` | Spécifications fonctionnelles |
| `docs/02-architecture/SYSTEM_ARCHITECTURE.md` | Architecture technique |
| `docs/02-architecture/PROJECT_STRUCTURE.md` | Structure du projet |
| `docs/02-architecture/adr/ADR-011-RBAC.md` | Contrôle d'accès par rôle |
| `docs/02-architecture/adr/ADR-014-Audit-Logging.md` | Journalisation des événements |
| `docs/02-architecture/adr/ADR-003-BetterAuth.md` | Authentification et sessions |
| `docs/02-architecture/adr/ADR-006-Redis.md` | Queue et cache |
| `docs/02-architecture/adr/ADR-007-BullMQ.md` | Traitement asynchrone |
| `docs/02-architecture/adr/ADR-009-Local-Temporary-Storage.md` | Gestion des fichiers temporaires |
| `docs/02-architecture/adr/ADR-013-File-Upload-Security.md` | Sécurité des uploads |
| `docs/02-architecture/adr/ADR-020-Background-Processing.md` | Jobs et workers |
| `docs/02-architecture/adr/ADR-022-Temporary-File-Lifecycle.md` | Cycle de vie des fichiers |
| `docs/03-database/DATABASE_DESIGN.md` | Schéma de données |
| `docs/03-database/ENTITY_RELATIONSHIP.md` | Relations entités |
| `docs/03-database/DATA_DICTIONARY.md` | Dictionnaire des données |

---

## Méthodologie

### Phase 1 : Audit
Lire et analyser l'ensemble des documents de référence.

### Phase 2 : Détection
Identifier les angles morts, incohérences et oublis.

### Phase 3 : Validation
Chaque proposition doit être justifiée par :
- La vision produit (PRODUCT_VISION.md)
- Le PRD (si disponible)
- Les règles métier (BUSINESS_RULES.md)

### Phase 4 : Production
Ne produire que ce qui est nécessaire à la V1.

Toute fonctionnalité hors périmètre doit être explicitement signalée comme **"Hors périmètre V1".**