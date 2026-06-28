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

    const [logs, total] = await Promise.all([
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
    ])

    const distinctActions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    })

    const distinctResourceTypes = await prisma.auditLog.findMany({
      select: { resourceType: true },
      distinct: ["resourceType"],
      orderBy: { resourceType: "asc" },
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
