import { prisma } from "../db"
import { getConnection as getRedis } from "../redis-pubsub"

const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8 // 8h vs 7j pour les users

export async function enforceAdminSessionLimit(userId: string, sessionId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } },
      },
    })

    if (!user) return
    const roleName = user.role?.name ?? ""
    if (roleName !== "ADMIN" && roleName !== "SUPER_ADMIN") return

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { createdAt: true },
    })
    if (!session) return

    const ageSeconds = (Date.now() - session.createdAt.getTime()) / 1000
    if (ageSeconds > ADMIN_SESSION_MAX_AGE) {
      await prisma.session.delete({ where: { id: sessionId } })
      const redis = getRedis()
      if (redis) {
        await redis.setex(`revoked:${sessionId}`, 86400, "1")
      }
    }
  } catch {
    // non-critical
  }
}
