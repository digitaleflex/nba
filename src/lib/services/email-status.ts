import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { logAuditEvent } from "./audit"

const log = logger.child({ module: "email-status" })

/**
 * Marque le user comme BOUNCED (1er bounce) ou INVALID (>= 2 bounces) suite a
 * un evenement `email.bounced` Resend. Idempotent.
 *
 * Resolution du user : on remonte la chaine email_event -> delivery -> notification -> user.
 *
 * @returns { userId, email, newStatus, bounceCount } ou null si user introuvable
 */
export async function markUserBounced(
  externalId: string,
  triggeredBy?: string,
): Promise<
  | {
      userId: string
      email: string
      newStatus: "BOUNCED" | "INVALID"
      bounceCount: number
    }
  | null
> {
  // 1. Trouver la livraison associee
  const delivery = await prisma.notificationDelivery.findFirst({
    where: { channel: "EMAIL", externalId },
    select: {
      id: true,
      notification: { select: { userId: true, user: { select: { email: true, name: true } } } },
    },
  })
  if (!delivery?.notification?.userId) return null

  const userId = delivery.notification.userId
  const userEmail = delivery.notification.user.email

  // 2. Compter les bounces precedents pour ce user
  // (EmailEvent n'a pas de relation directe vers NotificationDelivery dans le schema,
  // on passe par deliveryId -> notification -> userId)
  const userDeliveryIds = await prisma.notificationDelivery.findMany({
    where: { channel: "EMAIL", notification: { userId } },
    select: { id: true },
  })
  const bounceCount =
    userDeliveryIds.length === 0
      ? 0
      : await prisma.emailEvent.count({
          where: {
            type: "email.bounced",
            deliveryId: { in: userDeliveryIds.map((d) => d.id) },
          },
        })

  // 3. Statut cible : BOUNCED au 1er, INVALID au 2e+
  const newStatus: "BOUNCED" | "INVALID" = bounceCount >= 2 ? "INVALID" : "BOUNCED"

  // 4. Update user (seulement si changement de statut, idempotent)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailStatus: true },
  })
  if (!user) return null

  // Ne pas "downgrader" un statut plus severe (COMPLAINED reste prioritaire)
  const isDowngrade =
    user.emailStatus === "COMPLAINED" ||
    user.emailStatus === "SUPPRESSED" ||
    user.emailStatus === "INVALID"

  if (user.emailStatus !== newStatus && !isDowngrade) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailStatus: newStatus, emailStatusAt: new Date() },
    })

    await logAuditEvent({
      userId: triggeredBy,
      action: "user.email_status_changed",
      resourceType: "user",
      resourceId: userId,
      details: {
        from: user.emailStatus,
        to: newStatus,
        reason: "email.bounced",
        bounceCount,
        email: userEmail,
      },
    })
  }

  return { userId, email: userEmail, newStatus, bounceCount }
}

/**
 * Marque le user comme COMPLAINED et **suspend** son compte suite a un
 * evenement `email.complained` Resend. C'est une mesure legale/anti-spam :
 * un membre qui marque nos emails comme spam ne doit plus recevoir aucun
 * envoi, et son acces est bloque.
 *
 * Idempotent. Cree un audit log dedie.
 *
 * @returns { userId, email } ou null si user introuvable
 */
export async function markUserComplained(
  externalId: string,
  triggeredBy?: string,
): Promise<{ userId: string; email: string; wasActive: boolean } | null> {
  const delivery = await prisma.notificationDelivery.findFirst({
    where: { channel: "EMAIL", externalId },
    select: {
      id: true,
      notification: { select: { userId: true, user: { select: { email: true, name: true, isActive: true, emailStatus: true } } } },
    },
  })
  if (!delivery?.notification?.userId) return null

  const userId = delivery.notification.userId
  const u = delivery.notification.user

  // Pas de "downgrade" : si deja plus severe (deja COMPLAINED, SUPPRESSED ou INVALID), skip
  const alreadySevere =
    u.emailStatus === "COMPLAINED" ||
    u.emailStatus === "SUPPRESSED" ||
    u.emailStatus === "INVALID"

  if (!alreadySevere) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailStatus: "COMPLAINED",
        emailStatusAt: new Date(),
        isActive: false,
      },
    })

    // Révoquer les sessions + déconnecter le WebSocket
    await prisma.session.deleteMany({ where: { userId } })
    try {
      const { getRedisConnection } = await import("@nba/lib/queue")
      const redis = getRedisConnection()
      if (redis) {
        await redis.publish("nba:ws:control", `reset:${userId}`)
      }
    } catch {
      log.warn({ userId }, "Failed to publish WS disconnect for email status change")
    }

    await logAuditEvent({
      userId: triggeredBy,
      action: "user.email_status_changed",
      resourceType: "user",
      resourceId: userId,
      details: {
        from: u.emailStatus,
        to: "COMPLAINED",
        reason: "email.complained",
        suspended: true,
        previousActive: u.isActive,
        email: u.email,
      },
    })
  }

  return { userId, email: u.email, wasActive: u.isActive }
}

/**
 * Bonus #74 : marque le user comme SUPPRESSED suite a un
 * evenement `email.suppressed` Resend. Resend refuse d'envoyer aux
 * adresses sur sa suppression list (hard bounces repetes, plaintes,
 * etc.). On marque le user pour skip les futurs envois et eviter
 * de polluer le reputation score.
 *
 * Idempotent. Cree un audit log.
 */
export async function markUserSuppressed(
  externalId: string,
  triggeredBy?: string,
): Promise<{ userId: string; email: string; wasActive: boolean } | null> {
  const delivery = await prisma.notificationDelivery.findFirst({
    where: { channel: "EMAIL", externalId },
    select: {
      id: true,
      notification: {
        select: {
          userId: true,
          user: { select: { email: true, name: true, isActive: true, emailStatus: true } },
        },
      },
    },
  })
  if (!delivery?.notification?.userId) return null

  const userId = delivery.notification.userId
  const u = delivery.notification.user

  // Ne pas "downgrader" : COMPLAINED / INVALID restent prioritaires
  const alreadySevere = u.emailStatus === "COMPLAINED" || u.emailStatus === "INVALID"

  if (!alreadySevere && u.emailStatus !== "SUPPRESSED") {
    await prisma.user.update({
      where: { id: userId },
      data: { emailStatus: "SUPPRESSED", emailStatusAt: new Date() },
    })

    await logAuditEvent({
      userId: triggeredBy,
      action: "user.email_status_changed",
      resourceType: "user",
      resourceId: userId,
      details: {
        from: u.emailStatus,
        to: "SUPPRESSED",
        reason: "email.suppressed",
        previousActive: u.isActive,
        email: u.email,
      },
    })
  }

  return { userId, email: u.email, wasActive: u.isActive }
}
