import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"
import type { SecurityEventType } from "../../generated/prisma/client"

const log = logger.child({ module: "security-event-rules" })

interface AlertRule {
  name: string
  eventType: SecurityEventType
  windowMinutes: number
  threshold: number
  action: "notify" | "block_ip" | "suspend_account"
  severity: "WARNING" | "HIGH" | "CRITICAL"
  playbookType?: string
}

const RULES: AlertRule[] = [
  { name: "brute_force", eventType: "LOGIN_FAILED", windowMinutes: 1, threshold: 5, action: "suspend_account", severity: "HIGH", playbookType: "BRUTE_FORCE" },
  { name: "impossible_travel_burst", eventType: "IMPOSSIBLE_TRAVEL_DETECTED", windowMinutes: 60, threshold: 3, action: "suspend_account", severity: "CRITICAL", playbookType: "IMPOSSIBLE_TRAVEL" },
  { name: "session_hijack", eventType: "SESSION_HIJACK_DETECTED", windowMinutes: 5, threshold: 1, action: "notify", severity: "CRITICAL", playbookType: "SESSION_HIJACK" },
  { name: "twofa_disabled_suspicious", eventType: "TWOFA_DISABLED", windowMinutes: 5, threshold: 1, action: "notify", severity: "HIGH", playbookType: "ACCOUNT_TAKEOVER" },
  { name: "rate_limit_burst", eventType: "RATE_LIMIT_EXCEEDED", windowMinutes: 60, threshold: 50, action: "block_ip", severity: "WARNING", playbookType: "API_SCRAPING" },
]

export class SecurityEventRules {
  async evaluate(userId: string, eventType: SecurityEventType, ipAddress?: string): Promise<void> {
    try {
      const now = new Date()

      for (const rule of RULES) {
        if (rule.eventType !== eventType) continue

        const since = new Date(now.getTime() - rule.windowMinutes * 60000)
        const count = await prisma.securityEvent.count({
          where: {
            userId,
            type: eventType,
            createdAt: { gte: since },
          },
        })

        if (count < rule.threshold) continue

        log.warn({
          rule: rule.name, userId, eventType,
          count, threshold: rule.threshold,
          windowMinutes: rule.windowMinutes,
        }, `Alerte: ${rule.name} declenchee`)

        switch (rule.action) {
          case "suspend_account":
            await prisma.user.update({
              where: { id: userId },
              data: { isActive: false, suspendedAt: now },
            })
            log.warn({ userId, rule: rule.name }, "Compte suspendu par regle d'alerte")
            break

          case "block_ip":
            if (ipAddress) {
              const redis = getRedis()
              if (redis) {
                await redis.setex(`blocked:ip:${ipAddress}`, 86400, "1")
                log.warn({ ip: ipAddress, rule: rule.name }, "IP bloquee par regle d'alerte")
              }
            }
            break

          case "notify":
            break
        }

        if (rule.playbookType) {
          const { incidentResponder } = await import("./incident-responder")
          await incidentResponder.execute(userId, rule.playbookType, { ipAddress })
        }
      }
    } catch (err) {
      log.error({ err, userId, eventType, errorCode: "INTEGRATION_ERROR" }, "Echec evaluation regles d'alerte")
    }
  }
}

export const securityEventRules = new SecurityEventRules()
