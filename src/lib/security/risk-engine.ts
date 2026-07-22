import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"

const log = logger.child({ module: "risk-engine" })

export interface RiskContext {
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  deviceId?: string
  deviceTrustLevel?: string
  has2fa?: boolean
  planTier?: number
  planMaxSessions?: number
}

export interface RiskFactor {
  name: string
  weight: number
  score: number
  reason?: string
}

export interface RiskResult {
  totalScore: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  factors: RiskFactor[]
  requiresChallenge: boolean
  shouldBlock: boolean
}

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "throwaway.com", "guerrillamail.com",
  "10minutemail.com", "mailinator.com", "yopmail.com",
])

export class SyncRiskEngine {
  async evaluate(context: RiskContext): Promise<RiskResult> {
    const factors: RiskFactor[] = []

    const results = await Promise.all([
      this.evaluateRateLimit(context),
      this.evaluateSessionLimit(context),
      this.evaluateDeviceTrust(context),
      this.evaluateTwoFactor(context),
      this.evaluateEmailDomain(context),
    ])

    for (const result of results) {
      factors.push(...result)
    }

    return this.calculate(factors)
  }

  private async evaluateRateLimit(ctx: RiskContext): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = []

    try {
      const redis = getRedis()
      if (!redis) return factors
      const ipKey = `ratelimit:risk:ip:${ctx.ipAddress}`
      const ipCount = await redis.incr(ipKey)
      if (ipCount === 1) await redis.expire(ipKey, 60)

      if (ipCount > 5) {
        factors.push({
          name: "rate_limit_ip",
          weight: 15,
          score: Math.min(Math.round((ipCount - 5) / 5 * 100), 100),
          reason: `${ipCount} requetes depuis cette IP en 60s`,
        })
      }
    } catch {
      // Redis indisponible — ignorer ce facteur
    }

    return factors
  }

  private async evaluateSessionLimit(ctx: RiskContext): Promise<RiskFactor[]> {
    if (!ctx.userId) return []

    const maxSessions = ctx.planMaxSessions ?? 5

    const activeSessions = await prisma.session.count({
      where: {
        userId: ctx.userId,
        expiresAt: { gt: new Date() },
      },
    })

    const usageRatio = activeSessions / maxSessions

    if (usageRatio >= 1) {
      return [{
        name: "session_limit_exceeded",
        weight: 20,
        score: 100,
        reason: `${activeSessions}/${maxSessions} sessions utilisees (depasse)`,
      }]
    }

    if (usageRatio >= 0.8) {
      return [{
        name: "session_limit_near",
        weight: 20,
        score: Math.round(usageRatio * 100),
        reason: `${activeSessions}/${maxSessions} sessions utilisees (limite proche)`,
      }]
    }

    return []
  }

  async evaluateDeviceTrust(ctx: RiskContext): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = []

    if (!ctx.deviceId) {
      factors.push({
        name: "device_unknown",
        weight: 30,
        score: 80,
        reason: "Nouvel appareil detecte",
      })
      return factors
    }

    const device = await prisma.device.findUnique({
      where: { id: ctx.deviceId },
    })

    if (!device) {
      factors.push({
        name: "device_not_found",
        weight: 30,
        score: 90,
        reason: "Appareil reference mais introuvable",
      })
      return factors
    }

    switch (device.trustLevel) {
      case "TRUSTED":
        return [{
          name: "device_trusted",
          weight: 30,
          score: 0,
          reason: "Appareil de confiance",
        }]
      case "VERIFIED":
        factors.push({
          name: "device_verified",
          weight: 30,
          score: 20,
          reason: "Appareil verifie mais pas en confiance",
        })
        break
      case "PENDING":
        factors.push({
          name: "device_pending",
          weight: 30,
          score: 50,
          reason: "Appareil en attente de verification",
        })
        break
      case "SUSPICIOUS":
        factors.push({
          name: "device_suspicious",
          weight: 30,
          score: 80,
          reason: "Appareil suspect",
        })
        break
      case "BLOCKED":
        factors.push({
          name: "device_blocked",
          weight: 30,
          score: 100,
          reason: "Appareil bloque",
        })
        break
      default:
        factors.push({
          name: "device_unknown_trust",
          weight: 30,
          score: 60,
          reason: `Trust level inconnu: ${device.trustLevel}`,
        })
    }

    if (device.flagVpn || device.flagProxy || device.flagTor || device.flagDatacenter) {
      const flags: string[] = []
      if (device.flagVpn) flags.push("VPN")
      if (device.flagProxy) flags.push("Proxy")
      if (device.flagTor) flags.push("Tor")
      if (device.flagDatacenter) flags.push("Datacenter")

      factors.push({
        name: "device_ip_flags",
        weight: 25,
        score: 70,
        reason: `IP suspecte: ${flags.join(", ")}`,
      })
    }

    return factors
  }

  private evaluateTwoFactor(ctx: RiskContext): RiskFactor[] {
    if (!ctx.has2fa) {
      return [{
        name: "no_two_factor",
        weight: 10,
        score: 40,
        reason: "2FA non active",
      }]
    }
    return [{
      name: "two_factor_active",
      weight: 10,
      score: 0,
      reason: "2FA active",
    }]
  }

  private evaluateEmailDomain(ctx: RiskContext): RiskFactor[] {
    if (!ctx.email) return []

    const domain = ctx.email.split("@")[1]?.toLowerCase()
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return [{
        name: "disposable_email",
        weight: 5,
        score: 50,
        reason: `Domaine email jetable: ${domain}`,
      }]
    }

    return []
  }

  private calculate(factors: RiskFactor[]): RiskResult {
    const weightedScore = factors.reduce(
      (sum, f) => sum + (f.score * f.weight / 100), 0,
    )
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    const totalScore = totalWeight > 0
      ? Math.round(weightedScore / totalWeight * 100)
      : 0

    return {
      totalScore,
      level: totalScore <= 30 ? "LOW"
        : totalScore <= 50 ? "MEDIUM"
        : totalScore <= 70 ? "HIGH"
        : "CRITICAL",
      factors,
      requiresChallenge: totalScore > 50,
      shouldBlock: totalScore > 70,
    }
  }
}

export class AsyncRiskEngine {
  async evaluateAsync(sessionId: string, userId: string, ipAddress: string, deviceId?: string): Promise<void> {
    try {
      const redis = getRedis()
      if (!redis) return
      const queueKey = `risk:async:${sessionId}`
      const exists = await redis.get(queueKey)
      if (exists) return

      await redis.setex(queueKey, 300, "processing")

      const factors: RiskFactor[] = []
      const [
        ipResult,
        velocityResult,
        geoResult,
      ] = await Promise.all([
        this.checkIPReputation(ipAddress),
        this.checkLoginVelocity(userId, ipAddress),
        this.checkGeoConsistency(userId, ipAddress),
      ])

      if (ipResult) factors.push(ipResult)
      if (velocityResult) factors.push(velocityResult)
      if (geoResult) factors.push(geoResult)

      const syncEngine = new SyncRiskEngine()
      const deviceFactors = await syncEngine.evaluateDeviceTrust({ userId, ipAddress, userAgent: "", deviceId })
      factors.push(...deviceFactors)

      if (deviceId) {
        await this.enrichDeviceIp(deviceId, ipAddress)
      }

      const result = syncEngine["calculate"](factors)

      const level = result.totalScore <= 30 ? "LOW"
        : result.totalScore <= 50 ? "MEDIUM"
        : result.totalScore <= 70 ? "HIGH"
        : "CRITICAL"

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          riskScore: result.totalScore,
          riskLevel: level,
          isHighRisk: result.totalScore > 70,
          riskReason: result.factors.map(f => f.reason).filter(Boolean).join("; "),
        },
      })

      if (result.totalScore > 70) {
        const { securityEventBus } = await import("./security-event-bus")
        await securityEventBus.emit({
          userId,
          type: "SECURITY_ALERT",
          severity: result.totalScore > 90 ? "CRITICAL" : "HIGH",
          details: { riskScore: result.totalScore, factors: result.factors },
          ipAddress,
          sessionId,
          deviceId,
          riskScore: result.totalScore,
        })
      }
    } catch (err) {
      log.error({ err, sessionId, userId }, "Echec scoring asynchrone")
    }
  }

  private async checkIPReputation(ip: string): Promise<RiskFactor | null> {
    try {
      const redis = getRedis()
      if (!redis) return null
      const cacheKey = `iprep:${ip}`
      const cached = await redis.get(cacheKey)
      if (cached) {
        const data = JSON.parse(cached) as { isVPN: boolean; isTor: boolean; isProxy: boolean; isDatacenter: boolean }
        return this.ipToFactor(data)
      }
      const { ipReputationService } = await import("./ip-reputation")
      const reputation = await ipReputationService.lookup(ip)
      if (redis) {
        await redis.setex(cacheKey, 3600, JSON.stringify(reputation))
      }
      return this.ipToFactor(reputation)
    } catch {
      return null
    }
  }

  private ipToFactor(reputation: { isVPN: boolean; isTor: boolean; isProxy: boolean; isDatacenter: boolean }): RiskFactor | null {
    if (reputation.isTor) {
      return { name: "ip_tor", weight: 25, score: 100, reason: "IP Tor detectee" }
    }
    if (reputation.isVPN) {
      return { name: "ip_vpn", weight: 25, score: 70, reason: "IP VPN detectee" }
    }
    if (reputation.isProxy) {
      return { name: "ip_proxy", weight: 25, score: 60, reason: "IP Proxy detectee" }
    }
    if (reputation.isDatacenter) {
      return { name: "ip_datacenter", weight: 25, score: 30, reason: "IP Datacenter" }
    }
    return null
  }

  private async enrichDeviceIp(deviceId: string, ipAddress: string): Promise<void> {
    try {
      const { ipReputationService } = await import("./ip-reputation")
      const reputation = await ipReputationService.lookup(ipAddress)
      await ipReputationService.flagDevice(deviceId, reputation)
    } catch {
      // non-critical
    }
  }

  private async checkGeoConsistency(userId: string, currentIp: string): Promise<RiskFactor | null> {
    try {
      const { ipReputationService } = await import("./ip-reputation")
      const currentGeo = await ipReputationService.lookup(currentIp)
      if (!currentGeo.latitude || !currentGeo.longitude) return null

      const lastSession = await prisma.session.findFirst({
        where: { userId, latitude: { not: null }, longitude: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { latitude: true, longitude: true, createdAt: true, country: true },
      })
      if (!lastSession || !lastSession.latitude || !lastSession.longitude) return null

      const { impossibleTravelDetector } = await import("./impossible-travel")
      const result = await impossibleTravelDetector.check(userId, {
        latitude: currentGeo.latitude,
        longitude: currentGeo.longitude,
        timestamp: new Date(),
        ipAddress: currentIp,
        country: currentGeo.country ?? undefined,
        city: currentGeo.city ?? undefined,
      })
      if (result?.detected) {
        return {
          name: "impossible_travel",
          weight: 30,
          score: result.severity === "CRITICAL" ? 100 : result.severity === "HIGH" ? 80 : 60,
          reason: `Voyage impossible: ${result.distanceKm}km en ${result.timeDeltaMinutes}min`,
        }
      }
      return null
    } catch {
      return null
    }
  }

  private async checkLoginVelocity(userId: string, currentIp: string): Promise<RiskFactor | null> {
    try {
      const redis = getRedis()
      if (!redis) return null
      const key = `velocity:${userId}:${Math.floor(Date.now() / (1000 * 60 * 60))}`
      await redis.sadd(key, currentIp)
      await redis.expire(key, 3600 + 60)

      const uniqueIps = await redis.scard(key)

      if (uniqueIps > 5) {
        return {
          name: "login_velocity",
          weight: 20,
          score: Math.min(uniqueIps * 10, 100),
          reason: `${uniqueIps} IPs uniques en 1h`,
        }
      }

      return null
    } catch {
      return null
    }
  }
}

export const syncRiskEngine = new SyncRiskEngine()
export const asyncRiskEngine = new AsyncRiskEngine()
