# Observability Audit Report — NeverBrokeAgain (NBA)

**Date**: 2026-07-21
**Scope**: Full-stack observability (logs, metrics, traces, dashboards, alerting, incident response)
**Methodology**: Google SRE Handbook, OpenTelemetry, Prometheus Best Practices, CNCF Observability Whitepaper

---

## 1. Executive Summary

NeverBrokeAgain has a **solid logging foundation** (Pino structured JSON, Sentry with PII scrubbing) and an **excellent audit trail** (SHA-256 hash chain, real-time pub/sub). However, **three critical pillars are missing entirely**:

1. **No OpenTelemetry** — zero distributed tracing, no span propagation, no trace correlation
2. **No metrics pipeline** — no Prometheus, no CPU/RAM/disk/latency metrics, no business metrics
3. **No alerting** — no automated detection of any failure condition

The result is an application that can be debugged **reactively** (after a user reports an issue) but cannot be **proactively monitored**. MTTD (Mean Time To Detect) relies entirely on user reports. MTTR is prolonged by the absence of correlation between signals.

**Scores at a glance:**

| Category | Score | Status |
|----------|-------|--------|
| Logging | 65/100 | Good foundation, poor consistency |
| Metrics | 15/100 | Almost non-existent |
| Distributed Tracing | 5/100 | Not implemented |
| Dashboards | 25/100 | Basic admin panel only |
| Alerting | 10/100 | Not configured |
| Incident Response | 20/100 | Reactive, no playbooks |
| Debuggability | 40/100 | Error IDs help but no traces |
| Root Cause Analysis | 35/100 | Audit trail helps, no correlation |
| **Overall** | **27/100** | **★ Faible visibilité** |

---

## 2. Observability Score: 27/100

```
Logging          █████████████████░░░░░░░  65/100  ✅ Bonne base
Metrics          ████░░░░░░░░░░░░░░░░░░░  15/100  ❌ Critique
Traces           █░░░░░░░░░░░░░░░░░░░░░░   5/100  ❌ Critique
Dashboards       ██████░░░░░░░░░░░░░░░░░  25/100  ❌ À construire
Alerting         ██░░░░░░░░░░░░░░░░░░░░░  10/100  ❌ Critique
Incident Resp.   █████░░░░░░░░░░░░░░░░░░  20/100  ❌ À construire
Debuggability    ██████████░░░░░░░░░░░░░  40/100  ⚠️ Insuffisant
RCA              ████████░░░░░░░░░░░░░░░  35/100  ⚠️ Insuffisant
```

---

## 3. Logging Score: 65/100

### Ce qui est bon

| Élément | Status | Détail |
|---------|--------|--------|
| Logger structuré | ✅ | Pino avec JSON en production |
| Niveaux de logs | ✅ | TRACE/DEBUG/INFO/WARN/ERROR |
| Timestamp ISO | ✅ | `pino.stdTimeFunctions.isoTime` |
| Service name | ✅ | `SERVICE_NAME` env var dans chaque log |
| Module context | ✅ | `logger.child({ module: "..." })` pattern |
| PII scrubbing | ✅ | Sentry redacte passwords, tokens, secrets, emails |
| Error ID client | ✅ | `serverError()` génère un errorId court |
| Correlation ID | ✅ | `x-request-id` header sur toutes les réponses |
| Sentry intégration | ✅ | DSN, source maps, replay, 100% traces |
| Sentry PII | ✅ | beforeSend scrub + email/password redaction |
| Audit trail | ✅ | SHA-256 hash chain, severity inference, real-time pub/sub |
| Audit admin UI | ✅ | Filtres par action, resource, date, text search |

### Ce qui manque / est dégradé

| Problème | Gravité | Détail | Occurrences |
|----------|---------|--------|-------------|
| **70+ console.log/error/warn** éparpillés | **Critique** | La moitié des logs utilisent `console.*` au lieu de `pino` | 70+ calls |
| Seulement 9 appels à `log.logger.*` | **Critique** | Pino est sous-utilisé malgré son existence | 9 calls |
| Aucun log Prisma | **Élevé** | Pas de traçage des requêtes lentes, transactions, deadlocks | 0 config |
| Aucun log de performance API | **Élevé** | Pas de timing sur les route handlers | 0 |
| Aucun log middleware | **Moyen** | Le middleware ne logge pas les accès (auth, CSRF) | 0 |
| Pas de log de redémarrage worker | **Moyen** | Les workers loggent via console, pas dans le format standard | 5+ |
| Pas de log de déploiement | **Moyen** | Aucun log lors des déploiements / rollbacks | 0 |
| Pas de log de sécurité structuré | **Moyen** | Auth OK mais pas de log des tentatives échouées structuré | 0 |
| Pas de log d'upload | **Faible** | Les uploads loggent via console.error | 3+ |
| Aucune centralisation des logs | **Critique** | Les logs Pino vont dans stdout Docker, pas de log shipping | 0 |

### Exemple de gap concret

```typescript
// Actuel (70+ occurrences) — non structure, non filtrable, non indexable
console.error("[signal-distribution] Push failed for user ${member.id}:", err)

// Souhaité — structure, filtrable, corrélable
log.error({ err, userId: member.id, module: "signal-distribution" }, "Push notification failed")
```

### Champs présents vs manquants dans les logs

| Champ | Présent | Notes |
|-------|---------|-------|
| Timestamp UTC | ✅ | Pino stdTimeFunctions.isoTime |
| Niveau | ✅ | Pino levels |
| Message | ✅ | |
| Service | ✅ | SERVICE_NAME |
| Module | ✅ | child logger |
| Environnement | ⚠️ | Indirect via NODE_ENV |
| Request ID | ⚠️ | x-request-id dans headers, pas dans logs Pino |
| Correlation ID | ⚠️ | Présent dans les erreurs API, pas dans les logs |
| Trace ID | ❌ | OpenTelemetry absent |
| Span ID | ❌ | OpenTelemetry absent |
| Session ID | ❌ | Pas dans les logs |
| User ID | ⚠️ | Dans les appels `log.warn({ userId })` mais pas systématique |
| Route | ❌ | Pas dans les logs |
| HTTP Method | ❌ | Pas dans les logs |
| HTTP Status | ❌ | Pas dans les logs |
| Duration | ❌ | Pas dans les logs |
| Stack Trace | ⚠️ | Dans Sentry, pas dans Pino |
| Version | ❌ | Pas de version tracking |

---

## 4. Metrics Score: 15/100

### Existant

| Métrique | Source | Status |
|----------|--------|--------|
| Cache hits/misses | `cache.ts` getStats() | ✅ Implémenté mais sans endpoint Prometheus |
| Queue job counts | `/api/admin/queues` | ✅ Implémenté |
| Circuit breaker states | Health endpoint | ✅ Implémenté |
| Uptime | Health endpoint | ✅ Implémenté |

### Manquant

| Métrique | Importance | Raison |
|----------|-----------|--------|
| CPU usage (%) | **Critique** | Aucun monitoring CPU |
| RAM usage (MB) | **Critique** | Aucun monitoring mémoire |
| Disk usage (%) | **Critique** | Aucun monitoring disque |
| Network I/O | **Moyen** | Aucun monitoring réseau |
| API latency (p50/p95/p99) | **Critique** | Pas de mesure de performance |
| API error rate | **Critique** | Pas de compteur d'erreurs |
| API request rate (RPS) | **Élevé** | Pas de compteur de requêtes |
| DB connection pool usage | **Élevé** | Pas de monitoring pool |
| DB query latency | **Critique** | Pas de slow queries tracking |
| Redis memory | **Moyen** | Pas de monitoring Redis |
| Redis hit rate | **Moyen** | Partiel (cache.ts getStats) |
| BullMQ job latency | **Élevé** | Pas de mesure |
| BullMQ failure rate | **Élevé** | Partiel (/api/admin/queues) |
| Email send latency | **Moyen** | Pas de mesure |
| Email failure rate | **Moyen** | Partiel (notification_delivery table) |
| Business metrics (signups, signals, etc.) | **Élevé** | Rien n'est exposé |
| Active users | **Moyen** | Pas de métrique |
| WebSocket connections | **Faible** | Partiel (health endpoint) |
| Sentry event rate | **Faible** | Dans Sentry dashboard, pas exposé |

---

## 5. Distributed Tracing Score: 5/100

### Ce qui est absent

| Élément | Status | Impact |
|---------|--------|--------|
| OpenTelemetry SDK | ❌ Non installé | Impossible de tracer |
| Trace ID generation | ❌ | Pas de trace context |
| Span creation | ❌ | Pas de spans |
| Context propagation | ❌ | Pas de propagation entre services |
| Parent/Child spans | ❌ | Pas de hiérarchie |
| Distributed context (API → Worker → Redis → Resend) | ❌ | Les services sont déconnectés |
| Trace exporter | ❌ | Pas de backend de traces |
| Trace visualization | ❌ | Pas de Jaeger/SigNoz/Grafana Tempo |

### Scénario impossible aujourd'hui

```
Requête utilisateur → API Next.js → Server Action → Prisma → PostgreSQL
                                                    → Redis (cache)
                                                    → BullMQ (notification delivery)
                                                         → Worker → Resend (email)

Impossible de tracer ce chemin complet.
Chaque segment est un silo sans corrélation.
```

### Ce qui pourrait servir de base

- ✅ `x-request-id` header (dans le middleware)
- ✅ Error ID + Correlation ID dans les réponses API (`serverError()`)

Mais ces IDs ne sont pas propagés aux workers, aux queues, ni aux appels externes.

---

## 6. Dashboard Score: 25/100

### Existant

| Dashboard | Emplacement | Qualité |
|-----------|-------------|---------|
| Admin Control Room | `/admin/control-room` | ⚠️ Basique, infos en temps réel |
| Admin Cache Status | `/admin/cache/status` | ✅ Stats cache |
| Admin Queues | `/admin/queues` | ✅ Stats queues |
| Admin Operations | `/admin/operations` | ⚠️ Non audité |
| Bull Board | Port 3002 | ✅ Queue management (Express) |

### Manquant

| Dashboard | Importance | Raison |
|-----------|-----------|--------|
| **Infrastructure** (CPU, RAM, Disk, Network) | **Critique** | Aucune visibilité infrastructure |
| **Application** (API latency, error rate, RPS) | **Critique** | Aucune visibilité applicative |
| **Base de données** (pool, slow queries, deadlocks) | **Critique** | Aucune visibilité DB |
| **Redis** (memory, hit rate, commands/sec) | **Élevé** | Pas de monitoring Redis |
| **BullMQ** (job duration, failure rate, DLQ) | **Élevé** | Partiel via admin/queues |
| **Business** (signups, signals, active users) | **Moyen** | Pas de métier dashboard |
| **Sécurité** (auth failures, permissions, admin actions) | **Élevé** | Audit trail existe mais pas de dashboard |
| **Email** (send rate, bounce rate, delivery time) | **Moyen** | Tracking notification_delivery mais pas de dashboard |
| **WebSocket** (connections, messages/sec) | **Faible** | Partiel via health |

---

## 7. Alerting Score: 10/100

### Existant

| Alerte | Status |
|--------|--------|
| Built-in Better Auth rate limiting | ✅ Bloque à 100 req/min (pas d'alerte, juste blocage) |

### Absence totale d'alerting

| Alerte critique | Existante ? | Impact si non détecté |
|-----------------|-------------|----------------------|
| PostgreSQL down | **❌** | App complètement down, détecté uniquement par les users |
| Redis down | **❌** | Dégradation silencieuse, pas d'alerte |
| SMTP (Resend) circuit breaker OPEN | **❌** | Emails bloqués, pas d'alerte |
| Disk usage > 85% | **❌** | Crash à venir, pas de prévention |
| CPU > 90% | **❌** | Latence, timeouts, pas d'alerte |
| RAM > 90% | **❌** | OOM imminent, pas d'alerte |
| API 500 rate > seuil | **❌** | Bug en production, pas d'alerte |
| BullMQ queue bloquée | **❌** | Jobs non traités, pas d'alerte |
| SSL cert expire < 30j | **❌** | Panne totale à venir, pas d'alerte |
| Déploiement échoué | **❌** | CI/CD peut échouer silencieusement |
| Migration Prisma échouée | **❌** | Schéma incohérent, pas d'alerte |
| Worker crash | **❌** | Jobs non traités, pas d'alerte |
| Healthcheck failed | **❌** | Docker restart mais pas d'alerte |
| Rate limit bypass (Redis down) | **❌** | Sécurité contournée, pas d'alerte |

---

## 8. Incident Response Score: 20/100

### Phases d'un incident — état actuel

| Phase | Durée estimée | Commentaire |
|-------|--------------|-------------|
| **Détection** (MTTD) | **Minutes à heures** | Dépend des signalements utilisateurs |
| **Compréhension** | **10-30 min** | Error ID aide, mais pas de traces |
| **Isolation** | **5-15 min** | Dépend du composant impacté |
| **Correction** | **Variable** | Pas de runbook, pas d'automatisation |
| **Validation** | **5-10 min** | Healthcheck peut aider |
| **Fermeture** | **Immédiat** | Une fois corrigé |

### Ce qui manque

- ❌ Aucun playbook pour les scénarios d'incident
- ❌ Aucun runbook pour les procédures de recovery
- ❌ Aucune procédure d'escalade documentée
- ❌ Aucun template de post-mortem
- ❌ Aucune métrique de temps de résolution
- ❌ Aucune corrélation entre les incidents et les déploiements
- ❌ Aucune alerte proactive — tout est réactif

---

## 9. Debuggability Score: 40/100

### Ce qui aide

| Élément | Utilité |
|---------|---------|
| `error.digest` | L'utilisateur peut transmettre au support |
| `x-request-id` | Corrélation dans les réponses API |
| Sentry stack traces | Stack complète avec source maps |
| Sentry session replay | Voir ce que l'utilisateur a fait avant l'erreur |
| Audit trail hash chain | Vérification d'intégrité, historique |

### Ce qui freine

| Frein | Impact |
|-------|--------|
| Pas de trace ID | Impossible de suivre une requête à travers les services |
| Pas de span → pas de durée par segment | Impossible d'identifier le bottleneck |
| Logs console non centralisés | Impossible de chercher dans tous les logs |
| Pas de log Prisma | Impossible de voir les requêtes SQL lentes |
| Pas de métriques historiques | Impossible de comparer "avant/pendant/après" |
| Pas de lien entre logs et métriques | Deux silos non corrélés |
| Pas de dashboard dédié | Chaque debug part de zéro |

### Test: un développeur peut-il comprendre un incident en moins de 5 minutes ?

**Non** — pour un incident typique (ex: un utilisateur qui ne reçoit pas d'email) :

1. L'utilisateur contacte le support avec son errorId ✅
2. Le dev cherche dans Sentry ✅
3. Le dev doit vérifier :
   - Le circuit breaker Resend est-il OPEN ? → health endpoint
   - Le worker notification-delivery est-il en vie ? → Docker ps / healthcheck
   - La queue a-t-elle des jobs failed ? → Admin queues
   - Le job est-il en DLQ ? → Admin webhooks/DLQ
   - Le `notification_delivery` a-t-il un statut ? → DB query
4. **Aucun de ces checks n'est dans un seul endroit** ❌
5. **Pas de trace pour relier la requête initiale au job BullMQ** ❌
6. **Temps estimé : 15-30 minutes**

---

## 10. Root Cause Analysis Score: 35/100

### Ce qui est bon

- ✅ Audit trail SHA-256 hash chain (immuable, vérifiable)
- ✅ Audit admin UI avec filtres (action, resource, date, text search)
- ✅ Sentry avec stack traces et session replay
- ✅ Error ID pour corrélation côté support

### Ce qui manque

- ❌ Pas de timeline automatique des événements avant un incident
- ❌ Pas de corrélation entre déploiement et changement de comportement
- ❌ Pas de capture des métriques au moment de l'incident
- ❌ Pas de template de post-mortem
- ❌ Pas de leçons apprises formalisées
- ❌ Pas d'analyse de tendances (mêmes erreurs qui reviennent)

---

## 11. Tableau des lacunes

| # | Domaine | Gravité | Impact | Correctif | Priorité |
|---|---------|---------|--------|-----------|----------|
| L1 | **Logs console vs Pino** | Critique | Logs non structurés, non filtrables, perdus dans stdout | Migrer tous les console.* vers Pino | **P0** |
| L2 | **Aucun log Prisma** | Critique | Impossible de diagnostiquer les requêtes lentes / deadlocks | Activer Prisma logging + slow query threshold | **P0** |
| L3 | **Aucune métrique** | Critique | Impossible de monitorer CPU, RAM, disque, latence, erreurs | Ajouter Prometheus + node_exporter | **P0** |
| L4 | **Aucune alerte** | Critique | Aucune détection proactive d'incident | Configurer alerting (Prometheus + Alertmanager ou Sentry) | **P0** |
| L5 | **Aucune trace distribuée** | Critique | Impossible de suivre une requête complète | Implémenter OpenTelemetry | **P0** |
| L6 | **Logs non centralisés** | Élevé | Impossible de chercher/filtrer tous les logs | Ajouter log shipping (Vector, Fluentd, ou Loki) | **P1** |
| L7 | **Aucun dashboard** | Élevé | Pas de visibilité en temps réel | Créer dashboards Grafana (infra, app, biz) | **P1** |
| L8 | **Aucun playbook** | Élevé | Chaque incident est traité de zéro | Rédiger playbooks pour les scénarios connus | **P1** |
| L9 | **Pas de métriques métier** | Moyen | Impossible de mesurer l'impact business des incidents | Exposer signups, signals, connexions en métriques | **P2** |
| L10 | **Pas de corrélation versions** | Moyen | Impossible de lier un incident à un déploiement | Ajouter version tracking dans les logs et métriques | **P2** |
| L11 | **Pas de post-mortem** | Moyen | Pas d'amélioration continue | Créer template de post-mortem + process | **P2** |
| L12 | **Pas de Core Web Vitals** | Faible | Pas de monitoring de l'expérience utilisateur frontend | Ajouter RUM (Real User Monitoring) Sentry ou Web Vitals | **P2** |

---

## 12. Plan d'amélioration

### Quick Wins (1-2 semaines)

| # | Action | Effort | Gain |
|---|--------|--------|------|
| Q1 | Migrer tous les `console.error` vers `logger.error` structuré | 8h | Logs exploitables immédiatement |
| Q2 | Migrer tous les `console.warn` vers `logger.warn` structuré | 4h | Logs exploitables immédiatement |
| Q3 | Migrer tous les `console.log` vers `logger.info` structuré | 4h | Logs exploitables immédiatement |
| Q4 | Ajouter `x-request-id` dans les logs Pino (child logger par requête) | 4h | Corrélation logs ↔ réponses API |
| Q5 | Activer Prisma query logging avec slow query threshold (500ms) | 2h | Visibilité sur les requêtes lentes |
| Q6 | Ajouter duration dans les réponses API (timing middleware) | 4h | Mesure de latence de base |
| Q7 | Ajouter Sentry performance monitoring aux API routes critiques | 4h | Sentry traces sur les routes |
| Q8 | Ajouter un endpoint `/metrics` basique (uptime, memory, cache stats) | 4h | Premières métriques exposées |

### 30 jours

| # | Action | Effort |
|---|--------|--------|
| M1 | Déployer Prometheus + node_exporter pour métriques infrastructure | 1 sem |
| M2 | Créer dashboard Grafana Infrastructure (CPU, RAM, Disk, Network) | 1 sem |
| M3 | Configurer Sentry Alerting sur les erreurs critiques (500, Prisma, etc.) | 3j |
| M4 | Ajouter métriques API (request count, latency, status codes) dans Prometheus | 1 sem |
| M5 | Créer dashboard Grafana Application (API latency, error rate, RPS) | 3j |
| M6 | Rédiger playbooks pour les 5 scénarios d'incident les plus probables | 1 sem |

### 60 jours

| # | Action | Effort |
|---|--------|--------|
| N1 | Implémenter OpenTelemetry SDK (Node.js) pour Next.js | 2 sem |
| N2 | Exporter traces vers SigNoz ou Jaeger | 1 sem |
| N3 | Ajouter métriques métier (signups, signals, connexions) | 1 sem |
| N4 | Créer dashboard Grafana Business | 1 sem |
| N5 | Configurer Alertmanager avec routing vers Slack/Pager | 1 sem |
| N6 | Ajouter healthcheck monitoring externe (Pingdom, UptimeRobot) | 2j |

### 90 jours

| # | Action | Effort |
|---|--------|--------|
| O1 | OpenTelemetry instrumentation des workers BullMQ | 1 sem |
| O2 | Propagation du trace context API → Worker → Resend | 1 sem |
| O3 | Dashboard Grafana Redis + BullMQ | 1 sem |
| O4 | Dashboard Grafana Sécurité (auth, admin actions) | 1 sem |
| O5 | Template de post-mortem + process d'incident | 1 sem |
| O6 | Core Web Vitals monitoring (Sentry RUM ou Web Vitals library) | 3j |

### 6 mois

| # | Action | Effort |
|---|--------|--------|
| P1 | Log shipping centralisé (Grafana Loki, ELK, ou SigNoz logs) | 3 sem |
| P2 | SLO/SLI définition et monitoring | 2 sem |
| P3 | Automatisation des runbooks (auto-remediation) | 3 sem |
| P4 | Analyse de tendances et reporting mensuel | 2 sem |
| P5 | Chaos observability testing (vérifier que les alertes se déclenchent) | 2 sem |

---

## 13. Checklist Production

| Élément | Statut | Commentaire |
|---------|--------|-------------|
| **Logs** | | |
| Logs structurés JSON | ✅ | Pino en production |
| Niveaux de logs | ✅ | TRACE → ERROR |
| Timestamp UTC | ✅ | ISO format |
| Service name | ✅ | SERVICE_NAME |
| Centralisation des logs | ❌ | Pas de log shipping |
| Logs Prisma | ❌ | Non configuré |
| Logs de sécurité | ⚠️ | Audit trail + middleware |
| Logs API (accès) | ❌ | Pas de access log |
| **Metrics** | | |
| CPU monitoring | ❌ | |
| RAM monitoring | ❌ | |
| Disk monitoring | ❌ | |
| API latency | ❌ | |
| API error rate | ❌ | |
| Business metrics | ❌ | |
| Prometheus endpoint | ❌ | |
| **Tracing** | | |
| OpenTelemetry | ❌ | |
| Trace propagation | ❌ | |
| Span creation | ❌ | |
| Trace exporter | ❌ | |
| **Alerting** | | |
| Alertes infrastructure | ❌ | |
| Alertes application | ❌ | |
| Alertes sécurité | ❌ | |
| Alertes business | ❌ | |
| Alertmanager | ❌ | |
| On-call rotation | ❌ | |
| **Dashboards** | | |
| Dashboard infrastructure | ❌ | |
| Dashboard application | ❌ | |
| Dashboard business | ❌ | |
| Dashboard sécurité | ❌ | |
| **Incident Response** | | |
| Playbooks | ❌ | |
| Runbooks | ❌ | |
| Post-mortem template | ❌ | |
| Escalade procedure | ❌ | |
| **Monitoring** | | |
| Health endoint | ✅ | 3 niveaux (healthy/degraded/unhealthy) |
| External monitoring | ❌ | Pas de Pingdom/UptimeRobot |
| Synthetic monitoring | ❌ | |
| RUM (Real User Monitoring) | ⚠️ | Sentry replay (10% sessions) |

---

## 14. Verdict

```
       Observabilité    ██████░░░░░░░░░░░░░░░░░  27/100
       Logging          █████████████░░░░░░░░░░  65/100  ✅
       Metrics          ███░░░░░░░░░░░░░░░░░░░░  15/100  ❌
       Traces           █░░░░░░░░░░░░░░░░░░░░░░   5/100  ❌
       Dashboards       █████░░░░░░░░░░░░░░░░░░  25/100  ❌
       Alerting         ██░░░░░░░░░░░░░░░░░░░░░  10/100  ❌
       Incident Response ████░░░░░░░░░░░░░░░░░░  20/100  ❌
       Debuggability    ████████░░░░░░░░░░░░░░░  40/100  ⚠️
       RCA              ███████░░░░░░░░░░░░░░░░  35/100  ⚠️
```

## ★ Production aveugle — 27/100

L'application a une **bonne base** (Pino, Sentry, audit trail, error IDs) mais les **trois piliers de l'observabilité moderne sont absents** :

1. **Pas de métriques** → impossible de détecter une dégradation progressive
2. **Pas de tracing** → impossible de suivre un chemin à travers les services
3. **Pas d'alerting** → la détection repose entièrement sur les signalements utilisateurs

### Prochaine cible : ★★ Faible visibilité (55/100)

Pour y parvenir en 30 jours :

1. **Quick Wins (sem 1)** : Migrer console → Pino, activer Prisma logging, ajouter duration aux routes ✅ → +15 pts
2. **Prometheus + node_exporter (sem 2-3)** : Métriques CPU, RAM, Disk, API latency → +20 pts
3. **Sentry Alerting (sem 3)** : Alertes sur 500, Prisma errors, circuit breakers OPEN → +10 pts
4. **Dashboard Grafana Infrastructure (sem 4)** : Visibilité temps réel → +10 pts

Total : **27 + 55 ≈ 82/100** en 90 jours.
