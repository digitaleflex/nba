import { NextRequest, NextResponse } from "next/server"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { listDlq, dlqStats, batchAbandon } from "@nba/lib/services/email-webhooks"
import { logAuditEvent } from "@nba/lib/services/audit"
import { msg } from "@nba/lib/messages"

/**
 * Liste les entrees de la Dead Letter Queue des webhooks.
 * Query params : ?status=PENDING|REPLAYED|ABANDONED&limit=50
 *   - sans params : retourne liste (PENDING par defaut) + stats
 */
export async function GET(req: NextRequest) {
  try {
    await requirePermission("admin.webhooks.dlq")
    const { searchParams } = new URL(req.url)
    const status = (searchParams.get("status") ?? "PENDING") as
      | "PENDING"
      | "REPLAYED"
      | "ABANDONED"
    const limit = Number(searchParams.get("limit") ?? 50)

    const [items, stats] = await Promise.all([
      listDlq({ status, limit }),
      dlqStats(),
    ])

    return NextResponse.json({ items, stats })
  } catch (error) {
    return handleAuthError(error)
  }
}

/**
 * Operations group sur les entrees DLQ.
 * Body : { action: "abandon" | "retry", ids: string[], reason?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requirePermission("admin.webhooks.dlq")
    const { action, ids, reason } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs requis" }, { status: 400 })
    }

    if (action === "abandon") {
      const count = await batchAbandon(ids, reason ?? "Abandonné par admin")
      await logAuditEvent({
        userId: session.user.id,
        action: "webhook.dlq.batch_abandon",
        resourceType: "webhook_dlq",
        details: { count, ids, reason },
      })
      return NextResponse.json({ success: true, abandoned: count })
    }

    if (action === "retry") {
      const { replayEmailEvent } = await import("@nba/lib/services/email-webhooks")
      const { prisma } = await import("@nba/lib/db")
      let replayed = 0
      let failed = 0

      for (const id of ids) {
        try {
          const entry = await prisma.webhookDlq.findUnique({ where: { id } })
          if (!entry || entry.status !== "PENDING") continue

          let body: any
          try {
            body = entry.rawBody ? JSON.parse(entry.rawBody) : entry.payload
          } catch {
            body = entry.payload
          }

          const result = await replayEmailEvent({
            event: body,
            externalId: entry.externalId ?? "",
            svixId: entry.svixId ?? `dlq-batch-${entry.id}`,
          })

          if (result.ok) {
            await prisma.webhookDlq.update({
              where: { id },
              data: { status: "REPLAYED", replayedAt: new Date(), lastAttemptAt: new Date() },
            })
            replayed++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }

      await logAuditEvent({
        userId: session.user.id,
        action: "webhook.dlq.batch_retry",
        resourceType: "webhook_dlq",
        details: { ids, replayed, failed },
      })
      return NextResponse.json({ success: true, replayed, failed })
    }

    return NextResponse.json({ error: msg.validation.INVALID_REQUEST }, { status: 400 })
  } catch (error) {
    return handleAuthError(error)
  }
}
