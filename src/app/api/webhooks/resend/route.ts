import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@nba/lib/db"
import { sendEmail } from "@nba/lib/email"
import { markUserBounced } from "@nba/lib/services/email-status"

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

  if (!svixId || !type || !emailId) {
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
