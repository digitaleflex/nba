import { msg } from "../../../lib/messages"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { AuthError } from "@nba/lib/auth-utils"

type SignalFilter = "all" | "unread" | "today" | "week" | "forex" | "indices" | "forex+indices" | "favorite" | "archive"

interface GetSignalsParams {
  search?: string
  filter?: SignalFilter
  page?: number
  limit?: number
  planId?: string
}

interface SignalListItem {
  id: string
  content: string
  imageUrl: string | null
  imageUrls: unknown
  publishedAt: Date | null
  createdAt: Date
  creatorName: string
  audience: string[]
  read: boolean
  viewCount: number
  favorited: boolean
  archived: boolean
}

interface GetSignalsResponse {
  signals: SignalListItem[]
  activePlans: { id: string; name: string }[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    new: number
    unread: number
    group: string | null
    lastUpdate: string | null
  }
}

/**
 * Get signals list for authenticated user with pagination and filtering.
 * Delegates to service layer - no Prisma access in route handlers.
 */
export async function getSignalsApi(params: GetSignalsParams): Promise<GetSignalsResponse> {
  const session = await getServerSession()
  if (!session) {
    throw new AuthError(msg.auth.UNAUTHORIZED, 401)
  }

  const { search = "", filter = "all", page = 1, limit = 20, planId } = params
  const skip = (page - 1) * limit
  const actualLimit = Math.min(50, Math.max(1, limit))

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isActive: true,
      role: { select: { name: true } },
      signalsAccessOverride: true,
    },
  })

  if (!user) {
    throw new AuthError(msg.member.NOT_FOUND_ALT, 404)
  }

  if (!user.isActive) {
    throw new AuthError(msg.auth.ACCOUNT_SUSPENDED, 403)
  }

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

  let activePlanIds: string[] = []
  if (!isAdmin && !user.signalsAccessOverride) {
    const approved = await prisma.accessRequest.findMany({
      where: { userId: session.user.id, status: "APPROVED" },
      select: { planId: true },
    })
    activePlanIds = approved.map((r) => r.planId)
  }

  if (!isAdmin && !user.signalsAccessOverride && activePlanIds.length === 0) {
    return {
      signals: [],
      activePlans: [],
      pagination: { page, limit: actualLimit, total: 0, totalPages: 0 },
      summary: { new: 0, unread: 0, group: null, lastUpdate: null },
    }
  }

  // Plans actifs de l'utilisateur (ou tous les plans pour un admin/override),
  // pour construire les onglets « multisection » côté client.
  const activePlans =
    isAdmin || user.signalsAccessOverride
      ? await prisma.subscriptionPlan.findMany({
          where: { isActive: true, deletedAt: null },
          select: { id: true, name: true },
          orderBy: { sortOrder: "asc" },
        })
      : await prisma.subscriptionPlan.findMany({
          where: { id: { in: activePlanIds } },
          select: { id: true, name: true },
          orderBy: { sortOrder: "asc" },
        })

  const filteredActivePlans = planId
    ? activePlans.filter((p) => p.id === planId)
    : activePlans

  const where: Record<string, unknown> = { deletedAt: null, status: "PUBLISHED" }

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
  } else if (filter === "favorite") {
    where.favorites = { some: { userId: session.user.id } }
  }

  if (filter === "archive") {
    where.archives = { some: { userId: session.user.id } }
  } else if (filter !== "favorite") {
    where.archives = { none: { userId: session.user.id } }
  }

  if (!isAdmin && !user.signalsAccessOverride) {
    where.audience = planId
      ? { some: { planId } }
      : { some: { planId: { in: activePlanIds } } }
  } else if (planId) {
    where.audience = { some: { planId } }
  }

  if (filter === "forex") {
    where.audience = {
      some: {
        ...((where.audience as any)?.some ?? {}),
        plan: { name: { contains: "Forex", mode: "insensitive" } },
      },
    }
  } else if (filter === "indices") {
    where.audience = {
      some: {
        ...((where.audience as any)?.some ?? {}),
        plan: { name: { contains: "Indices", mode: "insensitive" } },
      },
    }
  } else if (filter === "forex+indices") {
    where.audience = {
      some: {
        ...((where.audience as any)?.some ?? {}),
        plan: { name: { in: ["Forex", "Indices"] } },
      },
    }
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
      take: actualLimit,
    }),
  ])

  const signalIds = signals.map((s) => s.id)

  const [reads, favorites, archives] = await Promise.all([
    prisma.signalRead.findMany({
      where: { signalId: { in: signalIds }, userId: session.user.id },
    }),
    prisma.signalFavorite.findMany({
      where: { signalId: { in: signalIds }, userId: session.user.id },
    }),
    prisma.signalArchive.findMany({
      where: { signalId: { in: signalIds }, userId: session.user.id },
    }),
  ])
  const readMap = new Map(reads.map((r) => [r.signalId, r]))
  const favoriteSet = new Set(favorites.map((f) => f.signalId))
  const archiveSet = new Set(archives.map((a) => a.signalId))

  const allAccessibleWhere: Record<string, unknown> = { deletedAt: null, status: "PUBLISHED" }
  if (!isAdmin && !user.signalsAccessOverride) {
    allAccessibleWhere.audience = { some: { planId: { in: activePlanIds } } }
  }

  const [totalSignals, totalReadAll] = await Promise.all([
    prisma.signal.count({ where: allAccessibleWhere }),
    prisma.signalRead.count({
      where: { userId: session.user.id },
    }),
  ])

  const signalsWithStatus: SignalListItem[] = signals.map((sig) => ({
    id: sig.id,
    content: sig.content,
    imageUrl: sig.imageUrl,
    imageUrls: sig.imageUrls ?? [],
    publishedAt: sig.publishedAt,
    createdAt: sig.createdAt,
    creatorName: sig.creator.name,
    audience: sig.audience.map((a) => a.plan.name),
    read: readMap.has(sig.id),
    viewCount: readMap.get(sig.id)?.viewCount ?? 0,
    favorited: favoriteSet.has(sig.id),
    archived: archiveSet.has(sig.id),
  }))

  const lastSignal = signals[0]
  const group = planId
    ? filteredActivePlans[0]?.name ?? null
    : isAdmin || user.signalsAccessOverride
      ? "Tous les signaux"
      : filteredActivePlans.length > 0
        ? filteredActivePlans.map((p) => p.name).join(", ")
        : null

  return {
    signals: signalsWithStatus,
    activePlans: filteredActivePlans,
    pagination: { page, limit: actualLimit, total, totalPages: Math.ceil(total / actualLimit) },
    summary: {
      new: signalsWithStatus.filter((s) => !s.read).length,
      unread: Math.max(0, totalSignals - totalReadAll),
      group,
      lastUpdate: lastSignal?.publishedAt?.toISOString() ?? null,
    },
  }
}