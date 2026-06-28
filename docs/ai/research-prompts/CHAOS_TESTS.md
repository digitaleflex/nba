# MASTER RESEARCH PROMPT — CHAOS TESTS

## Rôle

Tu agis en tant que :
- SRE (Site Reliability Engineer)
- Chaos Engineer
- DevOps Architect

## Mission

Tester la **résilience du système** face à chaque composant infra qui tombe en panne.

---

## Scénario de Panne

> **Suppose que chaque composant de l'infrastructure tombe en panne.**

Analyser `docs/02-architecture/SYSTEM_ARCHITECTURE.md` et les ADR pour identifier les impacts.

---

## Composants à Tester

### Base de données
- Neon PostgreSQL inaccessible
- Connexion qui timeout
- Transaction qui échoue
- Verrouillage de table

### Cache & Queue
- Redis unavailable
- BullMQ worker crash
- Queue qui remplit toute la mémoire
- Job qui échoue en boucle

### File Storage
- Docker volume disque plein
- Fichier qui ne peut pas être écrit
- Permission de lecture/écriture manquante

### Email Service
- Resend API down
- Resend rate limit atteint
- Email en bounce permanent

### CDN / Proxy
- Cloudflare down
- Nginx crash
- Certificat SSL expiré

### Application
- VPS qui redémarre
- Processus qui consomme toute la RAM
- Processus qui consomme tout le CPU

---

## Phase 1 : Analyse par Composant

Pour chaque composant, identifier :

| Question | Détails |
|----------|---------|
| **Que devient le système ?** | Graceful degradation ou crash ? |
| **Que devient l'utilisateur ?** | Message d'erreur clair ou page blanche ? |
| **Que devient les données ?** | Perte de données ou intégrité préservée ? |
| **Que devient les jobs ?** | Retry, DLQ, perte définitive ? |
| **Que devient les notifications ?** | Bloquantes ou asynchrones avec fallback ? |

---

## Phase 2 : Scénarios Concrets

### Neon PostgreSQL

Que se passe-t-il si :
- La base est inaccessible pendant 30 secondes ?
- Une requête prend plus de 30 secondes ?
- Le pool de connexion est épuisé ?

### Redis

Que se passe-t-il si :
- Redis redémarre ?
- La queue dépasse la capacité ?
- Un job reste bloqué ?

### BullMQ

Que se passe-t-il si :
- Le worker est arrêté ?
- Un job échoue 3 fois ?
- Le retry est impossible ?

### Docker

Que se passe-t-il si :
- Le volume `uploads/` est plein ?
- Un conteneur consomme toute la RAM ?
- Le réseau Docker est instable ?

### Resend

Que se passe-t-il si :
- L'API renvoie 503 ?
- La clé API est révoquée ?
- Le domaine n'est pas vérifié ?

### Cloudflare

Que se passe-t-il si :
- Le CDN est en panne ?
- WAF bloque des requêtes legitimes ?
- SSL/TLS est désactivé ?

---

## Phase 3 : Production

### Format de Sortie

```markdown
## CHAOS-XXX : [Composant] - [Scénario de panne]

**Composant** : [Neon|Redis|BullMQ|Docker|Resend|Cloudflare]

**Scénario** : [Description de la panne]

**Impact utilisateur** : [Ce que voit l'utilisateur]

**Impact système** : [Ce qui se passe côté système]

**Stratégie de reprise** :
1. [Étape 1 de reprise]
2. [Étape 2 de reprise]
3. [Étape 3 de reprise]

**Graceful degradation** : [Oui/Non - comment le système reste utilisable]

**Référence** : [ADR ou doc technique applicable]
```

---

## Interdits

- Pas de scénarios théoriques sans lien avec l'architecture
- Pas de duplication entre scénarios similaires
- Chaque test doit avoir une réponse concrète du système