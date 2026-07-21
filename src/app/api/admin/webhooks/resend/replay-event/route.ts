import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { replayEmailEvent } from "@nba/lib/services/webhook-replay"
import { logAuditEvent } from "@nba/lib/services/audit"
import { validateOrThrow, replayEventSchema } from "@nba/lib/validations"
import { serverError } from "@nba/lib/api-error"
import { msg } from "@nba/lib/messages"

/**
 * Rejoue le processing d'un ancien event stocke dans email_events.
 * Utile pour rattraper un evenement apres un fix de bug, ou pour
 * reprocesser avec du nouveau code (ex: nouveau markUserBounced).
 *
 * Body : { eventId: string }  (id de email_events)
 *
 * Note : le cas "replay DLQ" est gere separement par
 * /api/admin/webhooks/dlq/[id]/replay.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("admin.webhooks.dlq")
    const body = await req.json()
    const { eventId } = validateOrThrow(replayEventSchema, body)

    const event = await prisma.emailEvent.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: msg.admin.EMAIL_EVENT_NOT_FOUND }, { status: 404 })
    }
    if (!event.externalId) {
      return NextResponse.json(
        { error: "event has no externalId (cannot match a delivery)" },
        { status: 400 },
      )
    }

    let parsed: any
    try {
      parsed = typeof event.raw === "string" ? JSON.parse(event.raw) : (event.raw as any)
    } catch (e: unknown) {
      return serverError(e, "POST /api/admin/webhooks/resend/replay-event")
    }

    const result = await replayEmailEvent({
      event: parsed,
      externalId: event.externalId,
      svixId: `${event.svixId}-replay-${Date.now()}`, // nouveau svixId pour eviter P2002
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "webhook.event.replayed",
      resourceType: "email_event",
      resourceId: eventId,
      details: { ...result, originalType: event.type },
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAuthError(error)
  }
}
