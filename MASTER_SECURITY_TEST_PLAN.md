# MASTER SECURITY TEST PLAN

> Plan de tests exhaustif pour l'infrastructure de sécurité NBA.
> Stack: Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis/Valkey, Socket.IO 4.8, BullMQ, MinIO/S3, imgproxy, Traefik, Cloudflare, Docker, PM2

---

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Unit Tests — Security Modules](#2-unit-tests--security-modules)
3. [Unit Tests — Audit Modules](#3-unit-tests--audit-modules)
4. [Integration Tests — Risk Engine](#4-integration-tests--risk-engine)
5. [Integration Tests — Session Manager](#5-integration-tests--session-manager)
6. [Integration Tests — Device Trust](#6-integration-tests--device-trust)
7. [Integration Tests — IP Reputation](#7-integration-tests--ip-reputation)
8. [Integration Tests — Impossible Travel](#8-integration-tests--impossible-travel)
9. [Integration Tests — Security Event Bus](#9-integration-tests--security-event-bus)
10. [Integration Tests — Security Notifications](#10-integration-tests--security-notifications)
11. [API Security Tests](#11-api-security-tests)
12. [WebSocket Security Tests](#12-websocket-security-tests)
13. [Better Auth Security Tests](#13-better-auth-security-tests)
14. [Redis/Valkey Security Tests](#14-redisvalkey-security-tests)
15. [PostgreSQL Security Tests](#15-postgresql-security-tests)
16. [BullMQ Security Tests](#16-bullmq-security-tests)
17. [E2E Security Tests](#17-e2e-security-tests)
18. [Fuzzing Tests](#18-fuzzing-tests)
19. [Penetration Tests](#19-penetration-tests)
20. [OWASP Top 10 Tests](#20-owasp-top-10-tests)
21. [Regression Test Matrix](#21-regression-test-matrix)
22. [Test Infrastructure and Mocking Strategy](#22-test-infrastructure--mocking-strategy)
23. [Success Criteria and Coverage Gates](#23-success-criteria--coverage-gates)

---

## 1. Vue d'ensemble

### 1.1 Scope

Ce plan couvre **tous les tests** relatifs à la sécurité de la plateforme NBA :

| Couche | Composants | Type de test |
|--------|-----------|--------------|
| Security Core | risk-engine, session-manager, device-fingerprint | Unit, Integration, Fuzzing |
| Detection | impossible-travel, ip-reputation | Unit, Integration, E2E |
| Events and Alerting | security-event-bus, security-notification-service | Unit, Integration |
| Audit | actions, integrity, labels, renderers, types | Unit, Integration |
| Auth | Better Auth, 2FA, OAuth, sessions | Integration, E2E, Pentest |
| API | Routes Next.js, middleware | API, Fuzzing, OWASP |
| WebSocket | Socket.IO, ws-auth | Integration, E2E |
| Infra | Redis, PostgreSQL, BullMQ, MinIO | Integration, Chaos |
| Device Trust | Device CRUD, verification, fingerprinting | Unit, Integration |
| Notifications | Security alerts, email templates | Unit, Integration |

### 1.2 Principes de test

1. **Isolation** — chaque test unitaire mocke Prisma, Redis, et les dependances externes
2. **Reproductibilite** — seed deterministe, horloge mockee, UUID mocke
3. **Vitesse** — tests unitaires < 100ms, tests d'integration < 2s
4. **Couverture** — >= 90% lignes pour `src/lib/security/*`, >= 85% pour `src/lib/audit/*`
5. **Securite** — jamais de tokens/vrais identifiants dans les tests

### 1.3 Mocking Strategy

```typescript
// Prisma -- mocking unitaire
vi.mock("@nba/lib/db", () => ({
  prisma: {
    session: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    device: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), create: vi.fn() },
    securityEvent: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    securityPolicy: { findUnique: vi.fn() },
  },
}))

// Redis -- mocking unitaire
vi.mock("@nba/lib/redis-pubsub", () => ({
  getConnection: vi.fn(() => ({
    get: vi.fn(), set: vi.fn(), setex: vi.fn(), incr: vi.fn(),
    expire: vi.fn(), sadd: vi.fn(), scard: vi.fn(), publish: vi.fn(),
    del: vi.fn(),
  })),
}))

// Logger -- silencieux en test
vi.mock("@nba/lib/logger", () => ({
  logger: {
    child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
  },
}))
```

### 1.4 Convention de nommage des tests

- `UT-MODULE-NNN` — Unit Test
- `IT-MODULE-NNN` — Integration Test
- `API-NNN` — API Security Test
- `WS-NNN` — WebSocket Security Test
- `BA-NNN` — Better Auth Security Test
- `RD-NNN` — Redis Security Test
- `PG-NNN` — PostgreSQL Security Test
- `BM-NNN` — BullMQ Security Test
- `E2E-NNN` — End-to-End Security Test
- `FUZZ-NNN` — Fuzzing Test
- `PT-NNN` — Penetration Test
- `OWASP-NNN` — OWASP Top 10 Test
- `REG-NNN` — Regression Test

---

## 2. Unit Tests — Security Modules

### 2.1 Risk Engine (`src/lib/security/risk-engine.ts`)

#### SyncRiskEngine.evaluate()

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-RISK-001 | Contexte vide (IP seulement) | `{ ipAddress: "1.2.3.4", userAgent: "test" }` | totalScore >= 0, level "LOW" |
| UT-RISK-002 | Rate limit normal | 3 requetes depuis meme IP en 60s | Aucun facteur rate_limit_ip |
| UT-RISK-003 | Rate limit depasse | 8 requetes depuis meme IP en 60s | Facteur rate_limit_ip avec score > 0 |
| UT-RISK-004 | Session limit OK | 2 sessions actives / max 5 | Aucun facteur session_limit |
| UT-RISK-005 | Session limit proche | 4 sessions actives / max 5 | Facteur session_limit_near, score ~80 |
| UT-RISK-006 | Session limit depassee | 6 sessions actives / max 5 | Facteur session_limit_exceeded, score 100 |
| UT-RISK-007 | Appareil TRUSTED | deviceId avec trustLevel="TRUSTED" | Facteur device_trusted, score 0 |
| UT-RISK-008 | Appareil VERIFIED | deviceId avec trustLevel="VERIFIED" | Facteur device_verified, score 20 |
| UT-RISK-009 | Appareil PENDING | deviceId avec trustLevel="PENDING" | Facteur device_pending, score 50 |
| UT-RISK-010 | Appareil SUSPICIOUS | deviceId avec trustLevel="SUSPICIOUS" | Facteur device_suspicious, score 80 |
| UT-RISK-011 | Appareil BLOCKED | deviceId avec trustLevel="BLOCKED" | Facteur device_blocked, score 100 |
| UT-RISK-012 | Appareil inconnu | deviceId inexistant | Facteur device_not_found, score 90 |
| UT-RISK-013 | Pas de deviceId | context sans deviceId | Facteur device_unknown, score 80 |
| UT-RISK-014 | Device avec flags IP | flagVpn=true, flagProxy=true | Facteur device_ip_flags present |
| UT-RISK-015 | 2FA actif | has2fa=true | Facteur two_factor_active, score 0 |
| UT-RISK-016 | 2FA inactif | has2fa=false | Facteur no_two_factor, score 40 |
| UT-RISK-017 | Email jetable | email="test@tempmail.com" | Facteur disposable_email, score 50 |
| UT-RISK-018 | Email normal | email="test@gmail.com" | Aucun facteur email |
| UT-RISK-019 | Score LOW | facteurs faibles | totalScore <= 30, level "LOW" |
| UT-RISK-020 | Score MEDIUM | facteurs moderes | totalScore 31-50, level "MEDIUM" |
| UT-RISK-021 | Score HIGH | device PENDING + rate limit | totalScore 51-70, level "HIGH" |
| UT-RISK-022 | Score CRITICAL | device BLOCKED + rate limit + session exceed | totalScore > 70, level "CRITICAL" |
| UT-RISK-023 | requiresChallenge HIGH | totalScore 51-70 | requiresChallenge=true |
| UT-RISK-024 | requiresChallenge LOW | totalScore <= 30 | requiresChallenge=false |
| UT-RISK-025 | shouldBlock CRITICAL | totalScore > 70 | shouldBlock=true |
| UT-RISK-026 | shouldBlock MEDIUM | totalScore 31-50 | shouldBlock=false |
| UT-RISK-027 | Redis indisponible | getConnection() returns null | Rate limit ignore, pas d'erreur |
| UT-RISK-028 | Pas de userId | context sans userId | Session limit ignore |
| UT-RISK-029 | Trust level inconnu | device.trustLevel="UNKNOWN" | Facteur device_unknown_trust, score 60 |
| UT-RISK-030 | Calcul pondere exact | facteurs avec poids varies | totalScore mathematiquement correct |

#### SyncRiskEngine.evaluateDeviceTrust()

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-RISK-031 | Device avec VPN flag | flagVpn=true only | Facteur device_ip_flags avec "VPN" |
| UT-RISK-032 | Device avec Proxy flag | flagProxy=true only | Facteur device_ip_flags avec "Proxy" |
| UT-RISK-033 | Device avec Tor flag | flagTor=true only | Facteur device_ip_flags avec "Tor" |
| UT-RISK-034 | Device avec Datacenter flag | flagDatacenter=true only | Facteur device_ip_flags avec "Datacenter" |
| UT-RISK-035 | Device avec tous les flags | tous flags=true | Facteur device_ip_flags avec "VPN, Proxy, Tor, Datacenter" |
| UT-RISK-036 | Device TRUSTED avec flags IP | trustLevel=TRUSTED + flagVpn=true | device_trusted (score 0) MAIS device_ip_flags present |

#### AsyncRiskEngine.evaluateAsync()

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-RISK-037 | Deja en cours (Redis a la cle) | sessionId existe dans Redis | Retourne immediatement |
| UT-RISK-038 | IP Tor detectee | ipReputation.isTor=true | Facteur ip_tor, score 100 |
| UT-RISK-039 | IP VPN detectee | ipReputation.isVPN=true | Facteur ip_vpn, score 70 |
| UT-RISK-040 | IP Proxy detectee | ipReputation.isProxy=true | Facteur ip_proxy, score 60 |
| UT-RISK-041 | IP Datacenter | ipReputation.isDatacenter=true | Facteur ip_datacenter, score 30 |
| UT-RISK-042 | Score > 70 => evenement | totalScore=80 | securityEventBus.emit appelle |
| UT-RISK-043 | Score <= 70 => pas d'evenement | totalScore=50 | securityEventBus.emit NON appelle |
| UT-RISK-044 | Mise a jour session | score calcule | prisma.session.update avec riskScore, riskLevel |
| UT-RISK-045 | Enrich device IP | deviceId fourni | ipReputationService.flagDevice appelle |
| UT-RISK-046 | Impossible travel detecte | geo incoherent | Facteur impossible_travel present |
| UT-RISK-047 | Login velocity > 5 IPs | 6 IPs uniques en 1h | Facteur login_velocity |
| UT-RISK-048 | Login velocity normal | 2 IPs uniques en 1h | null |
| UT-RISK-049 | Toute erreur catchée | Prisma/Redis throw | log.error appelle, pas de throw |
| UT-RISK-050 | Cache IP Redis utilise | cle iprep:1.2.3.4 en cache | Pas d'appel a ip-reputation |

### 2.2 Session Manager (`src/lib/security/session-manager.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-SESS-001 | getPlanLimits avec plan | user a un plan | maxSessions, maxDevices, require2fa du plan |
| UT-SESS-002 | getPlanLimits sans plan | user sans accessRequest | Valeurs par defaut (5, 3, false) |
| UT-SESS-003 | getPlanLimits sans user | userId inexistant | Valeurs par defaut |
| UT-SESS-004 | checkSessionLimit allowed | 3 sessions / max 5 | allowed=true, activeCount=3 |
| UT-SESS-005 | checkSessionLimit denied | 5 sessions / max 5 | allowed=false, activeCount=5 |
| UT-SESS-006 | checkDeviceLimit allowed | 2 devices / max 3 | allowed=true |
| UT-SESS-007 | checkDeviceLimit denied | 3 devices / max 3 | allowed=false |
| UT-SESS-008 | bindSessionToDevice | sessionId + deviceId | prisma.session.update avec deviceId |
| UT-SESS-009 | updateSessionGeo | sessionId + geo | update avec country, city, lat, lng |
| UT-SESS-010 | updateRiskScore LOW | score=20 | riskLevel="LOW", isHighRisk=false |
| UT-SESS-011 | updateRiskScore HIGH | score=65 | riskLevel="HIGH", isHighRisk=false |
| UT-SESS-012 | updateRiskScore CRITICAL | score=85 | riskLevel="CRITICAL", isHighRisk=true |
| UT-SESS-013 | updateRiskScore edge | score=0 | level="LOW", isHighRisk=false |
| UT-SESS-014 | updateRiskScore edge | score=100 | level="CRITICAL", isHighRisk=true |
| UT-SESS-015 | revokeSession | sessionId + userId | deleteMany avec les bons params |
| UT-SESS-016 | revokeSession wrong userId | sessionId + autre userId | Aucune session supprimee |
| UT-SESS-017 | revokeAllSessions | userId | Toutes les sessions supprimees |
| UT-SESS-018 | revokeAllSessions with exclude | userId + excludeSessionId | Session exclue conservee |
| UT-SESS-019 | rotateSessionToken | sessionId | Nouveau token UUID, lastRotation mis a jour |
| UT-SESS-020 | revokeExcessSessions | 8 sessions / max 5 | 3 sessions supprimees (les plus anciennes) |
| UT-SESS-021 | revokeExcessSessions normal | 3 sessions / max 5 | 0 supprimees |
| UT-SESS-022 | getSessionDevice | sessionId avec device | device { id, trustLevel } |
| UT-SESS-023 | getSessionDevice sans device | sessionId sans device | null |
| UT-SESS-024 | Singleton pattern | getInstance() | Meme instance retournee |
| UT-SESS-025 | Plan limits variables | plans differents | maxSessions/maxDevices correspondent |

### 2.3 Device Fingerprint (`src/lib/security/device-fingerprint.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-FP-001 | computeHash deterministe | memes signaux 2x | Meme hash |
| UT-FP-002 | computeHash different | signaux differents | Hash different |
| UT-FP-003 | computeHash avec pepper | signaux + pepper | Hash previsible avec pepper connu |
| UT-FP-004 | Normalisation champs | noms longs => abreviations | "userAgent" => "ua", "language" => "lang" |
| UT-FP-005 | Ordre cles trie | {z:1, a:2} | Hash = hash de {a:2, z:1} |
| UT-FP-006 | computeLegacyFingerprint | Request avec UA + IP | "1.2.3.4|Mozilla/5.0..." |
| UT-FP-007 | computeLegacyFingerprint sans headers | Request vide | "unknown|" |
| UT-FP-008 | computeLegacyFingerprint x-real-ip | x-forwarded-for absent, x-real-ip present | "5.6.7.8|UA" |
| UT-FP-009 | SHA-256 output length | n'importe quels signaux | 64 caracteres hex |
| UT-FP-010 | Pepper par defaut | FINGERPRINT_PEPPER non defini | "nba-fp-pepper" utilise |
| UT-FP-011 | Donnees extremes | screenResolution vide, tz=null | Hash stable, pas de crash |
| UT-FP-012 | Collision test | signaux vs signaux avec casing different | Hash different |

### 2.4 Impossible Travel (`src/lib/security/impossible-travel.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-IT-001 | haversineDistance meme point | Paris => Paris | 0 km |
| UT-IT-002 | haversineDistance connu | Paris <=> Londres | ~344 km |
| UT-IT-003 | haversineDistance oppose | pole N => pole S | ~20015 km |
| UT-IT-004 | haversineDistance NY <=> LA | NY <=> LA | ~3944 km |
| UT-IT-005 | minimumTravelTime normal | 1000 km | ~66.7 minutes |
| UT-IT-006 | minimumTravelTime 0 km | 0 km | 0 minutes |
| UT-IT-007 | Voyage possible | 100km en 120min | null (pas detecte) |
| UT-IT-008 | Voyage impossible | 1000km en 10min | detected=true, severity="HIGH" |
| UT-IT-009 | Voyage tres impossible | 10000km en 5min | detected=true, severity="CRITICAL" |
| UT-IT-010 | Distance < 50km | 30km | null (pas detecte) |
| UT-IT-011 | Pas de session precedente | userId sans sessions | null |
| UT-IT-012 | Session precedente sans geo | latitude/longitude null | null |
| UT-IT-013 | Severity WARNING | ratio 2-5x | severity="WARNING" |
| UT-IT-014 | Severity HIGH | ratio 5-10x | severity="HIGH" |
| UT-IT-015 | Severity CRITICAL | ratio > 10x | severity="CRITICAL" |
| UT-IT-016 | Evenement emis sur detection | detected=true | securityEventBus.emit appelle |
| UT-IT-017 | Suspension apres 3+ detections | 4 detections en 1h | user.isActive=false, suspendedAt defini |
| UT-IT-018 | Compteur Redis normal | 1 detection | Pas de suspension |
| UT-IT-019 | Redis indisponible | getConnection() null | Pas d'erreur, pas de suspension |
| UT-IT-020 | Erreur Prisma catchée | Prisma throw | log.error, retour null |
| UT-IT-021 | toRadians 0 deg | 0 deg | 0 rad |
| UT-IT-022 | toRadians 90 deg | 90 deg | pi/2 rad |
| UT-IT-023 | toRadians 180 deg | 180 deg | pi rad |
| UT-IT-024 | Erreur reseau catchée | fetch throw | log.error, retour null |

### 2.5 IP Reputation (`src/lib/security/ip-reputation.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-IPR-001 | Lookup IP locale | "127.0.0.1" | isVPN=false, confidence=100 |
| UT-IPR-002 | Lookup IPv6 locale | "::1" | isVPN=false, confidence=100 |
| UT-IPR-003 | Lookup localhost | "localhost" | isVPN=false, confidence=100 |
| UT-IPR-004 | Cache Redis hit | cle iprep:1.2.3.4 en cache | Retourne donnees parsees |
| UT-IPR-005 | API success with VPN ASN | ASN 20473 | isVPN=true |
| UT-IPR-006 | API success with Datacenter ASN | ASN 14061 | isDatacenter=true |
| UT-IPR-007 | API success with Tor exit | IP en KNOWN_TOR_EXIT_NODES | isTor=true |
| UT-IPR-008 | Organisation contient "vpn" | org="My VPN Service" | isProxy=true |
| UT-IPR-009 | Organisation cloud | org="Amazon Web Services" | isDatacenter=true |
| UT-IPR-010 | API timeout | fetch lente | Resultat par defaut, pas de throw |
| UT-IPR-011 | API error response | status != 200 | Resultat par defaut |
| UT-IPR-012 | API error data | data.error = true | Resultat par defaut |
| UT-IPR-013 | flagDevice | deviceId + reputation | prisma.device.update appelle |
| UT-IPR-014 | Cache Redis miss puis set | IP non en cache | setex appelle apres fetch |
| UT-IPR-015 | ASN parsing | "AS12345" | asn=12345 |
| UT-IPR-016 | ASN sans prefixe | "12345" | asn=12345 |
| UT-IPR-017 | Confiance avec ASN | asn defini | confidence=85 |
| UT-IPR-018 | Confiance sans ASN | asn null | confidence=60 |
| UT-IPR-019 | Organisation cloud etendue | org="DigitalOcean LLC" | isDatacenter=true |
| UT-IPR-020 | Toutes donnees presentes | API complete | Tous les champs remplis |

### 2.6 Security Event Bus (`src/lib/security/security-event-bus.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-EVB-001 | Emit event basique | eventInput minimal | securityEvent cree, ID retourne |
| UT-EVB-002 | Emit avec tous champs | eventInput complet | Tous champs persistes |
| UT-EVB-003 | Redis publish sur HIGH | severity=HIGH | redis.publish appelle |
| UT-EVB-004 | Redis publish sur INFO | severity=INFO | redis.publish appelle |
| UT-EVB-005 | Redis indisponible | getConnection() null | Pas d'erreur, event cree |
| UT-EVB-006 | Alert trigger sur HIGH | severity=HIGH, type="SECURITY_ALERT" | triggerAlert appelle |
| UT-EVB-007 | Alert trigger sur CRITICAL | severity=CRITICAL | triggerAlert appelle |
| UT-EVB-008 | Pas d'alert sur INFO | severity=INFO | triggerAlert NON appelle |
| UT-EVB-009 | Alert throttling > 10 | 11 alertes en 1h | Log warning, pas d'action |
| UT-EVB-010 | Alert first occurrence | 1ere alerte | setex(alertKey, 3600, "1") |
| UT-EVB-011 | getRecentEvents | userId | Prisma query avec ordre DESC |
| UT-EVB-012 | getRecentEvents limit | limit=5 | take=5 |
| UT-EVB-013 | countByType | userId + type + since | Prisma count avec filtres |
| UT-EVB-014 | getHighRiskEvents | since | HIGH et CRITICAL seulement |
| UT-EVB-015 | getHighRiskEvents with user | since | include user { name, email } |

### 2.7 Security Notification Service (`src/lib/security/security-notification-service.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-NOT-001 | handlePostLogin sans session | userId sans session | Retourne sans action |
| UT-NOT-002 | handlePostLogin sans user | userId sans user | Retourne sans action |
| UT-NOT-003 | Connexion HIGH => alert suspicious | riskLevel="HIGH" | sendSuspiciousLoginAlert appelle |
| UT-NOT-004 | Connexion CRITICAL => alert | riskLevel="CRITICAL" | sendSuspiciousLoginAlert appelle |
| UT-NOT-005 | Connexion LOW => pas d'alert | riskLevel="LOW" | sendSuspiciousLoginAlert NON appelle |
| UT-NOT-006 | Nouvel appareil => alert | device.firstSeenAt < 5s | sendNewDeviceAlert + event LOGIN_NEW_DEVICE |
| UT-NOT-007 | Appareil existant => pas d'alert | device.firstSeenAt > 5s | Pas d'alert |
| UT-NOT-008 | Nouveau pays => alert | country different du dernier | sendNewLocationAlert + event |
| UT-NOT-009 | Meme pays => pas d'alert | country identique | Pas d'alert |
| UT-NOT-010 | notifySuspicious desactive | policy.notifySuspicious=false | Pas d'alert |
| UT-NOT-011 | notifyNewDevice desactive | policy.notifyNewDevice=false | Pas d'alert |
| UT-NOT-012 | notifyNewLocation desactive | policy.notifyNewLocation=false | Pas d'alert |
| UT-NOT-013 | send2FAEnabledAlert | userId + email | notify appelle avec template |
| UT-NOT-014 | send2FADisabledAlert | userId + email | notify appelle avec template |
| UT-NOT-015 | Evenement duplique evite | LOGIN_NEW_DEVICE deja dans recentTypes | Pas de creation d'event |
| UT-NOT-016 | Alerte pays recente < 24h | lastEvent.createdAt < 24h | Pas d'alert |
| UT-NOT-017 | handlePostLogin erreur | Prisma throw | log.error, pas de throw |
| UT-NOT-018 | Policy utilisateur utilisee | securityPolicy utilisateur | notify* flags du user |
| UT-NOT-019 | Template email appelle | sendNewDeviceAlert | securityAlertNewDeviceEmail invoque |
| UT-NOT-020 | notify service appelle | sendSuspiciousLoginAlert | notify() avec type "SECURITY" |

---

## 3. Unit Tests — Audit Modules

### 3.1 Audit Integrity (`src/lib/audit/integrity.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-AUD-001 | computeHash deterministe | memes params 2x | Meme hash |
| UT-AUD-002 | computeHash different | params differents | Hash different |
| UT-AUD-003 | computeHash avec previousHash | previousHash non null | Hash inclut previousHash |
| UT-AUD-004 | computeHash sans previousHash | previousHash=null | Hash sans lien |
| UT-AUD-005 | stableStringify object | {b:2, a:1} | '{"a":1,"b":2}' |
| UT-AUD-006 | stableStringify null | null | '' |
| UT-AUD-007 | stableStringify string | "hello" | 'hello' |
| UT-AUD-008 | findPreviousHash avec hash | dernier avec hash non null | Le hash trouve |
| UT-AUD-009 | findPreviousHash sans hash | aucun hash | null |
| UT-AUD-010 | verifyChain integre | 10 logs avec hash valides | verified=true, brokenLinks=0 |
| UT-AUD-011 | verifyChain corrompu | 1 log avec hash invalide | verified=false, brokenLinks>=1 |
| UT-AUD-012 | verifyChain hash manquant | 1 log sans hash | verified=false, error="Hash manquant" |
| UT-AUD-013 | verifyChain 0 logs | table vide | verified=true, totalEntries=0 |
| UT-AUD-014 | verifyChain limit | limit=5 | Seulement 5 logs verifies |
| UT-AUD-015 | computeHash toutes valeurs nulles | tous null/undefined | Hash stable (pas de crash) |
| UT-AUD-016 | computeHash dates | differentes dates | Hashs differents |

### 3.2 Audit Actions (`src/lib/audit/actions.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-ACT-001 | normalizeAction legacy "signal.publish" | "signal.publish" | "signal.distribution" |
| UT-ACT-002 | normalizeAction legacy "CREATE" | "CREATE" | "signal.created" |
| UT-ACT-003 | normalizeAction deja normalise | "signal.created" | "signal.created" |
| UT-ACT-004 | normalizeAction inconnu | "unknown.action" | "unknown.action" |
| UT-ACT-005 | normalizeAction vide | "" | "" |
| UT-ACT-006 | RESOURCE_TYPES immuable | longueur | 17 types de ressources |
| UT-ACT-007 | normalizeAction "LOGIN" | "LOGIN" | "session.login" |
| UT-ACT-008 | normalizeAction "REGISTER" | "REGISTER" | "user.registered" |
| UT-ACT-009 | normalizeAction "DELETE" | "DELETE" | "user.deleted" |
| UT-ACT-010 | Toutes les entrees LEGACY_ACTION_MAP | Chaque cle | Retourne une valeur non-vide |
| UT-ACT-011 | normalizeAction "access_request.approved" | "access_request.approved" | "access_request.approved" |
| UT-ACT-012 | normalizeAction "broker.approved" | "broker.approved" | "broker_verification.approved" |

### 3.3 Audit Labels (`src/lib/audit/labels.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-LBL-001 | getResourceLabel connu | "access_request" | "Demande d'acces" |
| UT-LBL-002 | getResourceLabel inconnu | "unknown_type" | "unknown_type" |
| UT-LBL-003 | getResourceIcon connu | "access_request" | Key (LucideIcon) |
| UT-LBL-004 | getResourceIcon inconnu | "unknown_type" | Activity (defaut) |
| UT-LBL-005 | getActionLabel connu | "signal.created" | "Signal cree" |
| UT-LBL-006 | getActionLabel inconnu | "unknown.action" | "unknown.action" |
| UT-LBL-007 | getActionIcon "created" | "signal.created" | PlusCircle |
| UT-LBL-008 | getActionIcon "deleted" | "signal.deleted" | Trash2 |
| UT-LBL-009 | getActionIcon "approved" | "kyc_document.approved" | CheckCircle |
| UT-LBL-010 | getActionIcon "rejected" | "broker_verification.rejected" | XCircle |
| UT-LBL-011 | getActionIcon "failed" | "session.login_failed" | XCircle |
| UT-LBL-012 | getActionIcon "distribution" | "signal.distribution" | Upload |
| UT-LBL-013 | getActionIcon "updated" | "signal.updated" | Edit |
| UT-LBL-014 | getActionIcon "scheduled" | "signal.scheduled" | Clock |
| UT-LBL-015 | getActionIcon "duplicated" | "signal.duplicated" | Copy |
| UT-LBL-016 | getActionColor "approved" | "access_request.approved" | "emerald" |
| UT-LBL-017 | getActionColor "rejected" | "access_request.rejected" | "rose" |
| UT-LBL-018 | getActionColor "published" | "signal.published" | "blue" |
| UT-LBL-019 | getActionColor "updated" | "signal.updated" | "amber" |
| UT-LBL-020 | getActionColor "unknown" | "unknown.action" | "muted" |
| UT-LBL-021 | getActionIcon avec normalization | "kyc.approved" | CheckCircle |
| UT-LBL-022 | getResourceIcon avec normalizeAction | "kyc_document" | BookOpen |

### 3.4 Audit Renderers (`src/lib/audit/renderers.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-REN-001 | Export renderAuditLog | fonction | Existe et est callable |
| UT-REN-002 | Export renderAuditEvent | fonction | Existe et est callable |
| UT-REN-003 | Export formatAuditDetail | fonction | Existe et est callable |
| UT-REN-004 | Formatage logs | array de AuditEvent | Retourne un format consommable |

### 3.5 Audit Types (`src/lib/audit/types.ts`)

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| UT-TYP-001 | AuditEvent structure | objet type | Tous les champs requis presents |
| UT-TYP-002 | AuditView type | "timeline" | Accepte "timeline" |
| UT-TYP-003 | AuditView type | "user" | Accepte "user" |
| UT-TYP-004 | AuditView type | "resource" | Accepte "resource" |
| UT-TYP-005 | AuditFilters structure | { actions, resourceTypes } | Structure valide |

---

## 4. Integration Tests — Risk Engine

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-RISK-001 | evaluate complet avec Prisma + Redis | Tous les mocks configures | totalScore calcule, facteurs retournes |
| IT-RISK-002 | evaluate sans Redis | getConnection() null | Evaluation continue sans rate limit |
| IT-RISK-003 | evaluate sans Prisma | Prisma throw sur count | Erreur catchée, log.error |
| IT-RISK-004 | evaluateAsync flux complet | sessionId, userId, IP | Mise a jour session + event si > 70 |
| IT-RISK-005 | evaluateAsync avec deviceId | deviceId fourni | flagDevice + enrichissement IP |
| IT-RISK-006 | evaluateAsync event CRITICAL | totalScore=95 | emit avec severity="CRITICAL" |
| IT-RISK-007 | evaluateAsync event HIGH | totalScore=75 | emit avec severity="HIGH" |
| IT-RISK-008 | evaluateAsync cache IP | iprep:1.2.3.4 en cache | Pas de fetch reseau |
| IT-RISK-009 | evaluateAsync lock Redis | cle risk:async:xxx existe | Pas de double traitement |
| IT-RISK-010 | evaluateAsync enrichDeviceIp echec | flagDevice throw | Non critique, log.error |

---

## 5. Integration Tests — Session Manager

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-SESS-001 | checkSessionLimit flux | user avec plan defini | activeCount correct |
| IT-SESS-002 | checkDeviceLimit flux | user avec devices | deviceCount correct |
| IT-SESS-003 | bindSessionToDevice + verify | session + device | Session liee au device |
| IT-SESS-004 | rotateSessionToken + verify | sessionId | Nouveau token persiste |
| IT-SESS-005 | revokeExcessSessions + verify | 10 sessions / max 5 | 5 supprimees |
| IT-SESS-006 | updateRiskScore + verify | score=75 | isHighRisk=true |
| IT-SESS-007 | revokeAllSessions avec exclude | 3 sessions | 2 revokees (1 conservee) |
| IT-SESS-008 | Session lifecycle complet | creation -> rotation -> revoke | Toutes etapes reussissent |

---

## 6. Integration Tests — Device Trust

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-DEV-001 | Enregistrement device | signaux complets | Device cree avec fingerprint |
| IT-DEV-002 | Device deja enregistre | meme fingerprint | Meme device retourne |
| IT-DEV-003 | Verification email device | deviceId + code | DeviceVerification cree |
| IT-DEV-004 | Code verification expire | code > 10min | Erreur expiration |
| IT-DEV-005 | 3 tentatives echouees | 3 mauvais codes | Device bloque, temporisation |
| IT-DEV-006 | Device TRUSTED apres verification reussie | code correct + opt-in | trustLevel="TRUSTED" |
| IT-DEV-007 | Device ok sans opt-in | code correct sans opt-in | trustLevel="VERIFIED" |
| IT-DEV-008 | Changement flag IP | mise a jour reputation | flagVpn/flagTor mis a jour |

---

## 7. Integration Tests — IP Reputation

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-IPR-001 | Lookup avec cache Redis | IP deja en cache | Temps < 5ms, pas de fetch |
| IT-IPR-002 | Lookup sans cache | IP inconnue | fetch api ipapi.co, cache mis |
| IT-IPR-003 | flagDevice persiste | deviceId + reputation | DB mise a jour |
| IT-IPR-004 | ASN mapping multiple | VPN_ASNs.each | isVPN true pour chaque ASN |
| IT-IPR-005 | Organisation cloud mapping | tous les noms de cloud | isDatacenter true |
| IT-IPR-006 | Lookup loopback | 127.0.0.1 | Pas de fetch, confiance 100 |

---

## 8. Integration Tests — Impossible Travel

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-IT-001 | Detection impossible travel | session precedente Paris -> Tokyo 1h | detected=true, severity="CRITICAL" |
| IT-IT-002 | Voyage normal | Paris -> Lyon 2h | null |
| IT-IT-003 | Pas de session precedente | premiere connexion | null |
| IT-IT-004 | Suspension apres 4 detections | 4 incidents en 1h | user isActive=false |
| IT-IT-005 | Limite compteur Redis | getConnection() null | Pas de suspension, pas de crash |
| IT-IT-006 | Evenement bus emis | detected=true | securityEventBus.emit verifie |

---

## 9. Integration Tests — Security Event Bus

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-EVB-001 | Emit + Redis publish | severity=HIGH | DB cree + Redis publie |
| IT-EVB-002 | Emit sans Redis | getConnection() null | DB cree, pas de crash |
| IT-EVB-003 | getRecentEvents tri | 25 events | 20 plus recents (ordre DESC) |
| IT-EVB-004 | countByType intervalle | events sur 7 jours | count correct |
| IT-EVB-005 | getHighRiskEvents | HIGH + CRITICAL + INFO | Seulement HIGH et CRITICAL |

---

## 10. Integration Tests — Security Notifications

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| IT-NOT-001 | handlePostLogin complet | user + session + policy | Alerte conditionnelle selon niveau risque |
| IT-NOT-002 | Nouvel appareil email | device.firstSeenAt recent | notify() avec email template |
| IT-NOT-003 | Nouvelle localisation email | country different | notify() avec email template |
| IT-NOT-004 | Connexion suspecte email | riskLevel=HIGH | notify() avec email template |
| IT-NOT-005 | 2FA enabled notification | userId + email | notify() + template 2FA |
| IT-NOT-006 | 2FA disabled notification | userId + email | notify() + template 2FA |

---

## 11. API Security Tests

### 11.1 Rate Limiting

| # | Cas | Methode | Attendu |
|---|-----|---------|---------|
| API-001 | Rate limit global depasse | 100 requetes/min | 429 Too Many Requests |
| API-002 | Rate limit auth depasse | 10 tentatives login/min | 429, compte bloque 15min |
| API-003 | Rate limit API key | 1000 req/h par cle | 429, headers rate-limit |
| API-004 | Rate limit WebSocket | 100 connexions/min/IP | Deconnexion forcee |
| API-005 | Rate limit contournement IP | X-Forwarded-For multiple | Count base sur IP reelle |
| API-006 | Rate limit reset | apres fenetre | 200 OK |

### 11.2 Authentication

| # | Cas | Methode | Attendu |
|---|-----|---------|---------|
| API-007 | Requete sans token | GET /api/protected | 401 Unauthorized |
| API-008 | Token expire | Authorization: Bearer expired | 401 |
| API-009 | Token invalide | Authorization: Bearer invalid | 401 |
| API-010 | Token malforme | Authorization: Bearer abc | 401 |
| API-011 | CSRF sans token | POST /api/action | 403 Forbidden |
| API-012 | CSRF token invalide | POST + mauvais CSRF | 403 |
| API-013 | Cookie session invalide | Cookie malforme | 401 |
| API-014 | Session usurpee | token valide mais IP differente | 401 + event SECURITY_ALERT |
| API-015 | Aucun header Auth | requete anonyme | 401 |

### 11.3 Authorization

| # | Cas | Methode | Attendu |
|---|-----|---------|---------|
| API-016 | User sans role accede admin | GET /api/admin | 403 |
| API-017 | User role faible accede feature premium | POST /api/premium | 403 |
| API-018 | User accede ressources autre user | GET /api/user/other-id | 403 ou 404 |
| API-019 | IDOR par parametre | GET /api/resource?userId=other | 403 |
| API-020 | Privilege escalation | PATCH role upgrade | 403 |
| API-021 | Mass assignment | POST avec champs non autorises | Champs ignores |
| API-022 | Bypass autorisation par methode | OPTIONS /api/admin | 405 |

### 11.4 Input Validation

| # | Cas | Methode | Attendu |
|---|-----|---------|---------|
| API-023 | XSS reflete | GET /api/search?q=<script> | Encoded ou 400 |
| API-024 | XSS stocke | POST /api/profile avec <script> | Rejete ou encode |
| API-025 | SQL injection champs texte | POST "name": "'; DROP TABLE--" | 400, pas d'injection |
| API-026 | NoSQL injection | POST JSON avec $ne/$gt | 400 |
| API-027 | Injection JSON | POST avec bom/billion laughs | 413 ou 400 |
| API-028 | Prototype pollution | POST {"__proto__": {...}} | 400 |
| API-029 | Path traversal | GET ../../../etc/passwd | 400 |
| API-030 | Parametre numerique negatif | GET ?page=-1 | 400 |
| API-031 | Parametre enorme | GET ?limit=999999999 | 400 ou capped |
| API-032 | Unicode/caracteres speciaux | POST avec emojis/control chars | Valide ou 400 |

### 11.5 Session Management

| # | Cas | Methode | Attendu |
|---|-----|---------|---------|
| API-033 | Session fixation | login avec sessionId predefini | Nouveau sessionId |
| API-034 | Session non securisee | Cookie sans Secure flag | Secure flag present |
| API-035 | Session httpOnly manquant | Cookie sans httpOnly | httpOnly present |
| API-036 | Session sameSite manquant | Cookie sans SameSite | SameSite Strict/Lax |
| API-037 | Deconnexion incomplete | POST /api/logout | Session detruite, cookie invalide |
| API-038 | Session persistee apres MDP change | ancien token | Toutes sessions revokees sauf courante |

### 11.6 Headers de Securite

| # | Header | Attendu |
|---|--------|---------|
| API-039 | Content-Security-Policy | Present, restrictif |
| API-040 | X-Content-Type-Options | "nosniff" |
| API-041 | X-Frame-Options | "DENY" ou "SAMEORIGIN" |
| API-042 | Strict-Transport-Security | max-age>=31536000, includeSubDomains |
| API-043 | Referrer-Policy | "strict-origin-when-cross-origin" |
| API-044 | Permissions-Policy | Aucune permission excessive |
| API-045 | Cache-Control | Pas de mise en cache donnees sensibles |

### 11.7 File Upload

| # | Cas | Attendu |
|---|-----|---------|
| API-046 | Upload executable | .exe/.sh/.bat refuse |
| API-047 | Upload avec extension trompeuse | .php.jpg detecte |
| API-048 | Upload fichier trop grand | > limite configuree refuse |
| API-049 | Upload SVG avec XSS | <script> strippe |
| API-050 | Upload zip bomb | detectee et refusee |
| API-051 | Upload sans auth | 401 |

---

## 12. WebSocket Security Tests

### 12.1 Authentication et Authorization

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| WS-001 | Connexion sans token | ws:// sans auth | Deconnexion immediate |
| WS-002 | Token invalide | token expire/malforme | Deconnexion |
| WS-003 | Token valide mais mauvais userId | ws pour room other-user | Rejete |
| WS-004 | Connexion multiple | meme token 2x | Seconde deconnectee ou rate limit |
| WS-005 | Reconnexion avec token rotatif | ancien token | Deconnexion |

### 12.2 Rate Limiting et Abuse

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| WS-006 | Flood messages | 1000 msg/s | Rate limit, deconnexion temporaire |
| WS-007 | Emission non autorisee | emit vers room without permission | Rejete |
| WS-008 | Channel prive sans droit | join room privee | Rejete |
| WS-009 | Spoofing event type | event non standard | Ignore |
| WS-010 | Payload enorme | message > 1MB | Rejete |

### 12.3 Validation

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| WS-011 | JSON malforme | "{invalid}" | Rejete, pas de crash |
| WS-012 | Prototype pollution | {"__proto__": ...} | Strippe |
| WS-013 | XSS dans message | "<script>" dans texte | Encode |
| WS-014 | Commande injection | "'; shutdown" | Rejete |
| WS-015 | Binary non attendu | Buffer brut | Rejete |

### 12.4 Redis Adapter

| # | Cas | Attendu |
|---|-----|---------|
| WS-016 | Redis pub/sub interrompu | Fallback, pas de crash |
| WS-017 | Reconnexion Redis | Apres interruption, rejoint rooms |
| WS-018 | Adapter timeout | Gere avec grace |

---

## 13. Better Auth Security Tests

| # | Cas | Input | Attendu |
|---|-----|-------|---------|
| BA-001 | Inscription avec email invalide | "notanemail" | Rejetee |
| BA-002 | Inscription avec email deja pris | email existant | Erreur conflit |
| BA-003 | Inscription MDP faible | "12345" | Rejetee (min 8 chars, complexite) |
| BA-004 | Inscription MDP fort | "Correct-Horse-Battery-Staple-2024!" | Acceptee |
| BA-005 | Login MDP correct | email + MDP valide | Token + session cree |
| BA-006 | Login MDP incorrect | email + mauvais MDP | 401, loginAttempt logged |
| BA-007 | Login avec MDP expire | MDP > 90 jours | Redirection changement MDP |
| BA-008 | Login avec compte suspendu | isActive=false | 403, message suspension |
| BA-009 | Login avec compte supprime | deletedAt non null | 404 ou message generique |
| BA-010 | Brute force prevention | 5 tentatives echouees/min | Temporisation 15min |
| BA-011 | Brute force prevention IP | 20 tentatives/IP/min | Blocage IP 1h |
| BA-012 | OAuth Google state | state manquant/invalide | Rejete |
| BA-013 | OAuth CSRF | state non lie session | Rejete |
| BA-014 | OAuth email mismatch | email OAuth != email compte | Rejete |
| BA-015 | OAuth email deja lie | email OAuth deja associe | Merge ou conflit |
| BA-016 | 2FA TOTP code valide | code correct | 2fa verified |
| BA-017 | 2FA TOTP code invalide | mauvais code | 401 |
| BA-018 | 2FA TOTP code expire | code usage unique rejoue | Rejete |
| BA-019 | 2FA backup code valide | backup code correct | 2fa bypass valide |
| BA-020 | 2FA backup code invalide | mauvais backup code | 401 |
| BA-021 | 2FA backup code deja utilise | backup code consomme | Rejete |
| BA-022 | 2FA email code | code envoye par email | Validate |
| BA-023 | 2FA email timeout | code > 10min | Expire |
| BA-024 | Reset password token valide | email + token | Page reset affichee |
| BA-025 | Reset password token invalide | mauvais token | Rejete |
| BA-026 | Reset password token expire | token > 1h | Rejete |
| BA-027 | Reset password MDP identique | nouveau = ancien | Rejete |
| BA-028 | Email verification token | token valide | Email verified |
| BA-029 | Email verification token expire | token > 24h | Nouveau token envoye |
| BA-030 | Session refresh token rotate | refresh token | Ancien invalide, nouveau fourni |
| BA-031 | Remember me cookie | cookie persistant | Session > 30 jours |
| BA-032 | Session revoke admin | admin force revoke | User deconnecte |

---

## 14. Redis/Valkey Security Tests

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| RD-001 | Connexion Redis non auth | sans AUTH | Refusee (requirepass) |
| RD-002 | Commande dangereuse FLUSHALL | depuis app | Refusee (rename-command) |
| RD-003 | Commande dangereuse CONFIG | depuis app | Refusee (rename-command) |
| RD-004 | Commande EVAL Lua | depuis app | Refusee ou sandboxee |
| RD-005 | ACL user restrictions | user app | Seulement commandes permises |
| RD-006 | Redis TLS | sans TLS | Refusee (si TLS force) |
| RD-007 | Cles expirees | TTL atteint | Cle supprimee automatiquement |
| RD-008 | Redis memory full | maxmemory-policy | Pas de crash, eviction |
| RD-009 | Redis failover | noeud primaire down | Bascule replica |
| RD-010 | Redis slow log | commande lente | Detectee et logged |

---

## 15. PostgreSQL Security Tests

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| PG-001 | Connexion non auth | sans credentials | Refusee |
| PG-002 | SQL injection via Prisma | raw query avec input user | Parametrise |
| PG-003 | Row Level Security | user voit seulement ses donnees | RLS applique |
| PG-004 | Audit log tampering | UPDATE audit_log | Refuse (trigger) |
| PG-005 | Audit log hash chain verification | verifyChain() | integre |
| PG-006 | Connection pooling overflow | 100 connexions simultanees | Pool limite |
| PG-007 | SSL/TLS requis | sans SSL | Refuse |
| PG-008 | Role privileges minimaux | user app | Pas de DDL |
| PG-009 | PII data encryption | donnees sensibles | Chiffrees (pgcrypto) |

---

## 16. BullMQ Security Tests

| # | Cas | Setup | Attendu |
|---|-----|-------|---------|
| BM-001 | Ajout job non auth | sans token | Refuse |
| BM-002 | Job avec payload malveillant | JSON avec proto pollution | Strippe |
| BM-003 | Job trop volumineux | payload > 1MB | Refuse |
| BM-004 | Queue access non authorise | autre tenant | Refuse |
| BM-005 | Bull Board sans auth | /admin/queues | Refuse |
| BM-006 | Job retry loop infini | job toujours failed | Max retries atteint, DLQ |
| BM-007 | Job delayed manipulation | date future improbable | Limite max delay |
| BM-008 | Remove job non authorise | tentative suppression | Refuse |

---

## 17. E2E Security Tests

| # | Scenario | Etapes | Attendu |
|---|----------|--------|---------|
| E2E-001 | Inscription -> Login -> Deconnexion | 4 etapes | Flux complet sans erreur |
| E2E-002 | Login -> 2FA -> Dashboard | 3 etapes | 2FA requis puis acces |
| E2E-003 | Reset password -> Login | email -> reset -> login | MDP mis a jour |
| E2E-004 | Session expiree -> refresh | attendre expiration | Refresh automatique |
| E2E-005 | Appareil inconnu -> email alert | login nouvel appareil | Email recu |
| E2E-006 | IP suspecte -> challenge | login depuis VPN | Challenge 2FA requis |
| E2E-007 | Account sharing detection | 2 connexions IP differentes | Alerte + limitation |
| E2E-008 | Brute force -> blocage | 10 tentatives echouees | Compte temporairement bloque |
| E2E-009 | Session volee -> revoke | vol token, admin revoke | Token invalide |
| E2E-010 | Admin force logout user | admin panel revoke | User deconnecte |

---

## 18. Fuzzing Tests

| # | Cible | Type de fuzz | Vecteurs | Attendu |
|---|-------|-------------|----------|---------|
| FUZZ-001 | POST /api/auth/login | Email fuzzing | 1000 emails malformes | 400 ou 401, pas de 500 |
| FUZZ-002 | POST /api/auth/login | Password fuzzing | 1000 MDP extremes | 400 ou 401, pas de 500 |
| FUZZ-003 | GET /api/* | Parametre fuzzing | IDOR, path traversal, injection | 400/403/404, pas de 500 |
| FUZZ-004 | POST /api/* | JSON fuzzing | Types incoherents, nesting profond | 400, pas de crash |
| FUZZ-005 | WebSocket messages | Payload fuzzing | Binaires, JSON deep, control chars | Rejet, pas de crash |
| FUZZ-006 | Headers HTTP | Header fuzzing | Injections CRLF, XSS, spoofing | Valide ou 400 |
| FUZZ-007 | File upload | Content fuzzing | Magic bytes trompeurs | Detecte et refuse |
| FUZZ-008 | Cookie manipulation | Cookie fuzzing | Taille, encodage, injection | Valide ou 400 |
| FUZZ-009 | Rate limit headers | Header spoofing | X-Forwarded-For multiples | IP source correcte |
| FUZZ-010 | Unicode normalization | Input fuzzing | Homoglyphs, zero-width chars | Normalise ou 400 |

---

## 19. Penetration Tests

| # | Cible | Technique | Methode | Attendu |
|---|-------|-----------|---------|---------|
| PT-001 | Login form | Credential stuffing | 100 paires email:password top100 | Bloque apres N tentatives |
| PT-002 | API keys | Key leak in URL | Logs, referrer, cache | Pas de cle dans URL |
| PT-003 | JWT tokens | JWT none algorithm | alg:none signature | Rejete |
| PT-004 | JWT tokens | JWT weak key | HS256 brute force | Rejete |
| PT-005 | Session cookies | Cookie theft via XSS | document.cookie | HttpOnly flag present |
| PT-006 | CSRF tokens | CSRF prediction | Pattern analysis | Token imprevisible |
| PT-007 | CSRF tokens | CSRF reuse | Meme token 2x | Rejete |
| PT-008 | OAuth flow | OAuth misconfiguration | redirect_uri manipulation | Rejete |
| PT-009 | OAuth flow | OAuth token interception | state bypass | Rejete |
| PT-010 | WebSocket | WS hijacking | CSWSH | Origin check |
| PT-011 | CORS | CORS misconfiguration | Origin: evil.com | Pas de Access-Control-Allow-Origin |
| PT-012 | CORS | CORS preflight | OPTIONS avec Origin | Pas de credentials wildcard |
| PT-013 | Cache poisoning | Cache deception | URL manipulation | Pas de caching sensible |
| PT-014 | Subdomain takeover | DNS enumeration | CNAME non resolvable | Detecte |
| PT-015 | Dependency chain | Supply chain | npm audit | Aucune vuln connue |
| PT-016 | Session timeout | Session persistence | Cookie JWT > 24h | Refresh requis |
| PT-017 | Race condition | Concurrent requests | 10 requetes simultanees | Pas de TOCTOU |
| PT-018 | SSRF | Server-Side Request Forgery | /api/proxy?url=http://169.254.169.254/ | Bloque |
| PT-019 | Open redirect | Redirect validation | /api/redirect?url=http://evil.com | Bloque |
| PT-020 | HTTP method override | Verb tampering | X-HTTP-Method-Override: DELETE | Valide selon ACL |

---

## 20. OWASP Top 10 Tests

### A01: Broken Access Control

| # | Test | Attendu |
|---|------|---------|
| OWASP-001 | Bypass RBAC via HTTP method manipulation | 403 |
| OWASP-002 | IDOR dans endpoint API | 403 ou 404 |
| OWASP-003 | Privilege escalation via parametre | Champs ignores |
| OWASP-004 | Acces admin sans role | 403 |
| OWASP-005 | Modification donnees autre utilisateur | 403 |
| OWASP-006 | Acces fichiers prives sans permission | 403 |
| OWASP-007 | Modification metadata non autorisee | 403 |

### A02: Cryptographic Failures

| # | Test | Attendu |
|---|------|---------|
| OWASP-008 | Mots de passe en clair dans logs | Absents |
| OWASP-009 | Donnees sensibles dans URL | Absentes |
| OWASP-010 | TLS faible | Refuse (TLS 1.3+ force) |
| OWASP-011 | Certificat invalide | Refuse |
| OWASP-012 | HSTS absent | Present |
| OWASP-013 | Chiffrement donnees inactives | AES-256 |
| OWASP-014 | Hash MDP faible | argon2id (ou bcrypt cost >= 12) |

### A03: Injection

| # | Test | Attendu |
|---|------|---------|
| OWASP-015 | SQL injection via Prisma raw | Parametrise |
| OWASP-016 | NoSQL injection MongoDB | 400 |
| OWASP-017 | LDAP injection | 400 |
| OWASP-018 | OS command injection | 400 |
| OWASP-019 | SSTI (Server-Side Template Injection) | 400 |
| OWASP-020 | XPath injection | 400 |

### A04: Insecure Design

| # | Test | Attendu |
|---|------|---------|
| OWASP-021 | Rate limit absent (brute force) | Present |
| OWASP-022 | Email enumeration | Message generique |
| OWASP-023 | Password reset token faible | Imprevisible |
| OWASP-024 | Faille logique workflow | Non exploitable |
| OWASP-025 | Trust boundary violation | Validee |

### A05: Security Misconfiguration

| # | Test | Attendu |
|---|------|---------|
| OWASP-026 | Debug endpoint en prod | Desactive |
| OWASP-027 | Default credentials | Changes |
| OWASP-028 | Stack trace exposee | Desactivee |
| OWASP-029 | CORS trop permissif | Domaines autorises listes |
| OWASP-030 | Headers securite manquants | Tous presents |
| OWASP-031 | Directory listing | Desactive |

### A06: Vulnerable and Outdated Components

| # | Test | Attendu |
|---|------|---------|
| OWASP-032 | npm audit vulnerabilities | 0 critical, 0 high |
| OWASP-033 | Version Node.js obsolete | LTS supportee |
| OWASP-034 | Dependances dev en prod | Absentes |
| OWASP-035 | Docker image obsolete | Scannee, pas de vuln |

### A07: Identification and Authentication Failures

| # | Test | Attendu |
|---|------|---------|
| OWASP-036 | Liste de mots de passe courants | Bloques |
| OWASP-037 | Weak password policy enforced | Min 8 chars, complexite |
| OWASP-038 | Credential stuffing detection | Detecte et bloque |
| OWASP-039 | Session fixation | Token regenere au login |
| OWASP-040 | Concurrent session handling | Limite plan |

### A08: Software and Data Integrity Failures

| # | Test | Attendu |
|---|------|---------|
| OWASP-041 | Mise a jour non signee | Refusee |
| OWASP-042 | CI/CD pipeline security | Signe, verifie |
| OWASP-043 | Deserialisation non securisee | Refusee |
| OWASP-044 | CSP bypass | Bloque |

### A09: Security Logging and Monitoring Failures

| # | Test | Attendu |
|---|------|---------|
| OWASP-045 | Login echoue non logge | Logge (LoginAttempt) |
| OWASP-046 | Action admin non auditee | Auditee |
| OWASP-047 | Logs sans timestamp | Timestamp ISO 8601 |
| OWASP-048 | Log injection | Encoded |

### A10: Server-Side Request Forgery

| # | Test | Attendu |
|---|------|---------|
| OWASP-049 | SSRF vers metadata cloud | Bloque |
| OWASP-050 | SSRF vers internal network | Bloque |
| OWASP-051 | SSRF via URL scheme | file:// ftp:// bloques |
| OWASP-052 | SSRF via DNS rebinding | Mitige |

---

## 21. Regression Test Matrix

| # | Zone | Test de regression | Frequence | Declencheur |
|---|------|-------------------|-----------|-------------|
| REG-001 | Auth | Login/Logout/Register | Chaque commit | Changement auth |
| REG-002 | Auth | 2FA enable/disable/verify | Chaque commit | Changement 2FA |
| REG-003 | Auth | Password reset flow | Chaque commit | Changement MDP |
| REG-004 | Sessions | Session creation/revoke | Chaque commit | Changement sessions |
| REG-005 | Device Trust | Device CRUD + fingerprint | Chaque commit | Changement device |
| REG-006 | Risk Engine | evaluate() tous niveaux | Chaque commit | Changement risk-engine |
| REG-007 | IP Reputation | lookup() + flagDevice | Chaque commit | Changement IP |
| REG-008 | Impossible Travel | detection + severity | Chaque commit | Changement geo |
| REG-009 | Security Events | emit + getRecent + countByType | Chaque commit | Changement event-bus |
| REG-010 | Security Notifications | handlePostLogin + alerts | Chaque commit | Changement notifications |
| REG-011 | Audit Integrity | computeHash + verifyChain | Chaque commit | Changement audit |
| REG-012 | Audit Actions | normalizeAction | Chaque commit | Changement actions |
| REG-013 | API | Headers securite endpoints | Chaque commit | Changement middleware |
| REG-014 | WebSocket | Auth + rate limit + events | Chaque commit | Changement ws-auth |
| REG-015 | Rate Limiting | Global + Auth + API | Chaque commit | Changement rate limit |

---

## 22. Test Infrastructure and Mocking Strategy

### 22.1 Architecture de test

```
src/
  test/
    setup.ts                       # Configuration vitest globale
    mocks/                         # (a creer)
      prisma.ts                    # Mock Prisma unifie
      redis.ts                     # Mock Redis unifie
      logger.ts                    # Mock logger silencieux
      security-event-bus.ts        # Mock event bus
      ip-reputation.ts             # Mock IP reputation API
      notifications.ts             # Mock notification service
    fixtures/                      # (a creer)
      devices.ts                   # Fixtures appareils
      sessions.ts                  # Fixtures sessions
      users.ts                     # Fixtures utilisateurs
      security-events.ts           # Fixtures evenements
      fingerprints.ts              # Fixtures empreintes
    helpers/                       # (a creer)
      risk-context-builder.ts      # Builder pattern RiskContext
      test-factory.ts              # Factory generique
```

### 22.2 Prisma Mock Unifie

```typescript
// src/test/mocks/prisma.ts
import { vi } from "vitest"

type MockFunction = ReturnType<typeof vi.fn>

export function createMockPrisma() {
  return {
    session: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    device: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    securityPolicy: {
      findUnique: vi.fn(),
    },
    accessRequest: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((cb: Function) => cb()),
  }
}

export type MockPrisma = ReturnType<typeof createMockPrisma>
```

### 22.3 Redis Mock Unifie

```typescript
// src/test/mocks/redis.ts
import { vi } from "vitest"

export function createMockRedis() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    sadd: vi.fn(),
    scard: vi.fn(),
    publish: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    ttl: vi.fn(),
  }
}

export function createMockRedisConnection() {
  return {
    getConnection: vi.fn(() => createMockRedis()),
  }
}

export type MockRedis = ReturnType<typeof createMockRedis>
```

### 22.4 Test Factory

```typescript
// src/test/helpers/test-factory.ts
import { faker } from "@faker-js/faker"
import type { DeviceSignals } from "../../lib/security/device-fingerprint"
import type { RiskContext } from "../../lib/security/risk-engine"

export function buildRiskContext(overrides?: Partial<RiskContext>): RiskContext {
  return {
    userId: faker.string.uuid(),
    email: faker.internet.email(),
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    deviceId: faker.string.uuid(),
    deviceTrustLevel: "TRUSTED",
    has2fa: true,
    planTier: 2,
    planMaxSessions: 10,
    ...overrides,
  }
}

export function buildDeviceSignals(overrides?: Partial<DeviceSignals>): DeviceSignals {
  return {
    userAgent: faker.internet.userAgent(),
    language: "fr-FR",
    platform: "Win32",
    screenResolution: "1920x1080",
    colorDepth: 24,
    timezone: "Europe/Paris",
    timezoneOffset: -60,
    cpuCores: 8,
    touchSupport: false,
    pixelRatio: 1,
    hardwareConcurrency: 8,
    vendor: "Google Inc.",
    ...overrides,
  }
}
```

### 22.5 Coverage Configuration

```typescript
// vitest.config.ts (extrait coverage)
coverage: {
  provider: "v8",
  include: [
    "src/lib/security/**/*.ts",
    "src/lib/audit/**/*.ts",
    "src/lib/services/device.ts",
    "workers/ws-auth.ts",
  ],
  exclude: [
    "src/generated/**",
    "src/test/**",
    "**/*.d.ts",
    "**/*.test.*",
    "**/*.spec.*",
  ],
  thresholds: {
    statements: 85,
    branches: 80,
    functions: 90,
    lines: 85,
  },
},
```

---

## 23. Success Criteria and Coverage Gates

### 23.1 Coverage Gates

| Module | Coverage Requise | Priority |
|--------|-----------------|----------|
| `src/lib/security/risk-engine.ts` | 95% lignes | CRITICAL |
| `src/lib/security/session-manager.ts` | 95% lignes | CRITICAL |
| `src/lib/security/device-fingerprint.ts` | 95% lignes | HIGH |
| `src/lib/security/impossible-travel.ts` | 95% lignes | CRITICAL |
| `src/lib/security/ip-reputation.ts` | 90% lignes | HIGH |
| `src/lib/security/security-event-bus.ts` | 90% lignes | HIGH |
| `src/lib/security/security-notification-service.ts` | 85% lignes | HIGH |
| `src/lib/audit/integrity.ts` | 95% lignes | CRITICAL |
| `src/lib/audit/actions.ts` | 100% lignes | HIGH |
| `src/lib/audit/labels.ts` | 90% lignes | MEDIUM |
| `src/lib/services/device.ts` | 80% lignes | MEDIUM |
| `workers/ws-auth.ts` | 80% lignes | HIGH |

### 23.2 Test Count Gates

| Type | Minimum | Ideal |
|------|---------|-------|
| Unit tests | 200 | 300+ |
| Integration tests | 50 | 80+ |
| API security tests | 50 | 80+ |
| WebSocket tests | 20 | 30+ |
| Better Auth tests | 35 | 50+ |
| E2E tests | 10 | 20+ |
| Fuzzing tests | 10 | 20+ |
| Pentest scenarios | 20 | 30+ |
| OWASP tests | 52 | 52/52 |
| **Total** | **447** | **662+** |

### 23.3 Quality Gates

| Gate | Seuil | Action si echoue |
|------|-------|------------------|
| All unit tests pass | 100% | Bloque merge |
| Coverage >= 85% | 85% | Warning, review requis |
| Coverage >= 90% (security) | 90% | Bloque merge |
| No flaky tests | < 1% | Flaky mark + fix requis |
| Test duration | < 5min CI | Optimiser tests lents |
| OWASP ZAP scan | 0 High/Critical | Bloque deploiement |
| npm audit | 0 Critical | Bloque deploiement |

### 23.4 Test Execution Matrix

```yaml
# .github/workflows/security-tests.yml (concept)
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm vitest run --reporter=verbose src/lib/security/
      - run: pnpm vitest run --reporter=verbose src/lib/audit/

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
      redis:
        image: redis:7-alpine
    steps:
      - run: pnpm vitest run --reporter=verbose --config vitest.integration.ts

  api-security:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:api-security

  fuzzing:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:fuzz

  owasp:
    runs-on: ubuntu-latest
    steps:
      - uses: zaproxy/action-full-scan@v0.12
        with:
          target: https://staging.nba.com
```

---

## Appendice A: Commandes de test

```bash
# Lancer tous les tests de securite
pnpm vitest run src/lib/security/ src/lib/audit/

# Lancer avec couverture
pnpm vitest run --coverage src/lib/security/

# Lancer un fichier specifique
pnpm vitest run src/lib/security/risk-engine.test.ts

# Mode watch
pnpm vitest src/lib/security/

# Lancer tests d'integration (avec services)
pnpm vitest run --config vitest.integration.ts

# Linter securite
pnpm eslint src/lib/security/ --rules-dir security-rules

# Audit dependances
pnpm audit
pnpm sbom

# Scan OWASP ZAP
docker run -t owasp/zap2docker-weekly zap-full-scan.py \
  -t https://staging.nba.com -r zap-report.html
```

## Appendice B: Checklist pre-deploiement securite

- [ ] Tous les tests unitaires security passent
- [ ] Couverture security >= 85%
- [ ] Aucune vulnerabilite OWASP Top 10 critique
- [ ] npm audit: 0 critical, 0 high
- [ ] Headers de securite verifies (CSP, HSTS, XFO, etc.)
- [ ] Rate limiting configure et teste
- [ ] Logs d'audit actifs et verifies
- [ ] Session management valide (expire, refresh, revoke)
- [ ] 2FA operationnel
- [ ] Device trust operationnel
- [ ] WebSocket auth et rate limiting actifs
- [ ] Redis ACL configure
- [ ] PostgreSQL RLS applique
- [ ] BullMQ auth configure
- [ ] MinIO bucket policies limitees
- [ ] Cloudflare WAF actif
- [ ] Traefik TLS 1.3+

## Appendice C: Definitions

| Terme | Definition |
|-------|-----------|
| UT | Unit Test -- test isole d'une fonction/classe |
| IT | Integration Test -- test avec interactions reelles entre composants |
| E2E | End-to-End Test -- test du flux complet utilisateur |
| FUZZ | Fuzzing Test -- test avec entrees aleatoires/malformees |
| PT | Penetration Test -- test d'intrusion simulant un attaquant |
| OWASP | Open Web Application Security Project -- Top 10 vulnerabilites web |
| IDOR | Insecure Direct Object Reference |
| CSRF | Cross-Site Request Forgery |
| XSS | Cross-Site Scripting |
| SSRF | Server-Side Request Forgery |
| TOCTOU | Time-of-Check Time-of-Use |
| CSP | Content Security Policy |
| HSTS | HTTP Strict Transport Security |
| RLS | Row-Level Security |
| DLQ | Dead Letter Queue |
