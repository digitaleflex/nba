# MASTER OBSERVABILITY SECURITY

> Securite de l'observabilite et observabilite de la securite pour la plateforme NBA.
> Stack: Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis/Valkey, Socket.IO 4.8, BullMQ, MinIO/S3, imgproxy, Traefik, Cloudflare, Docker, PM2

---

## Table des Matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Metriques de securite](#2-metriques-de-securite)
3. [Dashboards](#3-dashboards)
4. [Alertes et seuils](#4-alertes-et-seuils)
5. [Logging securise](#5-logging-securise)
6. [Tracing distribue](#6-tracing-distribue)
7. [SLO et SLI securite](#7-slo-et-sli-securite)
8. [Audit continu](#8-audit-continu)
9. [Outils et stack](#9-outils-et-stack)
10. [Annexes](#10-annexes)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Ce document definit la strategie d'observabilite de la securite pour NBA : comment nous surveillons, mesurons, alertons et ameliorons la posture de securite de la plateforme en continu.

### 1.2 Principes

1. **Zero trust logging** — tous les logs sont consideres sensibles, chiffres en transit et au repos
2. **Defense in depth** — multiples couches de detection (WAF, application, infra, comportement)
3. **Real-time** — alertes P0/P1 en temps reel (< 30s)
4. **Retention** — logs conserves selon leur criticite (90j a 10 ans)
5. **Privacy by design** — pas de PII dans les metriques, logs pseudonymises

---

## 2. Metriques de securite

### 2.1 Metriques utilisateur

| Metrique | Description | Source | Seuil alerte |
|----------|------------|--------|-------------|
| `security.login.rate` | Tentatives de connexion/min | LoginAttempt | > 100/min |
| `security.login.failure_rate` | Taux d'echec de connexion | LoginAttempt | > 20% sur 5min |
| `security.login.blocked` | Connexions bloquees | SecurityEvent | > 0 (P1) |
| `security.login.new_device` | Nouveaux appareils | SecurityEvent | > 10/min |
| `security.login.new_country` | Nouveaux pays | SecurityEvent | > 5/min |
| `security.2fa.failure_rate` | Taux d'echec 2FA | SecurityEvent | > 10% |
| `security.account.suspension_rate` | Suspensions compte | SecurityEvent | > 5/h |
| `security.session.active_count` | Sessions actives totales | Prisma | > seuil plan |
| `security.session.revoke_rate` | Revocations session | SecurityEvent | > 50/min |

### 2.2 Metriques risque

| Metrique | Description | Source | Seuil alerte |
|----------|------------|--------|-------------|
| `security.risk.high_session_count` | Sessions a haut risque | Session | > 10 |
| `security.risk.critical_session_count` | Sessions risque critique | Session | > 3 |
| `security.risk.avg_score` | Score risque moyen | Session/SecurityEvent | > 50 |
| `security.impossible_travel.rate` | Detections voyage impossible | SecurityEvent | > 5/h |
| `security.ip_reputation.vpn_rate` | Connexions depuis IP VPN | IpReputation | > 10% |
| `security.ip_reputation.tor_rate` | Connexions depuis Tor | IpReputation | > 1% |

### 2.3 Metriques infrastructure

| Metrique | Description | Source | Seuil alerte |
|----------|------------|--------|-------------|
| `security.rate_limit.exceeded` | Depassements rate limit | SecurityEvent | > 50/min |
| `security.rate_limit.blocked_ip` | IPs bloqees | Redis | > 10 |
| `security.waf.blocked_requests` | Requetes bloquees WAF | Cloudflare | > 100/min |
| `security.waf.top_attack` | Type d'attaque principal | Cloudflare | N/A |
| `security.auth.brute_force` | Tentatives brute force | LoginAttempt | > 20/min/IP |
| `security.api.invalid_token` | Tokens invalides | API logs | > 50/min |

### 2.4 Metriques applicatives

| Metrique | Description | Source | Seuil alerte |
|----------|------------|--------|-------------|
| `security.audit.chain_integrity` | Integrite chaine d'audit | AuditLog | false => CRITICAL |
| `security.audit.unhashed_count` | Entrees non hachees | AuditLog | > 0 |
| `security.device.trust_distribution` | Distribution niveaux confiance | Device | N/A |
| `security.device.fingerprint_collision` | Collisions fingerprint | Device | > 0 |

---

## 3. Dashboards

### 3.1 Dashboard Securite (vue d'ensemble)

| Panneau | Metriques | Rafraichissement | Audience |
|---------|-----------|-----------------|----------|
| Active Threats | Alertes P0/P1 actives, temps de resolution | 30s | CSIRT |
| Login Activity | Taux de connexion, echouees, nouvelles IPs/pays | 1min | SecOps |
| Risk Distribution | Repartition LOW/MEDIUM/HIGH/CRITICAL | 5min | SecOps |
| Rate Limit Heatmap | IPs bloquees, endpoints, temps | 1min | SRE |
| Device Trust | Distribution TRUSTED/VERIFIED/PENDING/SUSPICIOUS/BLOCKED | 5min | SecOps |
| WAF Overview | Requetes bloquees, top attaques, pays sources | 1min | SRE/CSIRT |
| Session Overview | Sessions actives, age moyen, risque moyen | 5min | SecOps |

### 3.2 Dashboard Incident Response

| Panneau | Metriques | Rafraichissement |
|---------|-----------|-----------------|
| Incident Timeline | Chronologie evenements incident | Temps reel |
| Affected Users | Utilisateurs impactes, sessions actives | 30s |
| Containment Status | Actions de confinement, completion | 30s |
| Logs Correlations | Evenements correles | Temps reel |
| Metrics Spike | Anomalies metriques detectees | 30s |

### 3.3 Dashboard Audit

| Panneau | Metriques | Rafraichissement |
|---------|-----------|-----------------|
| Audit Chain Health | Integrite chaine, dernier hash verifie | 1h |
| Admin Actions | Actions administrateurs par type | 5min |
| Data Access | Acces aux donnees sensibles | 5min |
| Compliance Status | Etat conformite (RGPD, ISO, SOC2) | 1h |

---

## 4. Alertes et seuils

### 4.1 Seuils critiques (P0)

| Alerte | Condition | Fenetre | Action |
|--------|-----------|---------|--------|
| Fuite donnees potentielle | DATA_EXPORT > 10 par user | 5min | Alerte CSIRT + suspension |
| Intrusion massive | LOGIN_FAILED > 100 | 1min | Blocage IP + alerte |
| Ransomware suspecte | Chiffrement massif fichiers | 1min | Isolation instance |
| Brute force distribue | LOGIN_FAILED > 50 IPs differentes | 5min | CAPTCHA + alerte |
| Session hijack | SESSION_HIJACK_DETECTED > 5 | 5min | Revoke sessions + alerte |

### 4.2 Seuils hauts (P1)

| Alerte | Condition | Fenetre | Action |
|--------|-----------|---------|--------|
| Brute force local | LOGIN_FAILED > 5 par user | 1min | Temporisation compte |
| Impossible travel | IMPOSSIBLE_TRAVEL_DETECTED > 3 par user | 1h | Suspension compte |
| Rate limit depasse | RATE_LIMIT_EXCEEDED > 50 par IP | 5min | Blacklist IP temporaire |
| Nouveau pays suspect | LOGIN_NEW_LOCATION pays a risque | 5min | Challenge 2FA |
| WAF bypass tente | WAF block > 100 par IP | 5min | Blacklist IP |

### 4.3 Seuils moyens (P2)

| Alerte | Condition | Fenetre | Action |
|--------|-----------|---------|--------|
| Nouveaux appareils | LOGIN_NEW_DEVICE > 20 | 5min | Surveillance |
| 2FA echecs | TWO_FACTOR_FAILED > 5 par user | 5min | Verification |
| Tokens invalides | API invalid token > 100 | 5min | Rotation cles |
| KYC rejetes | KYC_REJECTED > 5 par user | 24h | Flag fraude |

### 4.4 Seuils informatifs (P3)

| Alerte | Condition | Fenetre | Action |
|--------|-----------|---------|--------|
| Nouveau pays | LOGIN_NEW_LOCATION | 24h | Rapport quotidien |
| Changement MDP | PASSWORD_CHANGED > 10 | 1h | Rapport |
| Nouveau device | DEVICE_REGISTERED | 1h | Rapport |

---

## 5. Logging securise

### 5.1 Principes de securite des logs

1. **Jamais de PII** dans les logs applicatifs (sauf logs d'audit dedies et chiffres)
2. **Tokens revoques** dans les logs (troncature: `tok_abc...xyz`)
3. **IP pseudonymisees** dans les logs de debug (`1.2.3.x`)
4. **Chiffrement** en transit (TLS) et au repos (AES-256)
5. **Integrite** via hash chain pour audit logs
6. **Rotation** automatique, pas d'ecrasement

### 5.2 Niveaux de log securises

| Niveau | Usage | Retention | Exemple |
|--------|-------|-----------|---------|
| ERROR | Erreur de securite (P0/P1) | 2 ans | `SECURITY: Session hijack detected user=u_xxx` |
| WARN | Comportement suspect (P2) | 180j | `SECURITY: Rate limit exceeded ip=1.2.3.x` |
| INFO | Evenement normal | 90j | `SECURITY: Login success user=u_xxx country=FR` |
| DEBUG | Debug securite (desactive en prod) | 7j | `SECURITY: Fingerprint matched device=d_xxx` |

### 5.3 Format de log standardise

```typescript
interface SecurityLogEntry {
  timestamp: string        // ISO 8601
  level: "ERROR" | "WARN" | "INFO" | "DEBUG"
  module: string           // risk-engine, session-manager, etc.
  action: string           // evaluate, login, revoke, etc.
  userId?: string          // pseudonymise (u_xxx)
  sessionId?: string       // pseudonymise (s_xxx)
  deviceId?: string        // pseudonymise (d_xxx)
  ipAddress?: string       // pseudonymise (1.2.3.x)
  duration?: number        // ms
  result?: string          // success, failure, blocked
  errorCode?: string       // code erreur normalise
  details?: Record<string, unknown>
}
```

### 5.4 Sensible data masking

```typescript
function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data }
  if (masked.email) masked.email = maskEmail(masked.email as string)
  if (masked.token) masked.token = maskToken(masked.token as string)
  if (masked.password) masked.password = "[REDACTED]"
  if (masked.ipAddress) masked.ipAddress = maskIP(masked.ipAddress as string)
  if (masked.phone) masked.phone = maskPhone(masked.phone as string)
  return masked
}
```

---

## 6. Tracing distribue

### 6.1 Trace context securite

Chaque requete transporte un contexte de securite dans les spans OpenTelemetry :

| Attribut | Description | Exemple |
|----------|------------|---------|
| `security.user_id` | ID utilisateur pseudonymise | `u_abc123` |
| `security.risk_score` | Score risque au moment de la requete | `25` |
| `security.auth_method` | Methode d'authentification | `session`, `api_key`, `oauth` |
| `security.device_trust` | Niveau confiance appareil | `TRUSTED` |
| `security.session_age` | Age de la session en secondes | `3600` |
| `security.geo.country` | Pays de la requete | `FR` |

### 6.2 Spans securite critiques

| Span | Declencheur | Attributs |
|------|------------|-----------|
| `security.auth.login` | Tentative de connexion | method, success, risk_score |
| `security.auth.2fa` | Verification 2FA | method, success |
| `security.auth.token_refresh` | Refresh token | success, session_age |
| `security.risk.evaluate` | Evaluation risque | score, level, factor_count |
| `security.device.verify` | Verification appareil | trust_level, method |
| `security.session.revoke` | Revocation session | reason, session_age |
| `security.event.emit` | Emission event securite | type, severity |

### 6.3 Sampling

| Niveau risque | Sampling rate | Justification |
|--------------|---------------|---------------|
| CRITICAL | 100% | Tous les evenements critiques |
| HIGH | 100% | Tous les evenements hauts |
| MEDIUM | 10% | Echantillonnage suffisant |
| LOW | 1% | Volume eleve, echantillonnage |
| INFO | 0.1% | Volume tres eleve |

---

## 7. SLO et SLI securite

### 7.1 SLI (Service Level Indicators)

| SLI | Definition | Mesure |
|-----|-----------|--------|
| Time to detect (TTD) | Temps entre incident et detection automatique | 50e percentile < 1min, 99e < 5min |
| Time to respond (TTR) | Temps entre detection et action de containment | P0 < 5min, P1 < 15min |
| Time to contain (TTC) | Temps pour contenir l'incident | P0 < 30min, P1 < 2h |
| Time to resolve (TTRes) | Temps pour eradication complete | P0 < 4h, P1 < 24h |
| Alert accuracy | Taux de vrais positifs / total alertes | > 90% |
| False positive rate | Taux de faux positifs | < 10% |
| Coverage | % modules securite avec monitoring | > 95% |

### 7.2 SLO (Service Level Objectives)

| SLO | Cible | Fenetre | Consequence |
|-----|-------|---------|-------------|
| TTD P0 | < 5min 99% | 30 jours | Review processus |
| TTR P0 | < 15min 99% | 30 jours | Entrainement equipe |
| TTC P0 | < 30min 95% | 30 jours | Amelioration runbooks |
| TTRes P0 | < 4h 95% | 90 jours | Revision infrastructure |
| Alert accuracy | > 90% | 30 jours | Ajustement seuils |
| False positive rate | < 10% | 30 jours | Ajustement regles |
| Uptime securite | > 99.9% | 30 jours | Review redondance |

### 7.3 Error Budget securite

- Budget mensuel: 0.1% de downtime securite (~43 min/mois)
- Consomme par: alertes manquees, detection ratee, faux negatifs
- Si budget epuise: freeze fonctionnalites securite, priorite dette technique

---

## 8. Audit continu

### 8.1 Verification automatisee

| Verification | Frequence | Outil | Action si echec |
|-------------|-----------|-------|-----------------|
| Hash chain integrite | Toutes les heures | Script audit | Alerte CRITICAL |
| Logs retention | Quotidien | Script retention | Alerte HIGH |
| Permissions AWS/GCP | Hebdomadaire | ScoutSuite | Ticket securite |
| Vulnerabilites dependances | Quotidien | npm audit, Snyk | Ticket si HIGH+ |
| Configuration Kubernetes | Hebdomadaire | kube-bench | Ticket securite |
| TLS configuration | Hebdomadaire | SSL Labs API | Ticket si < A |
| WAF rules status | Quotidien | Cloudflare API | Alerte si deseactive |
| Rate limiting status | Quotidien | Script verification | Alerte si absent |

### 8.2 Tests programes

| Test | Frequence | Outil |
|------|-----------|-------|
| OWASP ZAP scan | Hebdomadaire | OWASP ZAP |
| Pentest applicatif | Trimestriel | Prestataire externe |
| Social engineering | Annuel | Prestataire externe |
| Red team | Annuel | Equipe interne + presta |
| Tabletop exercises | Mensuel | CSIRT |
| Disaster recovery | Trimestriel | SRE |

---

## 9. Outils et stack

### 9.1 Stack d'observabilite

| Couche | Outil | Usage |
|--------|-------|-------|
| Metriques | Prometheus + Grafana | Collecte et visualisation |
| Logs | ELK (Elasticsearch, Logstash, Kibana) | Aggregation et analyse logs |
| Tracing | OpenTelemetry + Datadog APM | Tracing distribue |
| Alerting | Alertmanager + PagerDuty | Alerting et escalade |
| WAF | Cloudflare WAF | Protection applicative |
| Scanning | OWASP ZAP | Scan automatise vulnerabilites |
| Dependances | Snyk + npm audit | Scan dependances |
| Configuration | kube-bench, ScoutSuite | Hardening configuration |

### 9.2 Integration securite

```
Application (Next.js)
  |-> Logger (Pino) -> ELK (logs securises)
  |-> Prometheus client -> Prometheus -> Grafana (metriques)
  |-> OpenTelemetry SDK -> Datadog APM (traces)
  |-> Security Event Bus -> Prisma (SecurityEvent) -> Alertmanager
  |-> Cloudflare WAF -> Cloudflare Analytics -> Grafana
  |-> Rate Limiter (Redis) -> Prometheus (compteurs)
  |-> Session Manager -> Prisma (Session) -> Prometheus
  |-> Audit Log -> Prisma (AuditLog) -> Hash Chain verification
```

---

## 10. Annexes

### A. Grafana dashboards (JSON URLs)

- Security Overview: `https://grafana.nba.com/d/security-overview`
- Incident Response: `https://grafana.nba.com/d/incident-response`
- Audit Chain: `https://grafana.nba.com/d/audit-chain`
- WAF Overview: `https://grafana.nba.com/d/waf-overview`
- Device Trust: `https://grafana.nba.com/d/device-trust`

### B. Alertmanager configuration

```yaml
route:
  receiver: 'security-team'
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: 'security-pager'
      repeat_interval: 10m
    - match:
        severity: high
      receiver: 'security-team'
    - match:
        severity: warning
      receiver: 'security-log'
```

### C. Datadog monitors references

- Monitor `sec_login_anomaly`: Detection anomalies connexion
- Monitor `sec_rate_limit`: Depassement rate limit
- Monitor `sec_risk_high`: Score risque eleve
- Monitor `sec_audit_integrity`: Cassure chaine d'audit
- Monitor `sec_waf_blocked`: Blocages WAF massifs
- Monitor `sec_device_anomaly`: Anomalies appareil

### D. SLI formulaire

```typescript
// TTD (Time to Detect)
// Mesure: timestamp detection automatique - timestamp incident reelles
// Source: SecurityEvent.createdAt - heure approximative incident

// TTR (Time to Respond)
// Mesure: timestamp premiere action containment - timestamp detection
// Source: Slack message timestamp, ticket creation

// TTC (Time to Contain)
// Mesure: timestamp containment confirme - timestamp detection
// Source: Action de confinement validee

// TTRes (Time to Resolve)
// Mesure: timestamp resolution confirmee - timestamp detection
// Source: Post-mortem approuve

// Alert Accuracy
// Mesure: true_positives / (true_positives + false_positives)
// Source: Revue hebdomadaire des alertes
```
