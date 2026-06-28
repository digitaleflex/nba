import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const filter = searchParams.get("filter") || "all"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

    let activePlanIds: string[] = []
    if (!isAdmin) {
      const approvedRequests = await prisma.accessRequest.findMany({
        where: { userId: session.user.id, status: "APPROVED" },
        select: { planId: true },
      })
      activePlanIds = approvedRequests.map((r) => r.planId)
    }

    if (!isAdmin && activePlanIds.length === 0) {
      return NextResponse.json({
        signals: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        summary: { new: 0, unread: 0, group: null, lastUpdate: null },
      })
    }

    const where: any = { deletedAt: null }
    if (!isAdmin) {
      where.status = "PUBLISHED"
    }

    if (search) {
      where.content = { contains: search, mode: "insensitive" }
    }

    const now = new Date()
    if (filter === "today") {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      where.publishedAt = { gte: start }
    } else if (filter === "week") {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      where.publishedAt = { gte: weekAgo }
    } else if (filter === "unread") {
      where.reads = { none: { userId: session.user.id } }
    }

    let audienceFilter: any = undefined
    if (!isAdmin) {
      audienceFilter = { some: { planId: { in: activePlanIds } } }
    }
    if (filter === "forex") {
      audienceFilter = {
        some: {
          ...(audienceFilter?.some ?? {}),
          plan: { name: { contains: "Forex", mode: "insensitive" } },
        },
      }
    } else if (filter === "deriv") {
      audienceFilter = {
        some: {
          ...(audienceFilter?.some ?? {}),
          plan: { name: { contains: "Deriv", mode: "insensitive" } },
        },
      }
    } else if (filter === "forex+deriv") {
      audienceFilter = {
        some: {
          ...(audienceFilter?.some ?? {}),
          plan: { name: { in: ["Forex", "Deriv"] } },
        },
      }
    }
    if (audienceFilter) {
      where.audience = audienceFilter
    }

    const [total, signals] = await Promise.all([
      prisma.signal.count({ where }),
      prisma.signal.findMany({
        where,
        include: {
          creator: { select: { name: true } },
          audience: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
    ])

    const signalIds = signals.map((s) => s.id)

    const reads = await prisma.signalRead.findMany({
      where: { signalId: { in: signalIds }, userId: session.user.id },
    })
    const readMap = new Map(reads.map((r) => [r.signalId, r]))

    const allAccessibleWhere: any = { deletedAt: null }
    if (!isAdmin) {
      allAccessibleWhere.status = "PUBLISHED"
      allAccessibleWhere.audience = { some: { planId: { in: activePlanIds } } }
    }
    const [totalSignals, totalReadAll] = await Promise.all([
      prisma.signal.count({ where: allAccessibleWhere }),
      prisma.signalRead.count({
        where: { userId: session.user.id },
      }),
    ])

    const signalsWithStatus = signals.map((sig) => ({
      id: sig.id,
      content: sig.content,
      imageUrl: sig.imageUrl,
      imageUrls: sig.imageUrls,
      publishedAt: sig.publishedAt,
      createdAt: sig.createdAt,
      creatorName: sig.creator.name,
      audience: sig.audience.map((a) => a.plan.name),
      read: readMap.has(sig.id),
      viewCount: readMap.get(sig.id)?.viewCount ?? 0,
    }))

    const lastSignal = signals[0]

    return NextResponse.json({
      signals: signalsWithStatus,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        new: signalsWithStatus.filter((s) => !s.read).length,
        unread: Math.max(0, totalSignals - totalReadAll),
        group: isAdmin
          ? "Tous les signaux"
          : activePlanIds.length > 0
            ? (await prisma.subscriptionPlan.findMany({
                where: { id: { in: activePlanIds } },
                select: { name: true },
              })).map((p) => p.name).join(", ")
            : null,
        lastUpdate: lastSignal?.publishedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
