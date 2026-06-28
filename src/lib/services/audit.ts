import { prisma } from "@nba/lib/db"
import { headers } from "next/headers"

export async function logAuditEvent(params: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
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

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: (params.details as any) ?? undefined,
      ipAddress,
      userAgent,
    },
  })
}
