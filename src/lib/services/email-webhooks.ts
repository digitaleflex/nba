import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { logAuditEvent } from "./audit"
import { sendEmail } from "@nba/lib/email"

const log = logger.child({ module: "email-webhooks" })

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

// ---------------------------------------------------------------------------
// User email status functions
// ---------------------------------------------------------------------------

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
      log.warn({ userId, errorCode: "DATABASE_CONNECTION" }, "Failed to publish WS disconnect for email status change")
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

// ---------------------------------------------------------------------------
// DLQ functions
// ---------------------------------------------------------------------------

/**
 * Service de gestion de la Dead Letter Queue (DLQ) des webhooks.
 * Un event est mis en DLQ quand le traitement webhook echoue
 * (exception, donnees invalides, etc.) apres l'insertion dans email_events.
 *
 * - Status PENDING : a retenter (manuellement ou via cron)
 * - Status REPLAYED : rejoue avec succes
 * - Status ABANDONED : abandonne definitivement
 */

export interface DlqInput {
  source?: string
  eventType: string
  svixId?: string | null
  externalId?: string | null
  payload: unknown
  rawBody?: string | null
  lastError: string
}

/**
 * Insere un event en DLQ. Idempotent sur svixId (evite les doublons
 * apres retry Resend).
 */
export async function enqueueDlq(input: DlqInput): Promise<{ id: string; deduped: boolean }> {
  if (input.svixId) {
    const existing = await prisma.webhookDlq.findFirst({
      where: { svixId: input.svixId },
      select: { id: true },
    })
    if (existing) return { id: existing.id, deduped: true }
  }
  const row = await prisma.webhookDlq.create({
    data: {
      source: input.source ?? "resend",
      eventType: input.eventType,
      svixId: input.svixId ?? null,
      externalId: input.externalId ?? null,
      payload: input.payload as any,
      rawBody: input.rawBody ?? null,
      lastError: input.lastError,
      lastAttemptAt: new Date(),
      attempts: 1,
    },
  })
  return { id: row.id, deduped: false }
}

/**
 * Liste les entrees DLQ (admin).
 */
export async function listDlq(opts: {
  status?: "PENDING" | "REPLAYED" | "ABANDONED"
  limit?: number
} = {}) {
  return prisma.webhookDlq.findMany({
    where: { status: opts.status },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
  })
}

/**
 * Statistiques DLQ.
 */
export async function dlqStats() {
  const [pending, replayed, abandoned, oldestPending] = await Promise.all([
    prisma.webhookDlq.count({ where: { status: "PENDING" } }),
    prisma.webhookDlq.count({ where: { status: "REPLAYED" } }),
    prisma.webhookDlq.count({ where: { status: "ABANDONED" } }),
    prisma.webhookDlq.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ])
  return { pending, replayed, abandoned, oldestPendingAt: oldestPending?.createdAt ?? null }
}

/**
 * Marque une entree comme rejouee.
 */
export async function markDlqReplayed(id: string, success: boolean) {
  return prisma.webhookDlq.update({
    where: { id },
    data: {
      status: success ? "REPLAYED" : "PENDING",
      replayedAt: success ? new Date() : null,
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  })
}

/**
 * Abandonne une entree DLQ.
 */
export async function abandonDlq(id: string, reason: string) {
  await prisma.webhookDlq.update({
    where: { id },
    data: { status: "ABANDONED", abandonedAt: new Date(), lastError: reason },
  })
  await logAuditEvent({
    action: "webhook.dlq.abandoned",
    resourceType: "webhook_dlq",
    resourceId: id,
    details: { reason },
  })
}

const DLQ_AUTO_RETRY_MIN_AGE_MINUTES = 60
const DLQ_AUTO_RETRY_MAX_ATTEMPTS = 3

export async function listPendingForRetry(opts?: {
  minAgeMinutes?: number
  maxAttempts?: number
  limit?: number
}) {
  const minAge = opts?.minAgeMinutes ?? DLQ_AUTO_RETRY_MIN_AGE_MINUTES
  const maxAttempts = opts?.maxAttempts ?? DLQ_AUTO_RETRY_MAX_ATTEMPTS

  return prisma.webhookDlq.findMany({
    where: {
      status: "PENDING",
      attempts: { lt: maxAttempts },
      createdAt: { lte: new Date(Date.now() - minAge * 60_000) },
    },
    orderBy: { createdAt: "asc" },
    take: opts?.limit ?? 20,
  })
}

export async function incrementAttempts(id: string, error: string) {
  return prisma.webhookDlq.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
      lastError: error,
    },
  })
}

export async function batchAbandon(ids: string[], reason: string) {
  const [count] = await Promise.all([
    prisma.webhookDlq.updateMany({
      where: { id: { in: ids }, status: "PENDING" },
      data: { status: "ABANDONED", abandonedAt: new Date(), lastError: reason },
    }),
    ...ids.map((id) =>
      logAuditEvent({
        action: "webhook.dlq.abandoned",
        resourceType: "webhook_dlq",
        resourceId: id,
        details: { reason, batch: true },
      }),
    ),
  ])
  return count
}

export async function escalateDlq(ids: string[]) {
  await prisma.webhookDlq.updateMany({
    where: { id: { in: ids }, status: "PENDING" },
    data: { lastError: "ESCALATED — exhausted auto-retry" },
  })
}

// ---------------------------------------------------------------------------
// Replay function
// ---------------------------------------------------------------------------

export interface ReplayResult {
  ok: boolean
  message: string
  deliveryUpdated: boolean
  deliveryStatus?: string
}

/**
 * Rejoue le processing d'un event email (bounced, complained, failed,
 * delivered) identifie par son Resend externalId.
 *
 * Re-utilise la logique du webhook Resend mais sans re-verifier la
 * signature (l'event est deja sur et provient d'une source de confiance :
 * email_events ou webhook_dlq).
 *
 * Insere d'abord dans email_events (idempotent via svixId), puis met
 * a jour notification_delivery. Utilise pour les replays DLQ et
 * les replays depuis email_events (backfill).
 */
export async function replayEmailEvent(args: {
  event: any
  externalId: string
  svixId: string
  deliveryIdOverride?: string
}): Promise<ReplayResult> {
  const { event, externalId, svixId, deliveryIdOverride } = args
  const type = event.type

  // 1. Store l'event (idempotent via svix_id unique)
  try {
    await prisma.emailEvent.create({
      data: {
        externalId,
        svixId,
        type,
        raw: event,
        clickLink: type === "email.clicked" ? (event.data?.click?.link ?? null) : null,
      },
    })
  } catch (e: any) {
    if (e?.code !== "P2002") throw e
    // P2002 = deja la, on continue (le but est de re-jouer les effets)
  }

  // 2. Trouver la delivery
  const delivery = deliveryIdOverride
    ? await prisma.notificationDelivery.findUnique({
        where: { id: deliveryIdOverride },
        select: { id: true, status: true, lastEventAt: true },
      })
    : await prisma.notificationDelivery.findFirst({
        where: { channel: "EMAIL", externalId },
        select: { id: true, status: true, lastEventAt: true },
      })

  if (!delivery) {
    return { ok: false, message: "No matching notification_delivery", deliveryUpdated: false }
  }

  const eventTs = event.created_at ? new Date(event.created_at) : new Date()

  // 3. Mettre a jour selon le type
  if (type === "email.bounced" || type === "email.complained") {
    const errorMessage =
      type === "email.complained"
        ? "Marqué comme spam (complaint)"
        : (event.data?.bounce?.message ?? "Bounce")
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "BOUNCED", errorMessage, lastEventAt: eventTs },
    })
    if (type === "email.bounced") {
      await markUserBounced(externalId).catch((err) => {
        log.warn({ err, externalId, errorCode: "INTEGRATION_ERROR" }, "markUserBounced failed during replay")
      })
    } else {
      await markUserComplained(externalId).catch((err) => {
        log.warn({ err, externalId, errorCode: "INTEGRATION_ERROR" }, "markUserComplained failed during replay")
      })
    }
    const to = Array.isArray(event.data?.to) ? event.data.to.join(", ") : String(event.data?.to ?? "")
    await sendEmail(ADMIN_EMAIL, {
      subject: `[ALERTE] Email de signal ${type} (replay) — ${to}`,
      html: `<p>Replay webhook</p>
<p><b>Type :</b> ${type}</p>
<p><b>Destinataire :</b> ${to}</p>
<p><b>Resend id :</b> ${externalId}</p>
<pre>${JSON.stringify(event, null, 2).slice(0, 800)}</pre>`,
    })
    return { ok: true, message: `${type} replayed`, deliveryUpdated: true, deliveryStatus: "BOUNCED" }
  }

  if (type === "email.failed") {
    const reason = event.data?.reason ?? event.data?.error ?? "Failed"
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", errorMessage: `email.failed: ${reason}`, lastEventAt: eventTs },
    })
    await sendEmail(ADMIN_EMAIL, {
      subject: `[ALERTE] Email de signal ${type} (replay) — ${externalId}`,
      html: `<p>Replay webhook email.failed: ${reason}</p>`,
    })
    return { ok: true, message: "email.failed replayed", deliveryUpdated: true, deliveryStatus: "FAILED" }
  }

  if (type === "email.delivered" && delivery.status !== "BOUNCED") {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "SENT", sentAt: eventTs, lastEventAt: eventTs },
    })
    return { ok: true, message: "email.delivered replayed", deliveryUpdated: true, deliveryStatus: "SENT" }
  }

  return { ok: true, message: "Event stored, no delivery update needed", deliveryUpdated: false }
}
