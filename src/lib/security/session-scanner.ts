import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { getConnection as getRedis } from "@nba/lib/redis-pubsub"

const log = logger.child({ module: "session-scanner" })

const THRESHOLDS = {
  /** Nombre max de comptes par IP avant alerte */
  ACCOUNTS_PER_IP: 3,
  /** Nombre max de comptes par fingerprint device */
  ACCOUNTS_PER_DEVICE: 2,
  /** Période sans session pour considérer un compte dormant (jours) */
  DORMANT_DAYS: 90,
  /** Nombre max de pays différents par utilisateur */
  MAX_COUNTRIES: 2,
  /** Nombre max de sessions depuis une même IP par heure */
  SESSIONS_PER_IP_PER_HOUR: 20,
}

interface ScanResult {
  ipClusters: number
  deviceShares: number
  geoAnomalies: number
  dormantReactivated: number
  ipVelocityHits: number
  totalFlags: number
  errors: string[]
}

/**
 * Scanner de sessions existantes.
 * Détecte les anomalies sur les sessions déjà ouvertes (pas seulement au login).
 */
export async function scanSessions(): Promise<ScanResult> {
  const result: ScanResult = { ipClusters: 0, deviceShares: 0, geoAnomalies: 0, dormantReactivated: 0, ipVelocityHits: 0, totalFlags: 0, errors: [] }
  const securityEventBus = (await import("./security-event-bus")).securityEventBus

  try {
    // ── 1. IP Clustering : IPs partagées par plusieurs comptes ──
    await scanIpClustering(result, securityEventBus)
  } catch (err) {
    result.errors.push(`ipClustering: ${(err as Error).message}`)
    log.error({ err, errorCode: "SCAN_ERROR" }, "Échec scan IP clustering")
  }

  try {
    // ── 2. Device sharing : fingerprints partagés ──
    await scanDeviceSharing(result, securityEventBus)
  } catch (err) {
    result.errors.push(`deviceSharing: ${(err as Error).message}`)
    log.error({ err, errorCode: "SCAN_ERROR" }, "Échec scan device sharing")
  }

  try {
    // ── 3. Geo anomalies : utilisateurs avec sessions dans trop de pays ──
    await scanGeoAnomalies(result, securityEventBus)
  } catch (err) {
    result.errors.push(`geoAnomalies: ${(err as Error).message}`)
    log.error({ err, errorCode: "SCAN_ERROR" }, "Échec scan geo anomalies")
  }

  try {
    // ── 4. IP velocity : même IP, trop de comptes différents ──
    await scanIpVelocity(result, securityEventBus)
  } catch (err) {
    result.errors.push(`ipVelocity: ${(err as Error).message}`)
    log.error({ err, errorCode: "SCAN_ERROR" }, "Échec scan IP velocity")
  }

  result.totalFlags = result.ipClusters + result.deviceShares + result.geoAnomalies + result.dormantReactivated + result.ipVelocityHits
  return result
}

/**
 * Détecte les IPs utilisées par plusieurs comptes différents
 * (partage de compte suspect, vente de compte, etc.)
 */
async function scanIpClustering(result: ScanResult, eventBus: any): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    select: { userId: true, ipAddress: true, userAgent: true, id: true },
    take: 5000,
  })

  // Grouper par IP
  const ipMap = new Map<string, Set<string>>()
  for (const s of sessions) {
    if (!s.ipAddress) continue
    if (!ipMap.has(s.ipAddress)) ipMap.set(s.ipAddress, new Set())
    ipMap.get(s.ipAddress)!.add(s.userId)
  }

  // Alerter si trop de comptes par IP
  for (const [ip, userIds] of ipMap) {
    if (userIds.size >= THRESHOLDS.ACCOUNTS_PER_IP) {
      for (const userId of userIds) {
        await eventBus.emit({
          userId,
          type: "SECURITY_ALERT",
          severity: "HIGH",
          details: { fraudType: "IP_CLUSTER", ip, sharedWith: userIds.size - 1, totalAccounts: userIds.size },
        })
      }
      log.warn({ ip, accounts: userIds.size }, "IP clusteree — partage de compte suspect")
      result.ipClusters += userIds.size
    }
  }
}

/**
 * Détecte les fingerprints d'appareils partagés entre plusieurs comptes.
 */
async function scanDeviceSharing(result: ScanResult, eventBus: any): Promise<void> {
  const devices = await prisma.device.findMany({
    where: { lastSeenAt: { gt: new Date(Date.now() - 7 * 86400_000) } },
    select: { id: true, userId: true, deviceFingerprint: true },
    take: 5000,
  })

  const fpMap = new Map<string, Set<string>>()
  for (const d of devices) {
    if (!d.deviceFingerprint) continue
    if (!fpMap.has(d.deviceFingerprint)) fpMap.set(d.deviceFingerprint, new Set())
    fpMap.get(d.deviceFingerprint)!.add(d.userId)
  }

  for (const [fp, userIds] of fpMap) {
    if (userIds.size >= THRESHOLDS.ACCOUNTS_PER_DEVICE) {
      for (const userId of userIds) {
        await eventBus.emit({
          userId,
          type: "SECURITY_ALERT",
          severity: "MEDIUM",
          details: { fraudType: "DEVICE_SHARING", fingerprint: fp.slice(0, 16) + "...", sharedWith: userIds.size - 1 },
        })
      }
      log.warn({ fingerprint: fp.slice(0, 16) + "...", accounts: userIds.size }, "Device partage entre plusieurs comptes")
      result.deviceShares += userIds.size
    }
  }
}

/**
 * Détecte les utilisateurs avec des sessions dans trop de pays.
 */
async function scanGeoAnomalies(result: ScanResult, eventBus: any): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    select: { userId: true, lastCountry: true },
    take: 5000,
  })

  const userCountries = new Map<string, Set<string>>()
  for (const s of sessions) {
    if (!s.lastCountry) continue
    if (!userCountries.has(s.userId)) userCountries.set(s.userId, new Set())
    userCountries.get(s.userId)!.add(s.lastCountry)
  }

  for (const [userId, countries] of userCountries) {
    if (countries.size > THRESHOLDS.MAX_COUNTRIES) {
      await eventBus.emit({
        userId,
        type: "SECURITY_ALERT",
        severity: "LOW",
        details: { fraudType: "GEO_ANOMALY", countries: [...countries], count: countries.size },
      })
      result.geoAnomalies++
    }
  }
}

/**
 * Détecte une même IP utilisée par trop de comptes différents en peu de temps
 * (credential stuffing, rotation de comptes).
 */
async function scanIpVelocity(result: ScanResult, eventBus: any): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  // Utilise les clés de rate-limit Redis pour détecter la vélocité
  const keys = await redis.keys("ratelimit:*:ip:*")
  for (const key of keys.slice(0, 100)) {
    const count = await redis.zcard(key)
    if (count > THRESHOLDS.SESSIONS_PER_IP_PER_HOUR) {
      const ip = key.split(":ip:").pop() || "unknown"
      log.warn({ ip, requests: count }, "IP velocity elevee — possible credential stuffing")
      result.ipVelocityHits++
    }
  }
}
