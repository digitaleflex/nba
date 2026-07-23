# MASTER SECURITY EVENTS

> Catalogue exhaustif des evenements de securite pour la plateforme NBA.
> Stack: Next.js 16, Better Auth 1.6.20, Prisma 7, PostgreSQL (Neon), Redis/Valkey, Socket.IO 4.8, BullMQ, MinIO/S3, imgproxy, Traefik, Cloudflare, Docker, PM2

---

## Table des Matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Events d'authentification](#2-events-dauthentification)
3. [Events de session](#3-events-de-session)
4. [Events de device](#4-events-de-device)
5. [Events de risque](#5-events-de-risque)
6. [Events d'administration](#6-events-dadministration)
7. [Events de donnees](#7-events-de-donnees)
8. [Events d'infrastructure](#8-events-dinfrastructure)
9. [Events de communication](#9-events-de-communication)
10. [Events de fraude](#10-events-de-fraude)
11. [Schema Prisma](#11-schema-prisma)
12. [Regles d'alerte](#12-regles-dalerte)
13. [Retention et archivage](#13-retention-et-archivage)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Ce document definit le catalogue complet des evenements de securite, leur structure, leurs regles d'alerte et leur gestion dans le cycle de vie de la plateforme NBA.

### 1.2 Prisma Schema (securityEvent)

```prisma
model SecurityEvent {
  id         String            @id @default(cuid())
  userId     String
  user       User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type       SecurityEventType
  severity   SecuritySeverity
  details    Json              @default("{}")
  ipAddress  String?
  userAgent  String?
  deviceId   String?
  sessionId  String?
  country    String?
  city       String?
  latitude   Float?
  longitude  Float?
  riskScore  Int               @default(0)
  createdAt  DateTime          @default(now())
}

enum SecurityEventType {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGIN_NEW_DEVICE
  LOGIN_NEW_LOCATION
  LOGIN_SUSPICIOUS_IP
  LOGIN_BLOCKED
  LOGOUT
  SESSION_CREATED
  SESSION_REVOKED
  SESSION_EXPIRED
  SESSION_HIJACK_DETECTED
  DEVICE_REGISTERED
  DEVICE_VERIFIED
  DEVICE_TRUSTED
  DEVICE_BLOCKED
  DEVICE_SUSPICIOUS
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  TWO_FACTOR_FAILED
  TWO_FACTOR_RECOVERY_USED
  PASSWORD_CHANGED
  PASSWORD_RESET
  PASSWORD_RESET_FAILED
  EMAIL_VERIFIED
  EMAIL_CHANGED
  ACCOUNT_SUSPENDED
  ACCOUNT_REACTIVATED
  ACCOUNT_DELETED
  ACCOUNT_LOCKED
  RISK_SCORE_CHANGED
  IMPOSSIBLE_TRAVEL_DETECTED
  RATE_LIMIT_EXCEEDED
  API_KEY_CREATED
  API_KEY_REVOKED
  ADMIN_ACTION
  ROLE_CHANGED
  PERMISSION_CHANGED
  DATA_EXPORT
  DATA_DELETION_REQUEST
  DATA_DELETION_COMPLETED
  KYC_SUBMITTED
  KYC_APPROVED
  KYC_REJECTED
  BROKER_VERIFIED
  SUBSCRIPTION_CHANGED
  SECURITY_ALERT
  SECURITY_POLICY_CHANGED
  IP_REPUTATION_CHANGED
  DEVICE_FINGERPRINT_CHANGED
}

enum SecuritySeverity {
  INFO
  WARNING
  HIGH
  CRITICAL
}
```

---

## 2. Events d'authentification

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| LOGIN_SUCCESS | Connexion reussie | INFO | ipAddress, userAgent, country, deviceId | Aucune |
| LOGIN_FAILED | Echec de connexion | WARNING | ipAddress, userAgent, reason (wrong_password, account_locked) | Surveillance si repetitif |
| LOGIN_NEW_DEVICE | Connexion depuis un nouvel appareil | INFO | deviceId, deviceName, browser, os | Notification email utilisateur |
| LOGIN_NEW_LOCATION | Connexion depuis un nouveau pays | INFO | country, city, ipAddress | Notification email utilisateur |
| LOGIN_SUSPICIOUS_IP | Connexion depuis IP suspecte (VPN/Tor/datacenter) | HIGH | ipAddress, isVPN, isTor, isProxy, riskScore | Challenge 2FA + notification |
| LOGIN_BLOCKED | Connexion bloquee (rate limit, IP blacklist) | HIGH | ipAddress, reason, blockedUntil | Alerte equipe securite |
| LOGOUT | Deconnexion utilisateur | INFO | sessionId, method (manual, timeout, revoke) | Aucune |

## 3. Events de session

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| SESSION_CREATED | Nouvelle session apres login | INFO | sessionId, deviceId, expiresAt | Aucune |
| SESSION_REVOKED | Session revoquee (utilisateur/admin) | WARNING | sessionId, revokedBy (userId/admin), reason | Aucune |
| SESSION_EXPIRED | Session expiree naturellement | INFO | sessionId, duration | Aucune |
| SESSION_HIJACK_DETECTED | Impossible travel ou IP mismatch | CRITICAL | sessionId, originalIp, newIp, distanceKm | Revoke session + alerte utilisateur |

## 4. Events de device

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| DEVICE_REGISTERED | Nouvel appareil enregistre | INFO | deviceId, fingerprint, browser, os | Aucune |
| DEVICE_VERIFIED | Appareil verifie par email | INFO | deviceId, method (email_code) | Aucune |
| DEVICE_TRUSTED | Appareil passe en confiance | INFO | deviceId, optIn, previousTrustLevel | Aucune |
| DEVICE_BLOCKED | Appareil bloque (trop d'echecs) | HIGH | deviceId, reason, failedAttempts | Alerte utilisateur |
| DEVICE_SUSPICIOUS | Appareil marque suspect | WARNING | deviceId, reason (flags IP, fingerprint mismatch) | Surveillance |
| DEVICE_FINGERPRINT_CHANGED | Changement d'empreinte appareil | WARNING | deviceId, oldFingerprint, newFingerprint | Verification |

## 5. Events de risque

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| RISK_SCORE_CHANGED | Score de risque modifie | Variable | oldScore, newScore, factors, sessionId | Si HIGH/CRITICAL => action |
| IMPOSSIBLE_TRAVEL_DETECTED | Voyage impossible detecte | HIGH/CRITICAL | distanceKm, timeDeltaMinutes, fromCountry, toCountry, fromIp | Si > 3 => suspension compte |
| RATE_LIMIT_EXCEEDED | Rate limit depasse | WARNING | ipAddress, endpoint, count, window | Si repetitif => blacklist IP |
| IP_REPUTATION_CHANGED | Reputation IP mise a jour | INFO | ipAddress, oldReputation, newReputation | Aucune |

## 6. Events d'administration

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| ADMIN_ACTION | Action administrateur | INFO | adminId, action, resourceType, resourceId | Audit trail |
| ROLE_CHANGED | Changement de role utilisateur | HIGH | userId, oldRole, newRole, changedBy | Verification |
| PERMISSION_CHANGED | Changement de permission | HIGH | userId, permission, granted/revoked, changedBy | Verification |
| ACCOUNT_SUSPENDED | Compte suspendu | CRITICAL | userId, reason, suspendedBy (system/admin) | Notification utilisateur |
| ACCOUNT_REACTIVATED | Compte reactive | INFO | userId, reactivatedBy | Aucune |
| ACCOUNT_LOCKED | Compte verrouille (trop d'echecs) | HIGH | userId, reason, lockedUntil | Notification utilisateur |
| ACCOUNT_DELETED | Compte supprime | CRITICAL | userId, requestMethod (user/admin), deletedAt | Retention donnees |
| SECURITY_POLICY_CHANGED | Politique securite modifiee | HIGH | userId, changedFields, changedBy | Notification |

## 7. Events de donnees

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| DATA_EXPORT | Export de donnees utilisateur | WARNING | userId, exportType (all/profile/trades), ipAddress | Verification |
| DATA_DELETION_REQUEST | Demande de suppression (RGPD) | INFO | userId, requestDate, scheduledDeletionDate | Traitement dans les 30 jours |
| DATA_DELETION_COMPLETED | Suppression effectuee | INFO | userId, deletedAt, retainedData | Aucune |
| KYC_SUBMITTED | Document KYC soumis | INFO | userId, documentType, documentId | Verification manuelle |
| KYC_APPROVED | KYC approuve | INFO | userId, verifiedBy (system/admin) | Aucune |
| KYC_REJECTED | KYC rejete | WARNING | userId, reason, rejectedBy | Notification utilisateur |
| BROKER_VERIFIED | Broker verifie | INFO | userId, brokerName | Aucune |

## 8. Events d'infrastructure

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| API_KEY_CREATED | Nouvelle cle API generee | INFO | keyPrefix, createdBy, permissions | Aucune |
| API_KEY_REVOKED | Cle API revoquee | WARNING | keyPrefix, revokedBy, reason | Aucune |
| SUBSCRIPTION_CHANGED | Changement abonnement | INFO | userId, oldPlan, newPlan, changedBy | Aucune |

## 9. Events de communication

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| TWO_FACTOR_ENABLED | 2FA active | INFO | method (totp/email), userId | Notification email |
| TWO_FACTOR_DISABLED | 2FA desactivee | HIGH | method, userId, ipAddress | Notification email |
| TWO_FACTOR_FAILED | Echec 2FA | WARNING | method, userId, ipAddress | Surveillance |
| TWO_FACTOR_RECOVERY_USED | Code de recuperation utilise | HIGH | userId, ipAddress | Notification email |
| PASSWORD_CHANGED | Mot de passe modifie | INFO | userId, method (manual/forced) | Notification email |
| PASSWORD_RESET | Reset de mot de passe reussi | INFO | userId, method (email_link) | Aucune |
| PASSWORD_RESET_FAILED | Echec de reset | WARNING | userId, reason, ipAddress | Surveillance |
| EMAIL_VERIFIED | Email verifie | INFO | userId | Aucune |
| EMAIL_CHANGED | Email modifie | HIGH | userId, oldEmail, newEmail | Notification ancien email |

---

## 10. Events de fraude

| Event | Declencheur | Severite | Details | Action attendue |
|-------|------------|----------|---------|-----------------|
| FRAUD_ACCOUNT_SHARING | Part de compte detecte (2+ IPs/pays simultanes) | HIGH | userId, activeSessions, ips, countries | Avertissement + limitation |
| FRAUD_SYNC_SUSPICIOUS | Activite de synchronisation anormale | WARNING | userId, deviceCount, syncFrequency | Verification manuelle |
| FRAUD_KYC_MISMATCH | Discordance documents KYC | HIGH | userId, documentType, mismatchReason | Rejet KYC + flag |
| FRAUD_BROKER_SPOOFING | Courtier usurpe identite | CRITICAL | userId, brokerName, ipAddress | Blocage + alerte CSIRT |
| FRAUD_PAYMENT_ANOMALY | Paiement anormal (montant, frequence) | HIGH | userId, amount, frequency, method | Verification paiement |
| FRAUD_REFERRAL_ABUSE | Abus de parrainage | WARNING | userId, referredUsers, pattern | Annulation parrainages |
| FRAUD_SIGNAL_MANIPULATION | Manipulation de signaux (volume) | HIGH | userId, signalCount, pattern | Suspension compte |
| FRAUD_BOT_DETECTED | Comportement bot detecte | HIGH | userId, score, indicators | Challenge + verification |

## 11. Schema Prisma

### 11.1 Structure de la table

Le schema Prisma pour `SecurityEvent` est defini dans `prisma/schema.prisma` :

```prisma
enum SecurityEventType {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGIN_NEW_DEVICE
  LOGIN_NEW_LOCATION
  LOGIN_SUSPICIOUS_IP
  LOGIN_BLOCKED
  LOGOUT
  SESSION_CREATED
  SESSION_REVOKED
  SESSION_EXPIRED
  SESSION_HIJACK_DETECTED
  DEVICE_REGISTERED
  DEVICE_VERIFIED
  DEVICE_TRUSTED
  DEVICE_BLOCKED
  DEVICE_SUSPICIOUS
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  TWO_FACTOR_FAILED
  TWO_FACTOR_RECOVERY_USED
  PASSWORD_CHANGED
  PASSWORD_RESET
  PASSWORD_RESET_FAILED
  EMAIL_VERIFIED
  EMAIL_CHANGED
  ACCOUNT_SUSPENDED
  ACCOUNT_REACTIVATED
  ACCOUNT_DELETED
  ACCOUNT_LOCKED
  RISK_SCORE_CHANGED
  IMPOSSIBLE_TRAVEL_DETECTED
  RATE_LIMIT_EXCEEDED
  API_KEY_CREATED
  API_KEY_REVOKED
  ADMIN_ACTION
  ROLE_CHANGED
  PERMISSION_CHANGED
  DATA_EXPORT
  DATA_DELETION_REQUEST
  DATA_DELETION_COMPLETED
  KYC_SUBMITTED
  KYC_APPROVED
  KYC_REJECTED
  BROKER_VERIFIED
  SUBSCRIPTION_CHANGED
  SECURITY_ALERT
  SECURITY_POLICY_CHANGED
  IP_REPUTATION_CHANGED
  DEVICE_FINGERPRINT_CHANGED
  FRAUD_ACCOUNT_SHARING
  FRAUD_SYNC_SUSPICIOUS
  FRAUD_KYC_MISMATCH
  FRAUD_BROKER_SPOOFING
  FRAUD_PAYMENT_ANOMALY
  FRAUD_REFERRAL_ABUSE
  FRAUD_SIGNAL_MANIPULATION
  FRAUD_BOT_DETECTED
}

enum SecuritySeverity {
  INFO
  WARNING
  HIGH
  CRITICAL
}

model SecurityEvent {
  id         String            @id @default(cuid())
  userId     String
  user       User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type       SecurityEventType
  severity   SecuritySeverity
  details    Json              @default("{}")
  ipAddress  String?
  userAgent  String?
  deviceId   String?
  sessionId  String?
  country    String?
  city       String?
  latitude   Float?
  longitude  Float?
  riskScore  Int               @default(0)
  createdAt  DateTime          @default(now())

  @@index([userId, type, createdAt(sort: Desc)])
  @@index([severity, type, createdAt(sort: Desc)])
  @@index([ipAddress])
  @@map("security_events")
}
```

### 11.2 Relations

- `userId` -> `User.id` (Cascade delete)
- `deviceId` -> `Device.id` (optionnel)
- `sessionId` -> `Session.id` (optionnel)

### 11.3 Creation via Event Bus

```typescript
import { securityEventBus } from "./security-event-bus"

await securityEventBus.emit({
  userId: "user-123",
  type: "LOGIN_SUSPICIOUS_IP",
  severity: "HIGH",
  ipAddress: "1.2.3.4",
  deviceId: "device-456",
  sessionId: "session-789",
  country: "RU",
  riskScore: 85,
  details: {
    isVPN: true,
    isTor: false,
    asn: 20473,
  },
})
```

---

## 12. Regles d'alerte

### 12.1 Alertes immediates (P0/P1)

| Regle | Condition | Action | Canal |
|-------|-----------|--------|-------|
| SESSION_HIJACK_DETECTED | Event type = SESSION_HIJACK_DETECTED | Alerte CSIRT + revoke session | Slack #security-incidents + email |
| IMPOSSIBLE_TRAVEL > 3 | 3+ IMPOSSIBLE_TRAVEL_DETECTED en 1h | Suspendre compte + alerte CSIRT | Slack #security-incidents |
| LOGIN_BLOCKED repeat | 10+ LOGIN_BLOCKED en 5min | Blacklist IP + alerte CSIRT | Slack #security-incidents |
| ACCOUNT_SUSPENDED by admin | Event type = ACCOUNT_SUSPENDED | Audit trail + notification | Slack #security-audit |
| ACCOUNT_DELETED | Event type = ACCOUNT_DELETED | Retention + audit | Slack #security-audit |

### 12.2 Alertes differees (P2)

| Regle | Condition | Action | Fenetre |
|-------|-----------|--------|---------|
| Brute force | 5+ LOGIN_FAILED en 1min par user | Temporisation compte | 1h |
| Rate limit IP | 50+ RATE_LIMIT_EXCEEDED en 1h par IP | Blacklist temporaire | 24h |
| LOGIN_NEW_DEVICE + VPN | LOGIN_SUSPICIOUS_IP + LOGIN_NEW_DEVICE meme connexion | Challenge 2FA + email | Immediate |
| KYC_REJECTED repeat | 3+ KYC_REJECTED en 24h par user | Bloquer KYC + flag fraude | 24h |

### 12.3 Rapports quotidiens

| Rapport | Contenu | Destinataires |
|---------|---------|---------------|
| Security Daily | Resume events HIGH+ des dernieres 24h | CSIRT, CTO |
| Login Anomalies | LOGIN_NEW_DEVICE, LOGIN_NEW_LOCATION, IMPOSSIBLE_TRAVEL | SecOps |
| Rate Limit Report | Top IPs bloquees, endpoints cibles | SRE |
| Admin Actions Report | ADMIN_ACTION, ROLE_CHANGED, PERMISSION_CHANGED | CTO, Audit |

### 12.4 Regles de correlation

| Regle | Fenetre | Seuil | Action |
|-------|---------|-------|--------|
| LOGIN_FAILED + IP reputee | 5min | 3+ | Bloquer IP + alert |
| LOGIN_FAILED + NEW_DEVICE | 1min | 1+ | Suspendre compte |
| PASSWORD_RESET_FAILED + LOGIN_FAILED | 10min | 3+ | Bloquer IP |
| IMPOSSIBLE_TRAVEL + LOGIN_FAILED | 1min | 1+ | CRITICAL alerte |
| API_KEY_CREATED + role change | 5min | 1+ | Verification |
| DATA_EXPORT + LOGIN_NEW_LOCATION | 5min | 1+ | CRITICAL alerte |

---

## 13. Retention et archivage

### 13.1 Durees de retention

| Type d'event | Retention active | Archivage | Destruction |
|-------------|-----------------|-----------|-------------|
| INFO | 90 jours | 1 an | Apres 1 an |
| WARNING | 180 jours | 2 ans | Apres 2 ans |
| HIGH | 1 an | 5 ans | Apres 5 ans |
| CRITICAL | 2 ans | 10 ans | Apres 10 ans |
| ADMIN_ACTION | 5 ans | 10 ans | Apres 10 ans |

### 13.2 Archivage

- Les events sont archives dans MinIO/S3 au format Parquet compresse
- L'index est stocke dans PostgreSQL (table security_events_archive)
- La compression permet ~90% de reduction de taille
- L'acces aux archives se fait via une API restreinte (role admin)

### 13.3 Indexation

```sql
-- Index pour requetes frequentes
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX idx_security_events_user_type ON security_events(user_id, type, created_at DESC);
CREATE INDEX idx_security_events_severity_type ON security_events(severity, type, created_at DESC);
```
