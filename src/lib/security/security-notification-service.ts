import { prisma } from "../db"
import { notify } from "../services/notifications"
import {
  securityAlertNewDeviceEmail,
  securityAlertNewLocationEmail,
  securityAlertSuspiciousEmail,
  twoFactorEnabledEmail,
  twoFactorDisabledEmail,
} from "../email"
import { logger } from "../logger"

const log = logger.child({ module: "security-notification" })

export class SecurityNotificationService {
  async handlePostLogin(userId: string, userEmail: string, context: Record<string, unknown>): Promise<void> {
    try {
      const [session, user, securityPolicy] = await Promise.all([
        prisma.session.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, ipAddress: true, userAgent: true, country: true,
            city: true, latitude: true, longitude: true, deviceId: true,
            riskLevel: true, riskScore: true, isHighRisk: true, createdAt: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, securityPolicy: true },
        }),
        prisma.securityPolicy.findUnique({ where: { userId } }),
      ])

      if (!session || !user) return
      const policy = securityPolicy ?? user.securityPolicy ?? {
        notifyNewDevice: true, notifyNewLocation: true, notifySuspicious: true,
      }

      const contextDeviceId = (context.deviceId as string | undefined) ?? session.deviceId
      const recentEvents = await prisma.securityEvent.findMany({
        where: { userId, createdAt: { gte: new Date(Date.now() - 10000) } },
        select: { type: true },
      })
      const recentTypes = new Set(recentEvents.map(e => e.type))

      if (session.riskLevel === "HIGH" || session.riskLevel === "CRITICAL") {
        if (policy.notifySuspicious && !recentTypes.has("LOGIN_SUSPICIOUS_IP")) {
          await this.sendSuspiciousLoginAlert(userId, userEmail, session.riskScore ?? 0, {
            ipAddress: session.ipAddress,
            country: session.country,
            riskScore: session.riskScore,
            reason: session.isHighRisk ? "Score de risque eleve" : "Connexion suspecte",
          })
        }
        return
      }

      if (contextDeviceId && policy.notifyNewDevice) {
        const device = await prisma.device.findUnique({
          where: { id: contextDeviceId },
          select: { createdAt: true, firstSeenAt: true, name: true, browser: true, os: true },
        })
        if (device) {
          const firstSeen = device.firstSeenAt ?? device.createdAt
          const isNew = (Date.now() - firstSeen.getTime()) < 5000
          if (isNew && !recentTypes.has("LOGIN_NEW_DEVICE")) {
            await prisma.securityEvent.create({
              data: {
                userId, type: "LOGIN_NEW_DEVICE", severity: "INFO",
                sessionId: session.id, deviceId: contextDeviceId,
                details: { deviceName: device.name, browser: device.browser, os: device.os },
              },
            })
            await this.sendNewDeviceAlert(userId, userEmail, {
              name: device.name, browser: device.browser,
              os: device.os, ipAddress: session.ipAddress,
              location: session.country ? `${session.city ?? ""}, ${session.country}` : undefined,
            })
          }
        }
      }

      if (session.country && policy.notifyNewLocation) {
        const lastEvent = await prisma.securityEvent.findFirst({
          where: { userId, type: "LOGIN_NEW_LOCATION" },
          orderBy: { createdAt: "desc" },
          select: { country: true, createdAt: true },
        })
        const isNewCountry = lastEvent && lastEvent.country !== session.country
        const noRecentAlert = !lastEvent || (Date.now() - lastEvent.createdAt.getTime()) > 86400000
        if ((isNewCountry || !lastEvent) && noRecentAlert && !recentTypes.has("LOGIN_NEW_LOCATION")) {
          await prisma.securityEvent.create({
            data: {
              userId, type: "LOGIN_NEW_LOCATION", severity: "INFO",
              sessionId: session.id, country: session.country,
              city: session.city, details: { country: session.country, city: session.city },
            },
          })
          await this.sendNewLocationAlert(userId, userEmail, {
            country: session.country, city: session.city, ipAddress: session.ipAddress,
          })
        }
      }
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "handlePostLogin failed")
    }
  }

  async sendNewDeviceAlert(userId: string, email: string, deviceDetails: Record<string, unknown>): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      if (!user) return
      const template = securityAlertNewDeviceEmail({ name: user.name, email }, deviceDetails)
      await notify({
        userId, type: "SECURITY",
        title: "Nouvel appareil connecte",
        body: `Un nouvel appareil s'est connecte a votre compte`,
        data: { deviceDetails },
        email: { to: email, subject: template.subject, html: template.html },
      })
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "New device alert failed")
    }
  }

  async sendNewLocationAlert(userId: string, email: string, locationDetails: Record<string, unknown>): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      if (!user) return
      const template = securityAlertNewLocationEmail({ name: user.name, email }, locationDetails)
      await notify({
        userId, type: "SECURITY",
        title: "Nouvelle localisation",
        body: `Connexion depuis ${locationDetails.country ?? "un nouveau pays"}`,
        data: { locationDetails },
        email: { to: email, subject: template.subject, html: template.html },
      })
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "New location alert failed")
    }
  }

  async sendSuspiciousLoginAlert(userId: string, email: string, riskScore: number, details: Record<string, unknown>): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      if (!user) return
      const template = securityAlertSuspiciousEmail({ name: user.name, email }, { riskScore, ...details })
      await notify({
        userId, type: "SECURITY",
        title: "Connexion suspecte",
        body: `Tentative de connexion suspecte detectee (score: ${riskScore})`,
        data: { riskScore, details },
        email: { to: email, subject: template.subject, html: template.html },
      })
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "Suspicious login alert failed")
    }
  }

  async send2FAEnabledAlert(userId: string, email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      if (!user) return
      const template = twoFactorEnabledEmail({ name: user.name, email })
      await notify({
        userId, type: "SECURITY",
        title: "2FA activee",
        body: "L'authentification a deux facteurs a ete activee sur votre compte.",
        email: { to: email, subject: template.subject, html: template.html },
      })
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "2FA enabled alert failed")
    }
  }

  async send2FADisabledAlert(userId: string, email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      if (!user) return
      const template = twoFactorDisabledEmail({ name: user.name, email })
      await notify({
        userId, type: "SECURITY",
        title: "2FA desactivee",
        body: "L'authentification a deux facteurs a ete desactivee sur votre compte.",
        email: { to: email, subject: template.subject, html: template.html },
      })
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "2FA disabled alert failed")
    }
  }

  async sendSessionRevokedAlert(userId: string, email: string, details: { count: number; maxSessions: number; activeCount: number }): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      if (!user) return
      await notify({
        userId, type: "SECURITY",
        title: "Session(s) revoquee(s)",
        body: `${details.count} session(s) la/les plus ancienne(s) revoquee(s) car ${details.activeCount} sessions depasse la limite de ${details.maxSessions}.`,
        data: details,
        email: { to: email, subject: "Session(s) revoquee(s)", html: `<p>Bonjour ${user.name},</p><p>${details.count} session(s) la/les plus ancienne(s) ont ete revoquees car vous avez ${details.activeCount} sessions actives, ce qui depasse la limite de ${details.maxSessions}.</p>` },
      })
    } catch (err: unknown) {
      log.error({ err, userId, errorCode: "INTEGRATION_ERROR" }, "Session revoked alert failed")
    }
  }
}

export const securityNotificationService = new SecurityNotificationService()
