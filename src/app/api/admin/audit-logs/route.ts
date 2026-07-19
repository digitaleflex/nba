import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") ?? ""
    const action = searchParams.get("action") ?? ""
    const resourceType = searchParams.get("resourceType") ?? ""
    const resourceId = searchParams.get("resourceId") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (query) {
      where.OR = [
        { searchText: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ]
    }

    if (action) where.action = action
    if (resourceType) where.resourceType = resourceType
    if (resourceId) where.resourceId = resourceId

    const [rawLogs, total, distinctActions, distinctResourceTypes] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ select: { action: true }, distinct: ["action"], orderBy: { action: "asc" } }),
      prisma.auditLog.findMany({ select: { resourceType: true }, distinct: ["resourceType"], orderBy: { resourceType: "asc" } }),
    ])

    const logs = rawLogs.map((log) => {
      const d = log.details as Record<string, unknown> | null
      const resourceLabel = (d?.resourceLabel as string) ?? null
      const filteredDetails = { ...(d ?? {}) }
      delete filteredDetails.resourceLabel
      return {
        ...log,
        resourceLabel,
        details: Object.keys(filteredDetails).length > 0 ? filteredDetails : null,
        user: log.user ?? null,
      }
    })

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      filters: {
        actions: distinctActions.map((a) => a.action),
        resourceTypes: distinctResourceTypes.map((r) => r.resourceType),
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const days = 90
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const deleted = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({ deleted: deleted.count, olderThanDays: days })
  } catch (error) {
    return handleAuthError(error)
  }
}
