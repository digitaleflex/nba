import { prisma } from "@nba/lib/db"
import { headers } from "next/headers"
import { publishAuditEvent } from "@nba/lib/redis-pubsub"
import { computeHash } from "@nba/lib/audit/integrity"

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

export async function logAuditEvent(params: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  resourceLabel?: string
  details?: Record<string, unknown>
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

  const log = await prisma.$transaction(async (tx) => {
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

  // Publie l'événement en temps réel via Redis → WebSocket
  publishAuditEvent({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    details: details as Record<string, unknown> | null,
    userId: log.userId,
    createdAt: log.createdAt,
    ipAddress: log.ipAddress,
  })
}
