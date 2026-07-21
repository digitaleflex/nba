import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { markUserBounced, markUserComplained } from "./email-status"
import { sendEmail } from "@nba/lib/email"

const log = logger.child({ module: "webhook-replay" })

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

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
