import { prisma } from "@nba/lib/db"
import { logAuditEvent } from "./audit"

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
