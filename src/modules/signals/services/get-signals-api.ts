import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { AuthError } from "@nba/lib/auth-utils"

type SignalFilter = "all" | "unread" | "today" | "week" | "forex" | "deriv" | "forex+deriv" | "favorite" | "archive"

interface GetSignalsParams {
  search?: string
  filter?: SignalFilter
  page?: number
  limit?: number
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
    throw new AuthError("Non autorisé", 401)
  }

  const { search = "", filter = "all", page = 1, limit = 20 } = params
  const skip = (page - 1) * limit
  const actualLimit = Math.min(50, Math.max(1, limit))

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: { select: { name: true } },
      country: true,
      phone: true,
      whatsapp: true,
    },
  })

  if (!user) {
    throw new AuthError("Utilisateur non trouvé", 404)
  }

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

  if (!isAdmin) {
    const isProfileComplete = 
      user.country && user.country.trim() !== "" &&
      user.phone && user.phone.trim() !== "" &&
      user.whatsapp && user.whatsapp.trim() !== ""

    if (!isProfileComplete) {
      throw new AuthError("Veuillez compléter votre profil à 100% pour accéder aux signaux", 403)
    }

    const [kycDoc, brokerVerif] = await Promise.all([
      prisma.kycDocument.findFirst({
        where: { userId: session.user.id },
        orderBy: { submittedAt: "desc" },
        select: { status: true },
      }),
      prisma.brokerVerification.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { status: true },
      }),
    ])

    const isKycApproved = kycDoc?.status === "APPROVED"
    const isBrokerApproved = brokerVerif?.status === "APPROVED"

    if (!isKycApproved || !isBrokerApproved) {
      throw new AuthError("Votre compte est en attente d'activation. KYC ou vérification Broker non validés.", 403)
    }
  }

  let activePlanIds: string[] = []
  if (!isAdmin) {
    const approvedRequests = await prisma.accessRequest.findMany({
      where: { userId: session.user.id, status: "APPROVED" },
      select: { planId: true },
    })
    activePlanIds = approvedRequests.map((r) => r.planId)
  }

  if (!isAdmin && activePlanIds.length === 0) {
    return {
      signals: [],
      pagination: { page, limit: actualLimit, total: 0, totalPages: 0 },
      summary: { new: 0, unread: 0, group: null, lastUpdate: null },
    }
  }

  const where: Record<string, unknown> = { deletedAt: null }
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
  } else if (filter === "favorite") {
    where.favorites = { some: { userId: session.user.id } }
  }

  // Exclure les archives par défaut, sauf si on demande explicitement l'onglet archive
  if (filter === "archive") {
    where.archives = { some: { userId: session.user.id } }
  } else {
    where.archives = { none: { userId: session.user.id } }
  }

  let audienceFilter: Record<string, unknown> | undefined
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

  const allAccessibleWhere: Record<string, unknown> = { deletedAt: null }
  if (!isAdmin) {
    allAccessibleWhere.status = "PUBLISHED"
    allAccessibleWhere.audience = { some: { planId: { in: activePlanIds } } }
  }

  const [totalSignals, totalReadAll, planNames] = await Promise.all([
    prisma.signal.count({ where: allAccessibleWhere }),
    prisma.signalRead.count({
      where: { userId: session.user.id },
    }),
    activePlanIds.length > 0 && !isAdmin
      ? prisma.subscriptionPlan.findMany({
          where: { id: { in: activePlanIds } },
          select: { name: true },
        })
      : Promise.resolve([]),
  ])

  const signalsWithStatus: SignalListItem[] = signals.map((sig) => ({
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
    favorited: favoriteSet.has(sig.id),
    archived: archiveSet.has(sig.id),
  }))

  const lastSignal = signals[0]
  const group = isAdmin
    ? "Tous les signaux"
    : planNames.length > 0
      ? planNames.map((p) => p.name).join(", ")
      : null

  return {
    signals: signalsWithStatus,
    pagination: { page, limit: actualLimit, total, totalPages: Math.ceil(total / actualLimit) },
    summary: {
      new: signalsWithStatus.filter((s) => !s.read).length,
      unread: Math.max(0, totalSignals - totalReadAll),
      group,
      lastUpdate: lastSignal?.publishedAt?.toISOString() ?? null,
    },
  }
}