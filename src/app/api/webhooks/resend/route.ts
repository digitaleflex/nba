import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@nba/lib/db"
import { sendEmail } from "@nba/lib/email"
import { markUserBounced, markUserComplained } from "@nba/lib/services/email-status"

export const runtime = "nodejs"

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

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
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 })
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
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
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

  // Deduplicate by Svix event id (unique constraint on email_events.svix_id)
  try {
    await prisma.emailEvent.create({
      data: { externalId: emailId, svixId, type, raw: event as object },
    })
  } catch (e: any) {
    if (e?.code === "P2002") {
      // Already processed — Resend retries at-least-once
      return NextResponse.json({ ok: true })
    }
  }

  const delivery = await prisma.notificationDelivery.findFirst({
    where: { channel: "EMAIL", externalId: emailId },
    select: { id: true, status: true },
  })

  if (delivery) {
    if (type === "email.bounced" || type === "email.complained") {
      const errorMessage =
        type === "email.complained"
          ? "Marqué comme spam (complaint)"
          : (event.data?.bounce?.message ?? "Bounce")
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: "BOUNCED", errorMessage },
      })
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
        data: { status: "FAILED", errorMessage: `email.failed: ${reason}` },
      })
      await alertAdmin(type, emailId, event.data)
    } else if (type === "email.delivered" && delivery.status !== "BOUNCED") {
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: "SENT" },
      })
    }
  }

  return NextResponse.json({ ok: true })
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
