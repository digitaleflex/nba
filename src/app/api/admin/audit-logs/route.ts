import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getCached } from "@nba/lib/cache"

const getAuditFilters = unstable_cache(
  async () => {
    const [distinctActions, distinctResourceTypes] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      }),
      prisma.auditLog.findMany({
        select: { resourceType: true },
        distinct: ["resourceType"],
        orderBy: { resourceType: "asc" },
      }),
    ])
    return {
      actions: distinctActions.map((a) => a.action),
      resourceTypes: distinctResourceTypes.map((r) => r.resourceType),
    }
  },
  ["audit-log-filters"],
  { revalidate: 300 }
)

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") ?? ""
    const action = searchParams.get("action") ?? ""
    const resourceType = searchParams.get("resourceType") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30")))
    const skip = (page - 1) * limit

    const where: any = {}

    if (query) {
      where.OR = [
        { action: { contains: query, mode: "insensitive" } },
        { resourceType: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ]
    }

    if (action) where.action = action
    if (resourceType) where.resourceType = resourceType

    const result = await getCached(
      `audit:${query}:${action}:${resourceType}:${page}:${limit}`,
      async () => {
        const [logs, total, filters] = await Promise.all([
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
          getAuditFilters(),
        ])

        return {
          logs,
          total,
          page,
          limit,
          filters,
        }
      },
      30,
    )

    return NextResponse.json(result)
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
