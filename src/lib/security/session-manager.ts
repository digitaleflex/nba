import { prisma } from "../db"
import type { DeviceTrustLevel } from "../../generated/prisma/client"

export interface PlanLimits {
  maxSessions: number
  maxDevices: number
  require2fa: boolean
}

export class SessionManager {

  static instance: SessionManager | null = null

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }
  async getPlanLimits(userId: string): Promise<PlanLimits> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accessRequests: {
          where: { status: "APPROVED" },
          select: {
            plan: {
              select: { maxSessions: true, maxDevices: true, require2fa: true },
            },
          },
          take: 1,
        },
      },
    })

    const plan = user?.accessRequests?.[0]?.plan
    return {
      maxSessions: plan?.maxSessions ?? 5,
      maxDevices: plan?.maxDevices ?? 3,
      require2fa: plan?.require2fa ?? false,
    }
  }

  async checkSessionLimit(userId: string): Promise<{ allowed: boolean; activeCount: number; maxSessions: number }> {
    const limits = await this.getPlanLimits(userId)

    const activeCount = await prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    })

    return {
      allowed: activeCount < limits.maxSessions,
      activeCount,
      maxSessions: limits.maxSessions,
    }
  }

  async checkDeviceLimit(userId: string): Promise<{ allowed: boolean; deviceCount: number; maxDevices: number }> {
    const limits = await this.getPlanLimits(userId)

    const deviceCount = await prisma.device.count({
      where: { userId },
    })

    return {
      allowed: deviceCount < limits.maxDevices,
      deviceCount,
      maxDevices: limits.maxDevices,
    }
  }

  async bindSessionToDevice(sessionId: string, deviceId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { deviceId },
    })
  }

  async updateSessionGeo(sessionId: string, geo: {
    country?: string
    city?: string
    latitude?: number
    longitude?: number
  }): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        country: geo.country,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    })
  }

  async updateRiskScore(sessionId: string, score: number, reason?: string): Promise<void> {
    const level = score <= 30 ? "LOW"
      : score <= 50 ? "MEDIUM"
      : score <= 70 ? "HIGH"
      : "CRITICAL"

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        riskScore: score,
        riskLevel: level,
        isHighRisk: score > 70,
        riskReason: reason,
      },
    })
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { id: sessionId, userId },
    })
  }

  async revokeAllSessions(userId: string, excludeSessionId?: string): Promise<number> {
    const where: Record<string, unknown> = { userId }
    if (excludeSessionId) {
      where.id = { not: excludeSessionId }
    }

    const result = await prisma.session.deleteMany({ where })
    return result.count
  }

  async rotateSessionToken(sessionId: string): Promise<string> {
    const newToken = crypto.randomUUID()
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        token: newToken,
        lastRotation: new Date(),
      },
    })
    return newToken
  }

  async revokeExcessSessions(userId: string, maxSessions: number): Promise<number> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "asc" },
      skip: maxSessions - 1,
    })

    if (sessions.length === 0) return 0

    const ids = sessions.map(s => s.id)
    await prisma.session.deleteMany({
      where: { id: { in: ids } },
    })

    return ids.length
  }

  async getSessionDevice(sessionId: string): Promise<{ id: string; trustLevel: DeviceTrustLevel } | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        device: {
          select: { id: true, trustLevel: true },
        },
      },
    })
    return session?.device ?? null
  }
}

export const sessionManager = SessionManager.getInstance()
