import { prisma, withRetryTransaction } from "@nba/lib/db"
import { headers } from "next/headers"
import { publishAuditEvent } from "@nba/lib/redis-pubsub"
import { computeHash } from "@nba/lib/audit/integrity"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "audit" })

function buildSearchText(action: string, resourceType: string, details?: Record<string, unknown>): string {
  const parts = [action, resourceType]
  if (details?.resourceLabel) parts.push(String(details.resourceLabel))
  if (details?.userName) parts.push(String(details.userName))
  if (details?.userEmail) parts.push(String(details.userEmail))
  if (details?.email) parts.push(String(details.email))
  if (details?.planName) parts.push(String(details.planName))
  if (details?.reason) parts.push(String(details.reason))
  if (details?.notes) parts.push(String(details.notes))
  if (details?.domain) parts.push(String(details.domain))
  return parts.join(" ").toLowerCase()
}

function inferSeverity(action: string): string {
  const key = action.toLowerCase()
  if (key.includes("deleted") || key.includes("banned") || key.includes("suspended") || key.includes("failed") || key.includes("abandoned") || key.includes("rejected") || key.includes("complained") || key.includes("bounced")) {
    return "error"
  }
  if (key.includes("updated") || key.includes("changed") || key.includes("revoked") || key.includes("retried") || key.includes("replayed") || key.includes("purged") || key.includes("override")) {
    return "warning"
  }
  return "info"
}

export async function logAuditEvent(params: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  resourceLabel?: string
  details?: Record<string, unknown>
  severity?: string
}) {
  let ipAddress: string | undefined
  let userAgent: string | undefined

  try {
    const h = await headers()
    ipAddress = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined
    userAgent = h.get("user-agent") ?? undefined
  } catch {
    // headers() throws if called outside a request context
  }

  const details = { ...(params.details ?? {}) } as Record<string, unknown>
  if (params.resourceLabel) {
    details.resourceLabel = params.resourceLabel
  }

  const severity = params.severity ?? inferSeverity(params.action)

  const log = await withRetryTransaction(async (tx) => {
    const last = await tx.auditLog.findFirst({
      where: { hash: { not: null } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { hash: true },
    })

    const entry = await tx.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: details as any,
        searchText: buildSearchText(params.action, params.resourceType, details),
        ipAddress,
        userAgent,
        previousHash: last?.hash ?? null,
        severity,
      },
    })

    const hash = computeHash({
      previousHash: entry.previousHash,
      id: entry.id,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: details as Record<string, unknown> | null,
      ipAddress: entry.ipAddress,
      createdAt: entry.createdAt,
    })

    return tx.auditLog.update({
      where: { id: entry.id },
      data: { hash },
    })
  })

  publishAuditEvent({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    details: details as Record<string, unknown> | null,
    userId: log.userId,
    createdAt: log.createdAt,
    ipAddress: log.ipAddress,
    severity,
  })
}

const AUDIT_DELETE_CHUNK_SIZE = 1000

export async function deleteOldAuditLogs(cutoff: Date): Promise<number> {
  let total = 0
  let deleted = 0

  do {
    const batch = await prisma.auditLog.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: AUDIT_DELETE_CHUNK_SIZE,
    })

    if (batch.length === 0) break

    const ids = batch.map((r) => r.id)
    const result = await prisma.auditLog.deleteMany({
      where: { id: { in: ids } },
    })
    deleted = result.count
    total += deleted
    log.info({ chunkSize: batch.length, deleted, total }, "Audit log cleanup chunk")
  } while (deleted >= AUDIT_DELETE_CHUNK_SIZE)

  return total
}

export async function auditHealth() {
  const [total, bySeverity, oldest, newest, hashGaps] = await Promise.all([
    prisma.auditLog.count(),
    Promise.all(
      ["info", "warning", "error"].map((s) =>
        prisma.auditLog.count({ where: { severity: s } }).then((c) => ({ severity: s, count: c })),
      ),
    ),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.auditLog.count({ where: { hash: null } }),
  ])

  const oldestPending = await prisma.auditLog.findFirst({
    where: { hash: null },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  })

  return {
    total,
    bySeverity,
    oldestAt: oldest?.createdAt ?? null,
    newestAt: newest?.createdAt ?? null,
    hashGaps,
    oldestHashGapAt: oldestPending?.createdAt ?? null,
  }
}
