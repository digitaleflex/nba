# Systeme de Confiance des Appareils — MASTER_DEVICE_TRUST.md

> **Document d'Architecture** — Version 1.0.0  
> **Classification** : Interne — Confidentiel  
> **Derniere mise a jour** : 2026-07-22  
> **Extension de** : `MASTER_ZERO_TRUST_SECURITY.md` §Device Trust, `MASTER_FRAUD_ENGINE.md` §10

---

## Table des Matieres

1. [Executive Summary](#1-executive-summary)
2. [Architecture du Device Trust](#2-architecture-du-device-trust)
3. [Machine a Etats de Confiance](#3-machine-a-etats-de-confiance)
4. [Fingerprinting Avance](#4-fingerprinting-avance)
5. [Device Scoring Engine](#5-device-scoring-engine)
6. [Reputation & Historique](#6-reputation--historique)
7. [Appareils de Confiance](#7-appareils-de-confiance)
8. [Revocation & Quarantaine](#8-revocation--quarantaine)
9. [Synchronisation Multi-Appareils](#9-synchronisation-multi-appareils)
10. [Detection de Partage](#10-detection-de-partage)
11. [API & Integration](#11-api--integration)
12. [Schema Prisma](#12-schema-prisma)
13. [Metriques & Observabilite](#13-metriques--observabilite)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Vision

Le Systeme de Confiance des Appareils (Device Trust) est le pilier central de l'architecture Zero Trust de la plateforme NBA. Chaque appareil qui accede a la plateforme est identifie, profile, score, et classe dans un niveau de confiance. Ce systeme permet de :

- **Identifier** chaque appareil de maniere unique (fingerprinting multi-signal)
- **Evaluer** la confiance en temps reel (Device Trust Score)
- **Bloquer** les appareils suspects ou compromis
- **Detecter** le partage de compte via la diversite d'appareils
- **Automatiser** les reponses (2FA challenge, blocage, notification)

### 1.2 Principes Fondamentaux

| Principe | Description |
|----------|-------------|
| **Identification Unique** | Chaque appareil a une empreinte unique et infalsifiable |
| **Confiance Progressive** | La confiance se gagne avec le temps et les verifications |
| **Zero Trust** | Tout appareil inconnu est suspect par defaut |
| **Contextualisation** | Le score tient compte du contexte (IP, geo, horaire) |
| **Privacy by Design** | Aucune donnee personnelle dans le fingerprint |

### 1.3 Score de Maturite

| Domaine | Actuel | Cible | Ecart |
|---------|:------:|:-----:|:-----:|
| Fingerprinting basique (IP+UA) | 4/5 | 5/5 | -1 |
| Fingerprinting avance (canvas, webgl) | 2/5 | 5/5 | -3 |
| Device Trust Score | 1/5 | 5/5 | -4 |
| Machine a etats | 2/5 | 5/5 | -3 |
| Detection de partage | 1/5 | 5/5 | -4 |
| Quarantaine automatique | 0/5 | 4/5 | -4 |
| Synchronisation multi-appareils | 1/5 | 4/5 | -3 |
| **Moyenne** | **1.6/5** | **4.7/5** | **-3.1** |

---

## 2. Architecture du Device Trust

### 2.1 Diagramme des Composants

```
+----------------------------------------------------------------------+
|                          CLIENT LAYER                                |
|  Web App (JS) | Mobile PWA | API Clients                             |
|  +-------------------------------------------------------------+    |
|  | DeviceFingerprinter                                         |    |
|  | - collectSignals() -> navigateur                            |    |
|  | - canvas fingerprint                                        |    |
|  | - webgl fingerprint                                         |    |
|  | - audio fingerprint                                         |    |
|  | - fonts fingerprint                                         |    |
|  | - compute hash SHA-256                                      |    |
|  +-------------------------------------------------------------+    |
+--------------------------------------+-------------------------------+
                                       |
                           Header: x-device-fingerprint
                                       |
+--------------------------------------v-------------------------------+
|                          API GATEWAY                                 |
|  Rate Limiter | IP Check | Header Validation                         |
+--------------------------------------+-------------------------------+
                                       |
+--------------------------------------v-------------------------------+
|                     DEVICE TRUST MANAGER                             |
|  +-------------------------------------------------------------+    |
|  | DeviceTrustManager                                         |    |
|  |  - getTrustLevel(deviceId) -> TRUSTED/VERIFIED/...         |    |
|  |  - evaluate(context) -> DeviceTrustResult                  |    |
|  |  - updateTrust(deviceId, action) -> void                   |    |
|  +-------------------------------------------------------------+    |
|  +------------------+  +------------------+  +------------------+    |
|  | FINGERPRINT      |  | SCORING ENGINE   |  | STATE MACHINE    |    |
|  | Service          |  | 15+ facteurs     |  | 9 etats          |    |
|  | Hash verification|  | Poids adaptatifs |  | 14 transitions   |    |
|  | Anti-tampering   |  | Seuils dynamiques|  | Actions auto     |    |
|  +------------------+  +------------------+  +------------------+    |
|  +------------------+  +------------------+  +------------------+    |
|  | REPUTATION       |  | QUARANTINE       |  | SHARING          |    |
|  | Historique 90j   |  | Isolation auto   |  | Detection        |    |
|  | Score cumule     |  | Investigation    |  | Cross-user FP    |    |
|  | Trend analysis   |  | Auto-resolve     |  | Device diversity |    |
|  +------------------+  +------------------+  +------------------+    |
+--------------------------------------+-------------------------------+
                                       |
+--------------------------------------v-------------------------------+
|                          DATA LAYER                                 |
|  PostgreSQL: devices, device_verifications, device_history           |
|  Redis: fingerprint cache, device_score cache, quarantine           |
+----------------------------------------------------------------------+
```

### 2.2 Flux de Decision Complet

```
Requete entrante avec fingerprint
    |
    v
+---------------------------+
| 1. FINGERPRINT VALIDATION  |
| Hash valide?               |
| Timestamp recent?          |
| Anti-tampering?            |
+------+--------------------+
       | Invalide
       v
+---------------------------+     +-----------+
| 2. DEVICE LOOKUP          |     | BLOCK     |
| Existe en base?           |---->| + audit   |
+------+--------------------+     +-----------+
       | Nouveau
       v
+---------------------------+
| 3. CONTEXT EVALUATION     |
| IP reputation             |
| Geo location              |
| Heure / jour              |
| User-Agent coherence      |
| Velocity (nouv. appareils)|
+------+--------------------+
       |
       v
+---------------------------+
| 4. SCORING                |
| Device Age (0-15)         |
| Trust History (0-25)      |
| Verification (0-20)       |
| Context Anomaly (0-20)    |
| Reputation (0-20)         |
| = Trust Score (0-100)     |
+------+--------------------+
       |
       v
+---------------------------+
| 5. DECISION               |
| Score 80-100: ALLOW       |
| Score 60-79: MONITOR      |
| Score 40-59: CHALLENGE    |
| Score 20-39: RESTRICT     |
| Score 0-19: BLOCK         |
+------+--------------------+
       |
       v
+---------------------------+
| 6. STATE TRANSITION       |
| Mise a jour trustLevel    |
| Si baisse -> alerte       |
| Si nouveau -> verification |
| Si suspect -> quarantine   |
+---------------------------+
```

---

## 3. Machine a Etats de Confiance

### 3.1 Diagramme de la Machine a Etats

```
                        +------------------+
                        |    UNREGISTERED   |
                        |  (nouvel appareil) |
                        +--------+---------+
                                 | register
                                 v
                    +-----------------------+
          +-------->|      PENDING          |
          |         | (en attente de verif) |
          |         +-----------+-----------+
          |                     | verify email
          |                     v
          |         +-----------------------+
          |         |     VERIFIED          |
          |         | (email verify ok)     |
          |         +-----------+-----------+
          |                     | trust user
          |                     v
          |         +-----------------------+
          |         |      TRUSTED          |
          |         | (2FA bypass 30j)     |
          |         +-----------+-----------+
          |                     | anomaly
          |                     v
          |  +-----------------------------+
          |  |         SUSPICIOUS          |
          |  | (anomalie detectee)         |
          |  +-------------+---------------+
          |                | severity
          |                v
          |  +-----------------------------+
          |  |        QUARANTINED          |
          |  | (isole pour investigation)  |
          |  +-------------+---------------+
          |                | confirmed
          |                v
          |  +-----------------------------+
          |  |         BLOCKED             |
          |  | (appareil compromis)        |
          |  +-----------------------------+
          |
          +---- (si age > 90j sans usage) ---> ARCHIVED
                                                    |
                                                    v
                                              (peut etre re-registered)
```

### 3.2 Transitions Detaillees

| ID | From | To | Declencheur | Validation | Action |
|----|------|----|-------------|------------|--------|
| T1 | UNREGISTERED | PENDING | 1ere connexion | Fingerprint valide | Register device, email verification |
| T2 | PENDING | VERIFIED | Code email valide | Code 6 chiffres < 10min | trustLevel=VERIFIED |
| T3 | PENDING | BLOCKED | 3 echecs verification | Tentatives > 3 | Block device, notifier user |
| T4 | VERIFIED | TRUSTED | 7 jours sans anomalie | Score > 80, 7j d'age | trustLevel=TRUSTED, trustedUntil=+30j |
| T5 | TRUSTED | VERIFIED | Expiration trust (30j) | Date > trustedUntil | trustLevel=VERIFIED |
| T6 | TRUSTED | SUSPICIOUS | Anomalie (IP, geo, UA) | Score < 60 | Flag, notifier user |
| T7 | VERIFIED | SUSPICIOUS | Anomalie | Score < 60 | Flag, notifier user |
| T8 | SUSPICIOUS | VERIFIED | Verification reussie | 2FA verify ou email | trustLevel=VERIFIED |
| T9 | SUSPICIOUS | QUARANTINED | Anomalie confirmee | Score < 30, 2+ anomalies en 24h | Isolation, alerte admin |
| T10 | QUARANTINED | BLOCKED | Confirmation fraude | Revue admin | Block definitif |
| T11 | QUARANTINED | VERIFIED | Investigation close | Revue admin + 2FA | trustLevel=VERIFIED |
| T12 | ANY | ARCHIVED | Inactivite > 90 jours | lastSeenAt > 90j | Archive, purge si > 1 an |
| T13 | BLOCKED | ARCHIVED | Cleanup 1 an | Date blocage > 1 an | Purge |
| T14 | ANY | BLOCKED | Admin action | Requete admin | Block immediat |

### 3.3 Implementation

```typescript
// src/lib/security/device-trust-state-machine.ts

export enum DeviceTrustState {
  UNREGISTERED = 'UNREGISTERED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  TRUSTED = 'TRUSTED',
  SUSPICIOUS = 'SUSPICIOUS',
  QUARANTINED = 'QUARANTINED',
  BLOCKED = 'BLOCKED',
  ARCHIVED = 'ARCHIVED',
}

export enum DeviceTrustTransition {
  REGISTER = 'REGISTER',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  VERIFY_FAILED = 'VERIFY_FAILED',
  GAIN_TRUST = 'GAIN_TRUST',
  TRUST_EXPIRED = 'TRUST_EXPIRED',
  ANOMALY = 'ANOMALY',
  CONFIRM_ANOMALY = 'CONFIRM_ANOMALY',
  CLEAR_ANOMALY = 'CLEAR_ANOMALY',
  ADMIN_BLOCK = 'ADMIN_BLOCK',
  ADMIN_UNQUARANTINE = 'ADMIN_UNQUARANTINE',
  INACTIVITY = 'INACTIVITY',
  CLEANUP = 'CLEANUP',
}

const transitions: Record<DeviceTrustState, Partial<Record<DeviceTrustTransition, DeviceTrustState>>> = {
  [DeviceTrustState.UNREGISTERED]: {
    [DeviceTrustTransition.REGISTER]: DeviceTrustState.PENDING,
  },
  [DeviceTrustState.PENDING]: {
    [DeviceTrustTransition.VERIFY_EMAIL]: DeviceTrustState.VERIFIED,
    [DeviceTrustTransition.VERIFY_FAILED]: DeviceTrustState.BLOCKED,
    [DeviceTrustTransition.ADMIN_BLOCK]: DeviceTrustState.BLOCKED,
    [DeviceTrustTransition.INACTIVITY]: DeviceTrustState.ARCHIVED,
  },
  [DeviceTrustState.VERIFIED]: {
    [DeviceTrustTransition.GAIN_TRUST]: DeviceTrustState.TRUSTED,
    [DeviceTrustTransition.TRUST_EXPIRED]: DeviceTrustState.VERIFIED,
    [DeviceTrustTransition.ANOMALY]: DeviceTrustState.SUSPICIOUS,
    [DeviceTrustTransition.ADMIN_BLOCK]: DeviceTrustState.BLOCKED,
    [DeviceTrustTransition.INACTIVITY]: DeviceTrustState.ARCHIVED,
  },
  [DeviceTrustState.TRUSTED]: {
    [DeviceTrustTransition.TRUST_EXPIRED]: DeviceTrustState.VERIFIED,
    [DeviceTrustTransition.ANOMALY]: DeviceTrustState.SUSPICIOUS,
    [DeviceTrustTransition.ADMIN_BLOCK]: DeviceTrustState.BLOCKED,
    [DeviceTrustTransition.INACTIVITY]: DeviceTrustState.ARCHIVED,
  },
  [DeviceTrustState.SUSPICIOUS]: {
    [DeviceTrustTransition.CLEAR_ANOMALY]: DeviceTrustState.VERIFIED,
    [DeviceTrustTransition.CONFIRM_ANOMALY]: DeviceTrustState.QUARANTINED,
    [DeviceTrustTransition.ADMIN_BLOCK]: DeviceTrustState.BLOCKED,
    [DeviceTrustTransition.INACTIVITY]: DeviceTrustState.ARCHIVED,
  },
  [DeviceTrustState.QUARANTINED]: {
    [DeviceTrustTransition.ADMIN_UNQUARANTINE]: DeviceTrustState.VERIFIED,
    [DeviceTrustTransition.ADMIN_BLOCK]: DeviceTrustState.BLOCKED,
  },
  [DeviceTrustState.BLOCKED]: {
    [DeviceTrustTransition.CLEANUP]: DeviceTrustState.ARCHIVED,
  },
  [DeviceTrustState.ARCHIVED]: {},
}

export function transitionDeviceState(
  current: DeviceTrustState,
  transition: DeviceTrustTransition,
): DeviceTrustState {
  const next = transitions[current]?.[transition]
  if (!next) {
    throw new Error(`Transition ${transition} impossible depuis l'etat ${current}`)
  }
  return next
}
```

---

## 4. Fingerprinting Avance

### 4.1 Signaux Collectes

| ID | Signal | Source | Stabilite | Infalsifiable | Poids |
|----|--------|--------|:---------:|:-------------:|:-----:|
| FP01 | User-Agent | Header HTTP | Haute | Non | 5 |
| FP02 | Accept-Language | Header HTTP | Haute | Non | 3 |
| FP03 | Platform (Sec-CH-UA-Platform) | Header HTTP | Haute | Non | 4 |
| FP04 | Resolution ecran | JS (screen) | Moyenne | Non | 4 |
| FP05 | Color Depth | JS (screen) | Haute | Non | 2 |
| FP06 | Timezone | JS (Intl) | Haute | Non | 6 |
| FP07 | Timezone Offset | JS (Date) | Haute | Non | 5 |
| FP08 | Hardware Concurrency | JS (navigator) | Haute | Non | 4 |
| FP09 | Device Memory | JS (navigator) | Haute | Non | 4 |
| FP10 | Touch Support | JS (ontouchstart) | Haute | Non | 3 |
| FP11 | Pixel Ratio | JS (devicePixelRatio) | Haute | Non | 3 |
| FP12 | Canvas Fingerprint | JS (canvas 2D) | Haute | Oui | 9 |
| FP13 | WebGL Fingerprint | JS (webgl) | Haute | Oui | 9 |
| FP14 | Audio Fingerprint | JS (AudioContext) | Moyenne | Oui | 7 |
| FP15 | Fonts List | JS (measureText) | Moyenne | Partiel | 6 |
| FP16 | Vendor | JS (navigator.vendor) | Haute | Non | 2 |
| FP17 | Platform (JS) | JS (navigator.platform) | Haute | Non | 3 |
| FP18 | Cookies Enabled | JS (navigator.cookieEnabled) | Haute | Non | 1 |
| FP19 | Do Not Track | JS (navigator.doNotTrack) | Haute | Non | 1 |
| FP20 | Plugins | JS (navigator.plugins) | Moyenne | Non | 3 |
| FP21 | IP Address | Header (cf-connecting-ip) | Haute | Non | 7 |
| FP22 | ASN | MaxMind | Haute | Non | 3 |

### 4.2 Calcul du Fingerprint

```typescript
// src/lib/security/device-fingerprint-advanced.ts

export interface FingerprintSignals {
  // Headers HTTP (cote serveur)
  userAgent: string
  acceptLanguage: string
  platform: string

  // Signaux JS (cote client)
  screenResolution: string
  colorDepth: number
  timezone: string
  timezoneOffset: number
  hardwareConcurrency: number
  deviceMemory: number
  touchSupport: boolean
  pixelRatio: number
  canvasHash: string
  webglHash: string
  audioHash: string
  fontsHash: string
  vendor: string
  platformJS: string
  cookiesEnabled: boolean
  doNotTrack: string | null
  plugins: string

  // Meta-donnees
  collectedAt: number
  fingerprintVersion: string
}

export class AdvancedFingerprinter {
  private readonly pepper: string
  private readonly version = '2.0.0'

  constructor() {
    this.pepper = process.env.FINGERPRINT_PEPPER ?? crypto.randomBytes(32).toString('hex')
  }

  computeHash(signals: FingerprintSignals): string {
    // Les signaux a fort pouvoir discriminant (poids > 6)
    const strongSignals = {
      ua: signals.userAgent,
      canvas: signals.canvasHash,
      webgl: signals.webglHash,
      audio: signals.audioHash,
      fonts: signals.fontsHash,
      tz: signals.timezone,
      tzo: signals.timezoneOffset,
    }

    // Les signaux moyens
    const mediumSignals = {
      res: signals.screenResolution,
      cores: signals.hardwareConcurrency,
      mem: signals.deviceMemory,
      touch: signals.touchSupport,
      px: signals.pixelRatio,
      plat: signals.platformJS,
      vendor: signals.vendor,
    }

    // Combinaison ponderée
    const payload = JSON.stringify({
      strong: strongSignals,
      medium: mediumSignals,
      version: this.version,
    }) + this.pepper

    return crypto.createHash('sha256').update(payload).digest('hex')
  }

  // Verification anti-tampering
  verifyHash(signals: FingerprintSignals, expectedHash: string): boolean {
    const computed = this.computeHash(signals)
    if (computed !== expectedHash) return false

    // Verifier que le timestamp est recent (< 5s)
    const now = Date.now()
    if (Math.abs(now - signals.collectedAt) > 5000) return false

    // Verifier coherence User-Agent
    if (!this.validateUserAgent(signals.userAgent, signals.platformJS)) return false

    return true
  }

  private validateUserAgent(ua: string, platform: string): boolean {
    // Exemple: un UA Windows ne peut pas avoir platform "Linux"
    if (ua.includes('Windows') && platform === 'Linux') return false
    if (ua.includes('Mac') && platform === 'Win32') return false
    return true
  }
}
```

### 4.3 Client-Side Collector

```typescript
// src/lib/security/client-fingerprint-collector.ts

export class ClientFingerprintCollector {
  async collect(): Promise<FingerprintSignals> {
    const [canvasHash, webglHash, audioHash, fontsHash] = await Promise.all([
      this.canvasFP(),
      this.webglFP(),
      this.audioFP(),
      this.fontsFP(),
    ])

    return {
      userAgent: navigator.userAgent,
      acceptLanguage: navigator.language,
      platform: (navigator as any).platform ?? 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      touchSupport: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1,
      canvasHash,
      webglHash,
      audioHash,
      fontsHash,
      vendor: navigator.vendor,
      platformJS: (navigator as any).platform ?? '',
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: (navigator as any).doNotTrack ?? null,
      plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
      collectedAt: Date.now(),
      fingerprintVersion: '2.0.0',
    }
  }

  private canvasFP(): string {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('NBA Device Trust', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('FP v2', 4, 45)
    return this.hash(canvas.toDataURL())
  }

  private webglFP(): string {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) return 'no-webgl'
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      if (!ext) return 'no-extension'
      const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      return this.hash(`${vendor}:${renderer}`)
    } catch {
      return 'webgl-error'
    }
  }

  private audioFP(): string {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const analyser = ctx.createAnalyser()
      const gain = ctx.createGain()
      oscillator.type = 'triangle'
      oscillator.connect(analyser)
      analyser.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(0)
      ctx.close()
      return 'audio-available'
    } catch {
      return 'no-audio'
    }
  }

  private async fontsFP(): Promise<string> {
    const fonts = ['monospace', 'sans-serif', 'serif',
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
      'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Console',
      'Tahoma', 'Geneva', 'Segoe UI', 'Roboto']

    const baseWidths = this.measureFonts('monospace')
    const detected: string[] = []

    for (const font of fonts) {
      const w = this.measureFonts(font)
      if (Math.abs(w - baseWidths) > 0.5) {
        detected.push(font)
      }
    }

    return this.hash(detected.join(','))
  }

  private measureFonts(font: string): number {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.font = `72px ${font}, monospace`
    return ctx.measureText('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').width
  }

  private hash(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h).toString(36)
  }
}
```

---

## 5. Device Scoring Engine

### 5.1 Formules de Calcul

Le Device Trust Score (DTS) est calcule selon la formule suivante :

```
DTS = (Age × 0.15) + (History × 0.25) + (Verification × 0.20) 
    + (Context × 0.20) + (Reputation × 0.20)

Age Score = min(daysSinceRegistration / 90, 1) × 100 × 0.15

History Score = (goodEvents / totalEvents) × 100 × 0.25
    Penalties: -10 par evenement suspect, -25 par tentative de hijacking

Verification Score = selon niveau:
    TRUSTED: 100 × 0.20
    VERIFIED: 80 × 0.20
    PENDING: 40 × 0.20
    UNREGISTERED: 0 × 0.20

Context Score = max(0, 100 - penalties) × 0.20
    Penalties:
    - IP change depuis derniere connexion: -15
    - Geo change > 500km: -20
    - Horaire inhabituel: -10
    - VPN/TOR detecte: -25
    - Nouvel appareil (velocity): -15 * (count / 3)

Reputation Score = max(0, 100 - flags) × 0.20
    Flags:
    - Appareil signale par d'autres users: -30
    - IP blacklistee: -25
    - Fingerprint suspect (trop parfait): -20
    - Comportement automatisé: -15
```

### 5.2 Seuils de Decision

| Score | Niveau | Action | Description |
|:-----:|--------|--------|-------------|
| 80-100 | TRUSTED | ALLOW | Acces complet, 2FA skip |
| 60-79 | VERIFIED | ALLOW + MONITOR | Acces autorise, surveillance |
| 40-59 | PENDING | CHALLENGE 2FA | Verification requise |
| 20-39 | SUSPICIOUS | RESTRICT | Acces limite + notification |
| 0-19 | BLOCKED | BLOCK | Acces refuse |

### 5.3 Implementation

```typescript
// src/lib/security/device-scoring.ts

export interface DeviceContext {
  deviceId: string
  userId: string
  ipAddress: string
  userAgent: string
  country?: string
  latitude?: number
  longitude?: number
  loginHour: number
  isVPN: boolean
  isTOR: boolean
  isProxy: boolean
  daysSinceRegistration: number
  trustLevel: string
  historyEvents: Array<{ type: string; severity: string }>
  recentDevicesCount: number
  isSharedDevice: boolean
}

export class DeviceScoringEngine {
  async calculateScore(ctx: DeviceContext): Promise<{
    total: number
    level: string
    factors: Array<{ name: string; score: number; weight: number }>
  }> {
    const ageScore = this.calcAgeScore(ctx.daysSinceRegistration)
    const historyScore = this.calcHistoryScore(ctx.historyEvents)
    const verificationScore = this.calcVerificationScore(ctx.trustLevel)
    const contextScore = this.calcContextScore(ctx)
    const reputationScore = this.calcReputationScore(ctx)

    const total = Math.round(
      ageScore * 0.15 + historyScore * 0.25 + verificationScore * 0.20
      + contextScore * 0.20 + reputationScore * 0.20
    )

    const level = total >= 80 ? 'TRUSTED'
      : total >= 60 ? 'VERIFIED'
      : total >= 40 ? 'PENDING'
      : total >= 20 ? 'SUSPICIOUS'
      : 'BLOCKED'

    return {
      total,
      level,
      factors: [
        { name: 'age', score: ageScore, weight: 0.15 },
        { name: 'history', score: historyScore, weight: 0.25 },
        { name: 'verification', score: verificationScore, weight: 0.20 },
        { name: 'context', score: contextScore, weight: 0.20 },
        { name: 'reputation', score: reputationScore, weight: 0.20 },
      ],
    }
  }

  private calcAgeScore(days: number): number {
    return Math.min(days / 90, 1) * 100
  }

  private calcHistoryScore(events: DeviceContext['historyEvents']): number {
    if (events.length === 0) return 50
    const good = events.filter(e => e.severity === 'INFO').length
    const ratio = good / events.length
    let score = ratio * 100
    const penalties = events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length
    score -= penalties * 15
    return Math.max(0, Math.min(100, score))
  }

  private calcVerificationScore(level: string): number {
    const scores: Record<string, number> = {
      TRUSTED: 100,
      VERIFIED: 80,
      PENDING: 40,
      SUSPICIOUS: 20,
      BLOCKED: 0,
      UNREGISTERED: 0,
    }
    return scores[level] ?? 0
  }

  private calcContextScore(ctx: DeviceContext): number {
    let penalties = 0
    if (ctx.isVPN) penalties += 25
    if (ctx.isTOR) penalties += 30
    if (ctx.isProxy) penalties += 20
    if (ctx.loginHour >= 0 && ctx.loginHour <= 5) penalties += 10
    if (ctx.recentDevicesCount > 3) penalties += 15 * (ctx.recentDevicesCount / 3)
    return Math.max(0, 100 - penalties)
  }

  private calcReputationScore(ctx: DeviceContext): number {
    let penalties = 0
    if (ctx.isSharedDevice) penalties += 30
    if (ctx.recentDevicesCount > 5) penalties += 20
    return Math.max(0, 100 - penalties)
  }
}
```

---

## 6. Reputation & Historique

### 6.1 Modele de Donnees

```typescript
// Stocke dans device_history table

interface DeviceHistoryEntry {
  id: string
  deviceId: string
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'VERIFICATION_SENT'
    | 'VERIFIED' | 'ANOMALY' | 'QUARANTINED' | 'BLOCKED'
    | 'TRUST_GAINED' | 'TRUST_LOST' | 'LOCATION_CHANGE'
  ipAddress: string
  country?: string
  latitude?: number
  longitude?: number
  userAgent: string
  metadata: Record<string, unknown>
  createdAt: Date
}

// Aggregation pour la reputation

interface DeviceReputation {
  deviceId: string
  totalEvents: number
  goodEvents: number
  suspiciousEvents: number
  criticalEvents: number
  lastTrustChange: Date
  averageScore: number
  scoreTrend: 'UP' | 'STABLE' | 'DOWN'
  reportedByOtherUsers: number
  firstSeen: Date
  lastSeen: Date
  countriesVisited: string[]
  ipCount: number
}
```

### 6.2 Calcul de la Tendance

```typescript
export function calculateTrend(history: DeviceHistoryEntry[]): 'UP' | 'STABLE' | 'DOWN' {
  const recent = history.filter(h => {
    return h.createdAt > new Date(Date.now() - 7 * 86400000)
  })

  if (recent.length < 5) return 'STABLE'

  const mid = Math.floor(recent.length / 2)
  const firstHalf = recent.slice(0, mid)
  const secondHalf = recent.slice(mid)

  const firstGood = firstHalf.filter(e => e.eventType === 'LOGIN_SUCCESS' || e.eventType === 'VERIFIED').length
  const secondGood = secondHalf.filter(e => e.eventType === 'LOGIN_SUCCESS' || e.eventType === 'VERIFIED').length

  const firstRatio = firstGood / firstHalf.length
  const secondRatio = secondGood / secondHalf.length

  if (secondRatio > firstRatio + 0.1) return 'UP'
  if (secondRatio < firstRatio - 0.1) return 'DOWN'
  return 'STABLE'
}
```

---

## 7. Appareils de Confiance

### 7.1 Trusted Devices

Les appareils de confiance (TRUSTED) beneficient d'avantages :

| Avantage | Duree | Condition |
|----------|-------|-----------|
| Bypass 2FA | 30 jours | Score > 80, aucune anomalie |
| Session TTL etendu | +7 jours | Plan PRO+ |
| Rate limit superieur | x2 | Appareil TRUSTED |
| Verification alleegee | - | Pas de challenge a chaque connexion |

### 7.2 Gestion du Trust

```typescript
// src/lib/security/device-trust-manager.ts

export class DeviceTrustManager {
  private readonly redis: Redis
  private readonly prisma: PrismaClient
  private readonly scoring: DeviceScoringEngine

  constructor() {
    this.redis = new Redis(config.redis.url)
    this.prisma = new PrismaClient()
    this.scoring = new DeviceScoringEngine()
  }

  async getTrustLevel(deviceId: string): Promise<string> {
    const cached = await this.redis.get(`device:trust:${deviceId}`)
    if (cached) return cached

    const device = await this.prisma.device.findUnique({ where: { id: deviceId } })
    if (!device) return 'UNREGISTERED'

    await this.redis.setex(`device:trust:${deviceId}`, 300, device.trustLevel)
    return device.trustLevel
  }

  async updateTrust(deviceId: string, transition: string): Promise<void> {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } })
    if (!device) throw new Error('Appareil introuvable')

    const newState = transitionDeviceState(
      device.trustLevel as DeviceTrustState,
      transition as DeviceTrustTransition,
    )

    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        trustLevel: newState,
        ...(newState === 'TRUSTED' ? {
          trustedUntil: new Date(Date.now() + 30 * 86400000),
        } : {}),
      },
    })

    await this.redis.del(`device:trust:${deviceId}`)
    await this.recordHistory(deviceId, `TRUST_CHANGED_${newState}`)
  }

  async trustDevice(deviceId: string, userId: string, durationDays = 30): Promise<void> {
    await this.prisma.device.updateMany({
      where: { id: deviceId, userId },
      data: {
        trustLevel: 'TRUSTED',
        trustedUntil: new Date(Date.now() + durationDays * 86400000),
      },
    })
    await this.redis.del(`device:trust:${deviceId}`)
  }

  private async recordHistory(deviceId: string, event: string): Promise<void> {
    await this.prisma.deviceHistory.create({
      data: { deviceId, eventType: event },
    })
  }
}
```

---

## 8. Revocation & Quarantaine

### 8.1 Quarantaine Automatique

La quarantaine est declenchee automatiquement quand :

```
1. Score < 30 pendant 24h consecutives
2. 3+ anomalies en 24h (changement IP, geo, UA)
3. Detection de fingerprint suspect (trop parfait, identique a un autre user)
4. IP blacklistee + nouvel appareil
5. Tentative de hijacking depuis cet appareil
```

### 8.2 Comportement en Quarantaine

| Fonctionnalite | Disponible | Alternative |
|----------------|:----------:|-------------|
| Login | NON | Verification email + admin |
| Consultation donnees | OUI (read-only) | - |
| Modification profil | NON | - |
| Trading signals | NON | - |
| Nouvelle session | NON | - |
| Chat | NON | - |
| Notifications | OUI (uniquement alerte securite) | - |

### 8.3 Procedure de Sortie de Quarantaine

```
1. Verification email + 2FA
2. Revue admin (si fraude confirmee)
3. Resolution automatique si aucune anomalie pendant 7 jours
4. Suppression definitive si bloque > 30 jours
```

### 8.4 Implementation

```typescript
// src/lib/security/device-quarantine.ts

export class DeviceQuarantineManager {
  private readonly prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async shouldQuarantine(deviceId: string): Promise<boolean> {
    const recentAnomalies = await this.prisma.deviceHistory.count({
      where: {
        deviceId,
        eventType: 'ANOMALY',
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
    })

    if (recentAnomalies >= 3) return true

    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { trustLevel: true },
    })

    return device?.trustLevel === 'SUSPICIOUS' && recentAnomalies >= 2
  }

  async applyQuarantine(deviceId: string, userId: string): Promise<void> {
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { trustLevel: 'QUARANTINED' },
    })

    await this.prisma.securityEvent.create({
      data: {
        userId,
        type: 'DEVICE_QUARANTINED',
        severity: 'HIGH',
        metadata: { deviceId },
      },
    })
  }

  async releaseFromQuarantine(deviceId: string, userId: string): Promise<void> {
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { trustLevel: 'VERIFIED' },
    })

    await this.prisma.securityEvent.create({
      data: {
        userId,
        type: 'DEVICE_RELEASED',
        severity: 'INFO',
        metadata: { deviceId },
      },
    })
  }

  async autoReleaseIfSafe(deviceId: string): Promise<boolean> {
    const recentAnomalies = await this.prisma.deviceHistory.count({
      where: {
        deviceId,
        eventType: 'ANOMALY',
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    })

    if (recentAnomalies === 0) return true
    return false
  }
}
```

---

## 9. Synchronisation Multi-Appareils

### 9.1 Detection de Conflits

Le systeme detecte les situations anormales entre appareils d'un meme user :

```
Detection de conflit :
  - Meme fingerprint apparu sur 2+ users differents
    -> Flag partage de compte / clone
  - Nouvel appareil depuis un pays different < 1h
    -> Impossible travel
  - 5+ nouveaux appareils en 24h
    -> Flag creation massive / scraping
  - Appareil avec fingerprint "trop parfait" (aucune variation)
    -> Flag automate / bot
```

### 9.2 Synchronisation des Sessions

```typescript
// src/lib/security/device-sync.ts

export class DeviceSyncManager {
  private readonly redis: Redis
  private readonly prisma: PrismaClient

  constructor() {
    this.redis = new Redis(config.redis.url)
    this.prisma = new PrismaClient()
  }

  // Verifier si un fingerprint est deja utilise par un autre user
  async isFingerprintShared(fingerprint: string, userId: string): Promise<boolean> {
    const otherDevices = await this.prisma.device.findMany({
      where: { fingerprint, userId: { not: userId } },
      select: { userId: true },
    })
    return otherDevices.length > 0
  }

  // Obtenir le nombre d'appareils recents
  async getRecentDeviceCount(userId: string, hours = 24): Promise<number> {
    return this.prisma.device.count({
      where: {
        userId,
        firstSeenAt: { gte: new Date(Date.now() - hours * 3600000) },
      },
    })
  }

  // Verifier la coherence geo
  async checkGeoConsistency(deviceId: string, latitude: number, longitude: number): Promise<{
    consistent: boolean
    distanceKm: number
    lastLocation?: { lat: number; lng: number; timestamp: Date }
  }> {
    const lastHistory = await this.prisma.deviceHistory.findFirst({
      where: { deviceId, latitude: { not: null } },
      orderBy: { createdAt: 'desc' },
    })

    if (!lastHistory?.latitude || !lastHistory?.longitude) {
      return { consistent: true, distanceKm: 0 }
    }

    const distance = haversineDistance(
      latitude, longitude,
      lastHistory.latitude, lastHistory.longitude,
    )

    const hoursSince = (Date.now() - lastHistory.createdAt.getTime()) / 3600000

    return {
      consistent: !(distance > 1000 && hoursSince < 2),
      distanceKm: distance,
      lastLocation: {
        lat: lastHistory.latitude,
        lng: lastHistory.longitude,
        timestamp: lastHistory.createdAt,
      },
    }
  }
}
```

---

## 10. Detection de Partage

### 10.1 Analyse de Diversite

Le systeme detecte le partage de compte en analysant :

| Metrique | Seuil | Risque |
|----------|:-----:|--------|
| Appareils distincts / jour | > 3 | Partage probable |
| Pays distincts / semaine | > 2 | Partage probable |
| Fingerprints simultanes | > 2 connexions actives | Partage certain |
| Heures actives couvrant > 16h/jour | Oui | Equipe |
| Changement OS frequent | > 3 OS/semaine | Anormal |

### 10.2 Score de Partage

```typescript
export class SharingDetectionEngine {
  async calculateSharingRisk(userId: string): Promise<{
    score: number
    reasons: string[]
    devicesToday: number
    countriesWeek: string[]
  }> {
    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const devicesToday = devices.filter(d => d.lastSeenAt >= today).length
    const countriesWeek = [...new Set(
      devices.filter(d => d.lastSeenAt >= new Date(Date.now() - 7 * 86400000))
        .map(d => d.country).filter(Boolean)
    )] as string[]

    let score = 0
    const reasons: string[] = []

    if (devicesToday > 3) {
      score += 30
      reasons.push(`${devicesToday} appareils aujourd'hui`)
    }

    if (countriesWeek.length > 2) {
      score += 25
      reasons.push(`${countriesWeek.length} pays cette semaine`)
    }

    const activeSessions = await prisma.session.count({
      where: { userId, expiresAt: { gt: new Date() } },
    })

    if (activeSessions > devices.length * 1.5) {
      score += 20
      reasons.push(`Sessions actives (${activeSessions}) > appareils (${devices.length})`)
    }

    return { score: Math.min(100, score), reasons, devicesToday, countriesWeek }
  }
}
```

---

## 11. API & Integration

### 11.1 Endpoints API

| Methode | Route | Description | Rate Limit |
|---------|-------|-------------|------------|
| GET | `/api/auth/devices` | Liste des appareils | 10 req/min |
| DELETE | `/api/auth/devices/:id` | Revocation appareil | 5 req/min |
| POST | `/api/auth/devices/:id/trust` | Marquer comme fiable | 5 req/min |
| POST | `/api/auth/devices/:id/rename` | Renommer appareil | 10 req/min |
| POST | `/api/auth/devices/send-verification` | Envoyer code verification | 3 req/min |
| POST | `/api/auth/devices/verify` | Verifier code | 5 req/min |
| GET | `/api/auth/devices/:id/history` | Historique appareil | 10 req/min |
| GET | `/api/auth/devices/sharing-risk` | Risque partage | 5 req/min |
| POST | `/api/admin/devices/:id/quarantine` | Mise en quarantaine (admin) | 10 req/min |
| POST | `/api/admin/devices/:id/release` | Liberation quarantaine (admin) | 10 req/min |

### 11.2 Headers

```
Requete:
  x-device-fingerprint: hash_sha256
  x-device-fingerprint-signals: { signals JSON }
  x-device-trust-level: TRUSTED | VERIFIED | ...
  x-device-id: uuid

Reponse:
  x-device-trust-level: TRUSTED
  x-device-trust-score: 85
  x-device-challenge-required: true | false
```

---

## 12. Schema Prisma

```prisma
// Modele principal des appareils
model Device {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  fingerprint    String   @map("fingerprint")
  name           String?
  ipAddress      String?  @map("ip_address")
  userAgent      String?  @map("user_agent")
  country        String?  @map("country")
  deviceType     String?  @map("device_type")
  brand          String?  @map("brand")
  model          String?  @map("model")
  os             String?  @map("os")
  browser        String?  @map("browser")
  trustLevel     String   @default("UNREGISTERED") @map("trust_level")
  trustScore     Int      @default(0) @map("trust_score")
  trustedUntil   DateTime? @map("trusted_until")
  firstSeenAt    DateTime @default(now()) @map("first_seen_at")
  lastSeenAt     DateTime @default(now()) @map("last_seen_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user             User                 @relation(fields: [userId], references: [id])
  history          DeviceHistory[]
  verifications    DeviceVerification[]

  @@unique([userId, fingerprint])
  @@index([userId])
  @@index([fingerprint])
  @@index([trustLevel])
  @@index([lastSeenAt])
  @@map("devices")
}

// Historique des evenements appareil
model DeviceHistory {
  id        String   @id @default(uuid()) @db.Uuid
  deviceId  String   @map("device_id") @db.Uuid
  eventType String   @map("event_type")
  ipAddress String?  @map("ip_address")
  country   String?  @map("country")
  latitude  Float?   @map("latitude")
  longitude Float?   @map("longitude")
  userAgent String?  @map("user_agent")
  metadata  Json?    @db.JsonB
  createdAt DateTime @default(now()) @map("created_at")

  device Device @relation(fields: [deviceId], references: [id])

  @@index([deviceId])
  @@index([deviceId, createdAt])
  @@index([eventType])
  @@map("device_history")
}

// Verifications d'appareil (code email)
model DeviceVerification {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  deviceFingerprint String    @map("device_fingerprint")
  ipAddress         String?   @map("ip_address")
  userAgent         String?   @map("user_agent")
  deviceType        String?   @map("device_type")
  brand             String?   @map("brand")
  model             String?   @map("model")
  os                String?   @map("os")
  browser           String?   @map("browser")
  verificationCode  String    @map("verification_code")
  expiresAt         DateTime  @map("expires_at")
  verifiedAt        DateTime? @map("verified_at")
  createdAt         DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([userId, deviceFingerprint])
  @@map("device_verifications")
}
```

**Migration :**
```bash
pnpm db:migrate --name add_device_history
pnpm db:migrate --name add_device_trust_fields
```

---

## 13. Metriques & Observabilite

### 13.1 Metriques Cles

| Metrique | Seuil OK | Seuil WARN | Seuil CRITICAL |
|----------|:--------:|:----------:|:--------------:|
| Taux d'appareils TRUSTED | > 60% | > 40% | < 40% |
| Taux d'appareils BLOCKED | < 1% | < 3% | > 3% |
| Nouveaux appareils/heure | < 100 | < 500 | > 500 |
| Taux verification email | > 70% | > 50% | < 50% |
| Score moyen appareils | > 70 | > 50 | < 50 |
| Appareils en quarantaine | 0 | > 5 | > 20 |
| Partages detectes/jour | 0 | > 3 | > 10 |

### 13.2 Alertes

| Condition | Canal | Action |
|-----------|-------|--------|
| Appareil BLOCKED depuis IP connue | Email admin | Investigation |
| 10+ nouveaux appareils en 1h pour 1 user | Slack + Email | Verification compte |
| Appareil QUARANTINED | Slack | Revue manuelle |
| Mise en quarantaine automatique | PagerDuty (si CRITICAL) | Intervention |
| Fingerprint partage entre users | Email admin | Investigation fraude |
| Score moyen < 50 sur 1h | Slack | Analyse |

---

## 14. Implementation Roadmap

```
Phase 1: Foundation (Semaine 1)
  +-- Machine a etats de confiance
  +-- Fingerprinting avance (canvas, webgl, audio, fonts)
  +-- Device scoring engine (formules + seuils)
  +-- Tests unitaires

Phase 2: Trust Management (Semaine 2)
  +-- Appareils de confiance (bypass 2FA, trustedUntil)
  +-- Revocation individuelle et masse
  +-- API endpoints (CRUD, verification)
  +-- Integration avec le moteur d'auth

Phase 3: Detection (Semaine 3)
  +-- Quarantaine automatique
  +-- Detection de partage
  +-- Synchronisation multi-appareils
  +-- Historique et tendances

Phase 4: Monitoring (Semaine 4)
  +-- Metriques et alertes
  +-- Dashboards
  +-- Tests d'integration
  +-- Documentation
```

---

> **Fin du document MASTER_DEVICE_TRUST.md**  
> **Version 1.0.0 — 2026-07-22**  
> **Prochaine revision : trimestrielle**
