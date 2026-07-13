import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { markDlqReplayed, abandonDlq } from "@nba/lib/services/webhook-dlq"
import { logAuditEvent } from "@nba/lib/services/audit"

/**
 * Rejoue une entree DLQ : re-publie l'event dans la logique applicative
 * (sans re-verifier la signature, car l'event a deja ete accepte a l'origine).
 * En cas de succes -> REPLAYED, sinon -> reste PENDING (attempts++).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("admin.webhooks.dlq")
    const { id } = await params

    const dlq = await prisma.webhookDlq.findUnique({ where: { id } })
    if (!dlq) {
      return NextResponse.json({ error: "DLQ entry not found" }, { status: 404 })
    }
    if (dlq.status !== "PENDING") {
      return NextResponse.json(
        { error: `DLQ entry is ${dlq.status}, only PENDING can be replayed` },
        { status: 409 },
      )
    }

    // Re-parse le payload (rawBody de preference, sinon payload)
    let event: any
    try {
      const body = dlq.rawBody ?? JSON.stringify(dlq.payload)
      event = JSON.parse(body)
    } catch (e: any) {
      await markDlqReplayed(id, false)
      return NextResponse.json(
        { ok: false, error: `Invalid payload: ${e.message}` },
        { status: 500 },
      )
    }

    const type = event.type
    const emailId = event.data?.email_id

    if (!type) {
      await markDlqReplayed(id, false)
      return NextResponse.json({ ok: false, error: "Missing type" }, { status: 500 })
    }

    // Domain events : on marque REPLAYED directement (audit only, non critique)
    if (type.startsWith("domain.")) {
      await markDlqReplayed(id, true)
      await logAuditEvent({
        userId: session.user.id,
        action: "webhook.dlq.replayed",
        resourceType: "webhook_dlq",
        resourceId: id,
        details: { type, note: "domain event - audit only" },
      })
      return NextResponse.json({ ok: true, replayed: true, type })
    }

    if (!emailId) {
      await markDlqReplayed(id, false)
      return NextResponse.json({ ok: false, error: "Missing email_id" }, { status: 500 })
    }

    // Email events : on rejoue le processing directement.
    // Note : on re-insert dans email_events peut echouer avec P2002 (deja la),
    // on l'ignore (le but est de re-jouer les effets de bord, pas le store).
    try {
      const { markUserBounced, markUserComplained } = await import(
        "@nba/lib/services/email-status"
      )
      const { sendEmail } = await import("@nba/lib/email")

      const ADMIN_EMAIL =
        process.env.ADMIN_EMAIL ??
        process.env.RESEND_FROM_EMAIL ??
        "admin@signauxx.com"

      const delivery = await prisma.notificationDelivery.findFirst({
        where: { channel: "EMAIL", externalId: emailId },
        select: { id: true, status: true, lastEventAt: true },
      })

      if (!delivery) {
        await markDlqReplayed(id, false)
        return NextResponse.json(
          { ok: false, error: "No matching notification_delivery (may have been deleted)" },
          { status: 410 },
        )
      }

      // Re-store l'event (idempotent via svix_id unique) - ignore P2002
      try {
        await prisma.emailEvent.create({
          data: {
            externalId: emailId,
            svixId: dlq.svixId ?? `dlq-replay-${id}`,
            type,
            raw: event,
            clickLink:
              type === "email.clicked"
                ? (event.data?.click?.link ?? null)
                : null,
          },
        })
      } catch (e: any) {
        if (e?.code !== "P2002") throw e
      }

      const eventTs = event.created_at ? new Date(event.created_at) : new Date()
      const errorMessage =
        type === "email.complained"
          ? "Marqué comme spam (complaint)"
          : (event.data?.bounce?.message ?? "Bounce")

      if (type === "email.bounced" || type === "email.complained") {
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "BOUNCED", errorMessage, lastEventAt: eventTs },
        })
        if (type === "email.bounced") {
          await markUserBounced(emailId).catch(() => {})
        } else {
          await markUserComplained(emailId).catch(() => {})
        }
        const to = Array.isArray(event.data?.to) ? event.data.to.join(", ") : String(event.data?.to ?? "")
        await sendEmail(ADMIN_EMAIL, {
          subject: `[ALERTE] Email de signal ${type} (replay) — ${to}`,
          html: `<p>Replay webhook DLQ <code>${id}</code></p>
<p><b>Type :</b> ${type}</p>
<p><b>Destinataire :</b> ${to}</p>
<p><b>Resend id :</b> ${emailId}</p>`,
        })
      } else if (type === "email.failed") {
        const reason = event.data?.reason ?? event.data?.error ?? "Failed"
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "FAILED", errorMessage: `email.failed: ${reason}`, lastEventAt: eventTs },
        })
        await sendEmail(ADMIN_EMAIL, {
          subject: `[ALERTE] Email de signal ${type} (replay) — ${emailId}`,
          html: `<p>Replay webhook DLQ <code>${id}</code></p>
<p>email.failed: ${reason}</p>`,
        })
      } else if (type === "email.delivered" && delivery.status !== "BOUNCED") {
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "SENT", sentAt: eventTs, lastEventAt: eventTs },
        })
      }

      await markDlqReplayed(id, true)
      await logAuditEvent({
        userId: session.user.id,
        action: "webhook.dlq.replayed",
        resourceType: "webhook_dlq",
        resourceId: id,
        details: { type, emailId, attempts: dlq.attempts + 1 },
      })

      return NextResponse.json({ ok: true, replayed: true, type, emailId })
    } catch (err: any) {
      await markDlqReplayed(id, false)
      await logAuditEvent({
        userId: session.user.id,
        action: "webhook.dlq.replay_failed",
        resourceType: "webhook_dlq",
        resourceId: id,
        details: { error: err?.message },
      })
      return NextResponse.json(
        { ok: false, error: `Replay failed: ${err?.message}` },
        { status: 500 },
      )
    }
  } catch (error) {
    return handleAuthError(error)
  }
}
