import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"
import { securityEventBus } from "./security-event-bus"
import { ipReputationService } from "./ip-reputation"

const log = logger.child({ module: "abuse-detector" })

export interface AbuseDetection {
  category: string
  type: string
  severity: "WARNING" | "HIGH" | "CRITICAL"
  details: Record<string, unknown>
  action: "log" | "block_ip" | "suspend" | "challenge_2fa" | "notify_admin"
}

export class AbuseDetector {
  async checkSignup(email: string, ipAddress: string, _deviceFingerprint: string): Promise<AbuseDetection | null> {
    try {
      const [sameIpCount, domain, lastHour] = await Promise.all([
        prisma.user.count({
          where: {
            accounts: {
              some: { providerId: "credential" },
            },
            devices: {
              some: { ipAddress },
            },
          },
        }),
        this.isDisposableEmail(email),
        new Date(Date.now() - 3600000),
      ])

      if (sameIpCount >= 3) {
        return { category: "account", type: "MULTIPLE_ACCOUNTS_SAME_IP", severity: "HIGH", details: { ip: ipAddress, count: sameIpCount }, action: "block_ip" }
      }

      if (domain) {
        return { category: "account", type: "DISPOSABLE_EMAIL", severity: "WARNING", details: { email }, action: "log" }
      }

      const recentSignups = await prisma.loginAttempt.count({
        where: {
          ipAddress,
          createdAt: { gte: lastHour },
          success: false,
          type: "SIGNUP",
        },
      })
      if (recentSignups > 20) {
        return { category: "api", type: "SIGNUP_BOT", severity: "HIGH", details: { ip: ipAddress, attempts: recentSignups }, action: "block_ip" }
      }

      return null
    } catch (err) {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "Signup abuse check failed")
      return null
    }
  }

  async checkLogin(userId: string, ipAddress: string, deviceId: string | undefined): Promise<AbuseDetection | null> {
    try {
      const redis = getRedis()
      const now = Date.now()
      const oneHourAgo = new Date(now - 3600000)

      const loginAttempts = await prisma.loginAttempt.count({
        where: { userId, createdAt: { gte: oneHourAgo }, success: false, type: "LOGIN" },
      })

      if (loginAttempts >= 5) {
        await securityEventBus.emit({ userId, type: "ACCOUNT_LOCKED", severity: "HIGH", details: { reason: "brute_force", attempts: loginAttempts }, ipAddress })
        return { category: "authentication", type: "BRUTE_FORCE", severity: "HIGH", details: { attempts: loginAttempts }, action: "suspend" }
      }

      if (redis) {
        const key = `login_velocity:${userId}`
        const count = await redis.incr(key)
        if (count === 1) await redis.expire(key, 60)
        if (count > 10) {
          return { category: "authentication", type: "LOGIN_VELOCITY", severity: "HIGH", details: { count }, action: "challenge_2fa" }
        }
      }

      if (deviceId) {
        const blockCount = await prisma.securityEvent.count({
          where: { deviceId, type: "DEVICE_BLOCKED", createdAt: { gte: oneHourAgo } },
        })
        if (blockCount > 0) {
          return { category: "device", type: "BLOCKED_DEVICE_LOGIN", severity: "HIGH", details: { deviceId }, action: "suspend" }
        }
      }

      const ipRep = await ipReputationService.lookup(ipAddress)
      if (ipRep.isTor) {
        return { category: "authentication", type: "LOGIN_FROM_TOR", severity: "HIGH", details: { ip: ipAddress }, action: "challenge_2fa" }
      }

      return null
    } catch (err) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "Login abuse check failed")
      return null
    }
  }

  async checkAPIAbuse(userId: string, endpoint: string, ipAddress: string): Promise<AbuseDetection | null> {
    try {
      const redis = getRedis()
      if (!redis) return null

      const hourKey = `api:${userId}:${Math.floor(Date.now() / 3600000)}`
      const count = await redis.incr(hourKey)
      if (count === 1) await redis.expire(hourKey, 7200)

      if (count > 1000) {
        return { category: "api", type: "API_ABUSE_HOURLY", severity: "HIGH", details: { userId, count, endpoint }, action: "block_ip" }
      }

      if (count > 500) {
        return { category: "api", type: "API_ABUSE_WARNING", severity: "WARNING", details: { userId, count }, action: "log" }
      }

      const ipHourKey = `api:ip:${ipAddress}:${Math.floor(Date.now() / 3600000)}`
      const ipCount = await redis.incr(ipHourKey)
      if (ipCount === 1) await redis.expire(ipHourKey, 7200)

      if (ipCount > 5000) {
        return { category: "api", type: "SCRAPING_DETECTED", severity: "CRITICAL", details: { ip: ipAddress, count: ipCount }, action: "block_ip" }
      }

      return null
    } catch (err) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "API abuse check failed")
      return null
    }
  }

  async checkDormantAccount(userId: string): Promise<AbuseDetection | null> {
    try {
      const lastSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
      if (!lastSession) return null
      const daysSinceLastLogin = (Date.now() - lastSession.createdAt.getTime()) / 86400000
      if (daysSinceLastLogin > 90) {
        return { category: "account", type: "DORMANT_ACCOUNT_REUSE", severity: "HIGH", details: { daysSinceLastLogin: Math.round(daysSinceLastLogin) }, action: "challenge_2fa" }
      }
      return null
    } catch {
      return null
    }
  }

  private async isDisposableEmail(email: string): Promise<boolean> {
    const domain = email.split("@")[1]
    if (!domain) return false
    const disposable = new Set([
      "tempmail.com", "throwaway.com", "guerrillamail.com",
      "10minutemail.com", "mailinator.com", "yopmail.com",
      "mail.tm", "temp-mail.org", "fakeinbox.com", "trashmail.com",
    ])
    return disposable.has(domain.toLowerCase())
  }
}

export const abuseDetector = new AbuseDetector()
