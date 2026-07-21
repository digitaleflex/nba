import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
import { prisma } from "@nba/lib/db"
import { sendEmail } from "@nba/lib/email"
import { markUserBounced, markUserComplained, markUserSuppressed, enqueueDlq } from "@nba/lib/services/email-webhooks"
import { msg } from "@nba/lib/messages"

export const runtime = "nodejs"

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

const DELAYED_BURST_THRESHOLD = 10 // au-dessus de 10 sur 1h = probleme systemique probable

interface ResendWebhookEvent {
  type?: string
  data?: {
    email_id?: string
    to?: string | string[]
    bounce?: { message?: string }
    [key: string]: unknown
  }
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, msg.webhook.NOT_CONFIGURED)
  }

  const payload = await req.text()
  const headers = {
    id: req.headers.get("svix-id") ?? "",
    timestamp: req.headers.get("svix-timestamp") ?? "",
    signature: req.headers.get("svix-signature") ?? "",
  }

  let event: ResendWebhookEvent
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder")
    event = resend.webhooks.verify({
      payload,
      headers,
      webhookSecret: secret,
    }) as unknown as ResendWebhookEvent
  } catch {
    return errorResponse(401, ErrorCode.AUTH_UNAUTHENTICATED, msg.webhook.INVALID_SIGNATURE)
  }

  const type = event.type
  const emailId = event.data?.email_id
  const svixId = headers.id

  if (!svixId || !type) {
    return NextResponse.json({ ok: true })
  }

  // Sprint 1 (#62) : Domain Events Resend (domain.created/updated/deleted)
  // Structure differente : pas d'email_id. Gere avant le check emailId.
  if (type.startsWith("domain.")) {
    await handleDomainEvent(type, event.data as Record<string, unknown> | undefined).catch(
      (err) => console.error("[resend-webhook] handleDomainEvent failed:", err),
    )
    return NextResponse.json({ ok: true })
  }

  if (!emailId) {
    return NextResponse.json({ ok: true })
  }

  // Sprint 2 (#64) : alerte admin throttlede si > 10 email.delivery_delayed sur 1h
  if (type === "email.delivery_delayed") {
    await checkDelayedBurst(emailId).catch((err) =>
      console.error("[resend-webhook] checkDelayedBurst failed:", err),
    )
  }

  // Deduplicate by Svix event id (unique constraint on email_events.svix_id)
  try {
    // Sprint 2 (#63) : extraire l'URL cliquée pour les events email.clicked
    const clickLink =
      type === "email.clicked"
        ? (event.data as any)?.click?.link ?? null
        : null
    await prisma.emailEvent.create({
      data: { externalId: emailId, svixId, type, raw: event as object, clickLink },
    })
  } catch (e: any) {
    if (e?.code === "P2002") {
      // Already processed — Resend retries at-least-once
      return NextResponse.json({ ok: true })
    }
  }

  const delivery = await prisma.notificationDelivery.findFirst({
    where: { channel: "EMAIL", externalId: emailId },
    select: { id: true, status: true, lastEventAt: true },
  })

  // Sprint 3 (#67) : DLQ - tout traitement post-store passe par ce try/catch.
  // Si une exception survient, l'event est mis en DLQ (au lieu d'etre perdu)
  // et on retourne 200 a Resend (pour eviter le retry qui dupliquerait la DLQ).
  try {
    await processDeliveryEvent({ type: type!, event, emailId, delivery });
  } catch (err: any) {
    console.error(`[resend-webhook] processDeliveryEvent failed for ${type} ${emailId}:`, err)
    try {
      await enqueueDlq({
        source: "resend",
        eventType: type!,
        svixId: svixId,
        externalId: emailId,
        payload: event,
        rawBody: payload,
        lastError: err?.message ?? String(err),
      })
    } catch (dlqErr: any) {
      console.error(`[resend-webhook] DLQ enqueue failed:`, dlqErr)
    }
  }

  return NextResponse.json({ ok: true })
}

/**
 * Traite un event de delivery (post-store dans email_events).
 * Tout throw ici est capture par le caller et mis en DLQ.
 */
async function processDeliveryEvent(args: {
  type: string
  event: ResendWebhookEvent
  emailId: string
  delivery: { id: string; status: string; lastEventAt: Date | null } | null
}) {
  const { type, event, emailId, delivery } = args
  if (!delivery) return

  // Sprint 2 (#65) : gestion des events hors-ordre
  // On lit le timestamp Resend (top-level created_at) et on ne met a jour
  // le statut que si l'event est plus recent que lastEventAt.
  // Les events TERMINAUX negatifs (bounced/complained/failed) s'appliquent
  // toujours, meme s'ils arrivent "tard".
  const eventTs = (event as any).created_at
    ? new Date((event as any).created_at as string)
    : new Date()
  const isStale =
    delivery.lastEventAt && eventTs.getTime() <= delivery.lastEventAt.getTime()
  const isTerminalNegative =
    type === "email.bounced" || type === "email.complained" || type === "email.failed"

  if (type === "email.bounced" || type === "email.complained") {
    const errorMessage =
      type === "email.complained"
        ? "Marqué comme spam (complaint)"
        : (event.data?.bounce?.message ?? "Bounce")
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "BOUNCED", errorMessage, lastEventAt: eventTs },
    })
    await notifySignalDeliveryUpdate(delivery.id)
    // Sprint 1 (#59) : auto-suppress le user sur bounce (1er = BOUNCED, 2e+ = INVALID)
    if (type === "email.bounced") {
      await markUserBounced(emailId).catch((err) =>
        console.error("[resend-webhook] markUserBounced failed:", err),
      )
    }
    // Sprint 1 (#60) : auto-suspend le user sur complaint (legale + anti-spam)
    if (type === "email.complained") {
      await markUserComplained(emailId).catch((err) =>
        console.error("[resend-webhook] markUserComplained failed:", err),
      )
    }
    await alertAdmin(type, emailId, event.data)
    } else if (type === "email.failed") {
      // Sprint 1 (#61) : echec d'envoi cote expediteur (cle API, quota, etc.)
      // Different d'un bounce (qui est cote destinataire).
      const reason =
        (event.data as any)?.reason ?? (event.data as any)?.error ?? "Failed"
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED", errorMessage: `email.failed: ${reason}`, lastEventAt: eventTs },
      })
      await notifySignalDeliveryUpdate(delivery.id)
      await alertAdmin(type, emailId, event.data)
    } else if (type === "email.suppressed") {
      // Bonus #74 : Resend refuse l'envoi (destinataire sur suppression list)
      // On marque le user SUPPRESSED -> skip les futurs envois
      await markUserSuppressed(emailId).catch((err) =>
        console.error("[resend-webhook] markUserSuppressed failed:", err),
      )
    } else if (type === "email.delivered" && delivery.status !== "BOUNCED" && !isStale) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "SENT", sentAt: eventTs, lastEventAt: eventTs },
    })
    await notifySignalDeliveryUpdate(delivery.id)
  } else if (isStale && !isTerminalNegative) {
    // Event non-terminal mais obsolete : on stocke dans email_events
    // (deja fait) mais on ne touche pas au statut.
    // Log debug pour visibilite.
    console.log(
      `[resend-webhook] Out-of-order event ignored: type=${type} eventTs=${eventTs.toISOString()} lastEventAt=${delivery.lastEventAt?.toISOString()}`,
    )
  } else if (type === "email.delivered" && isStale) {
    // Cas particulier : delivered en retard alors qu'on a deja un statut final negatif
    // On met a jour lastEventAt mais on ne change pas le statut.
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { lastEventAt: eventTs },
    })
  }
}

async function alertAdmin(type: string, emailId: string, data?: ResendWebhookEvent["data"]) {
  try {
    const to = Array.isArray(data?.to) ? data?.to.join(", ") : String(data?.to ?? "")
    await sendEmail(ADMIN_EMAIL, {
      subject: `[ALERTE] Email de signal ${type} — ${to}`,
      html: `<p>Un email de signal a été <strong>${type}</strong>.</p>
<p><b>Destinataire :</b> ${to}</p>
<p><b>Resend id :</b> ${emailId}</p>
<pre>${JSON.stringify(data ?? {}, null, 2)}</pre>`,
    })
  } catch {
    // L'alerte ne doit jamais bloquer le traitement du webhook
  }
}

/**
 * Notifie le canal temps réel admin (nba:signal:admin) qu'un statut de
 * livraison email a changé pour un signal, afin que le dashboard de
 * diffusion admin se rafraîchisse en direct. Fire-and-forget.
 */
async function notifySignalDeliveryUpdate(deliveryId: string) {
  try {
    const link = await prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      select: {
        notification: { select: { data: true } },
      },
    })
    const signalId = (link?.notification.data as Record<string, unknown> | null)?.signalId
    if (!signalId || typeof signalId !== "string") return
    const { publishSignalEvent } = await import("@nba/lib/redis-pubsub")
    await publishSignalEvent(`nba:signal:admin`, {
      type: "delivery_update",
      signalId,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[resend-webhook] notifySignalDeliveryUpdate failed:", err)
  }
}

/**
 * Sprint 1 (#62) : gestion des Domain Events Resend.
 * - domain.deleted : ALERTE CRITIQUE (tous les envois s'arretent si c'est notre domaine)
 * - domain.created / domain.updated : info dans audit
 */
async function handleDomainEvent(type: string, data: Record<string, unknown> | undefined) {
  const domainName = (data as any)?.name ?? (data as any)?.domain ?? "unknown"
  const subject = type === "domain.deleted"
    ? `[CRITIQUE] Domaine Resend supprime — ${domainName}`
    : `[INFO] Domaine Resend ${type} — ${domainName}`

  // Log audit pour tous les events
  await prisma.auditLog.create({
    data: {
      action: `resend.${type}`,
      resourceType: "resend_domain",
      details: { domain: domainName, payload: data ?? {} } as any,
    },
  })

  if (type === "domain.deleted") {
    // ALERTE CRITIQUE : si c'est notre domaine expediteur, plus rien ne part
    await sendEmail(ADMIN_EMAIL, {
      subject,
      html: `<p style="color:#dc2626;font-weight:bold">
        Un domaine Resend a ete supprime.
      </p>
      <p><b>Domaine :</b> ${domainName}</p>
      <p><b>Impact :</b> Si c'est <code>access.signauxx.com</code> ou un domaine expediteur,
      TOUS les envois emails sont bloques.</p>
      <p><b>Action immediate :</b> verifier le dashboard Resend, re-creer le domaine, reconfigurer les DNS (SPF/DKIM/DMARC).</p>
      <hr>
      <pre>${JSON.stringify(data ?? {}, null, 2)}</pre>`,
    })
  }
}

/**
 * Sprint 2 (#64) : detection d'un burst de delivery_delayed.
 * Alerte admin (throttlee 1 fois par heure via auditLog) si on depasse
 * DELAYED_BURST_THRESHOLD emails en retard sur 1h. Indique generalement
 * un probleme cote destinataires (inbox pleines, serveurs lents) ou
 * un incident SMTP.
 */
async function checkDelayedBurst(externalId: string) {
  const last1h = new Date(Date.now() - 60 * 60 * 1000)
  const count = await prisma.emailEvent.count({
    where: { type: "email.delivery_delayed", createdAt: { gte: last1h } },
  })
  if (count <= DELAYED_BURST_THRESHOLD) return

  // Throttle : alerte max 1 fois par heure
  const recentAlert = await prisma.auditLog.findFirst({
    where: {
      action: "email.delayed_burst_alert",
      createdAt: { gte: last1h },
    },
  })
  if (recentAlert) return

  await sendEmail(ADMIN_EMAIL, {
    subject: `[ALERTE] Burst de ${count} emails en retard sur 1h`,
    html: `<p><b>${count}</b> emails ont un retard de livraison sur la derniere heure
      (seuil: ${DELAYED_BURST_THRESHOLD}).</p>
      <p>Causes possibles : inbox destinataires pleines, incident SMTP cote serveur mail cible,
      ou probleme Resend transitoire.</p>
      <p>Voir le Centre de controle pour le detail et l'evolution.</p>
      <p><b>Dernier email concerne :</b> <code>${externalId}</code></p>`,
  })

  await prisma.auditLog.create({
    data: {
      action: "email.delayed_burst_alert",
      resourceType: "system",
      details: { count, threshold: DELAYED_BURST_THRESHOLD, lastExternalId: externalId } as any,
    },
  })
}
