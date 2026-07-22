import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"
import type { SecurityEventType, SecuritySeverity } from "../../generated/prisma/client"

const log = logger.child({ module: "security-event-bus" })

export interface SecurityEventInput {
  userId: string
  type: SecurityEventType
  severity: SecuritySeverity
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  sessionId?: string
  country?: string
  city?: string
  latitude?: number
  longitude?: number
  riskScore?: number
}

const SEVERITY_ORDER: Record<string, number> = {
  INFO: 0,
  WARNING: 1,
  HIGH: 2,
  CRITICAL: 3,
}

export class SecurityEventBus {
  async emit(event: SecurityEventInput): Promise<string> {
    const created = await prisma.securityEvent.create({
      data: {
        userId: event.userId,
        type: event.type,
        severity: event.severity,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (event.details ?? {}) as any,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceId: event.deviceId,
        sessionId: event.sessionId,
        country: event.country,
        city: event.city,
        latitude: event.latitude,
        longitude: event.longitude,
        riskScore: event.riskScore ?? 0,
      },
    })

    try {
      const redis = getRedis()
      if (redis) {
        const channel = `sec:${event.type.toLowerCase()}`
        await redis.publish(channel, JSON.stringify({
          id: created.id,
          userId: event.userId,
          type: event.type,
          severity: event.severity,
          riskScore: event.riskScore,
          timestamp: created.createdAt,
        }))
      }
    } catch {
      // Redis pub/sub failure is non-critical
    }

    if (SEVERITY_ORDER[event.severity] >= SEVERITY_ORDER["HIGH"]) {
      this.triggerAlert(event)
    }

    this.evaluateRules(event).catch(() => {})

    return created.id
  }

  private async evaluateRules(event: SecurityEventInput): Promise<void> {
    const { securityEventRules } = await import("./security-event-rules")
    await securityEventRules.evaluate(event.userId, event.type, event.ipAddress)
  }

  private async triggerAlert(event: SecurityEventInput): Promise<void> {
    const redis = getRedis()
    if (!redis) return
    const alertKey = `security:alert:${event.userId}`
    const recentAlerts = await redis.get(alertKey)
    if (recentAlerts) {
      const count = parseInt(recentAlerts, 10)
      if (count > 10) {
        log.warn({ userId: event.userId, type: event.type }, "Alerte securite supprimee (trop frequente)")
        return
      }
      await redis.incr(alertKey)
    } else {
      await redis.setex(alertKey, 3600, "1")
    }

    if (recentAlerts && parseInt(recentAlerts, 10) > 10) return

    log.warn({
      userId: event.userId, type: event.type, severity: event.severity, details: event.details,
    }, "Alerte securite declenchee")

    // Envoyer email admin pour les evenements HIGH/CRITICAL
    try {
      const user = event.userId ? await prisma.user.findUnique({
        where: { id: event.userId },
        select: { name: true, email: true },
      }) : null

      const { securityAlertAdminEmail } = await import("../email")
      const { sendAdminAlert } = await import("./admin-alert")
      const template = securityAlertAdminEmail(
        event.severity,
        event.type,
        {
          userId: event.userId,
          userEmail: user?.email,
          ipAddress: event.ipAddress,
          riskScore: event.riskScore,
          description: (event.details as any)?.reason,
        },
      )
      await sendAdminAlert(template.subject, template.html)
    } catch (err) {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "Admin alert email failed")
    }
  }

  async getRecentEvents(userId: string, limit = 20): Promise<unknown[]> {
    return prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }

  async countByType(userId: string, type: SecurityEventType, since: Date): Promise<number> {
    return prisma.securityEvent.count({
      where: {
        userId,
        type,
        createdAt: { gte: since },
      },
    })
  }

  async getHighRiskEvents(since: Date, limit = 50): Promise<unknown[]> {
    return prisma.securityEvent.findMany({
      where: {
        severity: { in: ["HIGH", "CRITICAL"] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    })
  }
}

export const securityEventBus = new SecurityEventBus()
