import { prisma } from "@nba/lib/db"
import { logAuditEvent } from "./audit"

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
