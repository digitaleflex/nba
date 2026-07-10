import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { AuthError } from "@nba/lib/auth-utils"

interface SignalPagination {
  page?: number
  limit?: number
  status?: string
}

export async function getSignals(options: SignalPagination = {}) {
  const session = await getServerSession()
  if (!session) throw new AuthError("Non autorisé", 401)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: {
        select: { name: true },
      },
    },
  })

  if (!user) throw new AuthError("Utilisateur non trouvé", 404)

  const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

  if (isAdmin) {
    const { page = 1, limit = 50, status } = options
    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }
    if (status) where.status = status

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          imageUrl: true,
          imageUrls: true,
          status: true,
          createdBy: true,
          publishedAt: true,
          scheduledAt: true,
          currentVersion: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { name: true, email: true },
          },
          audience: {
            select: {
              id: true,
              planId: true,
              plan: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.signal.count({ where }),
    ])

    return {
      signals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  const approvedRequests = await prisma.accessRequest.findMany({
    where: {
      userId: session.user.id,
      status: "APPROVED",
    },
    select: {
      planId: true,
    },
  })

  const activePlanIds = approvedRequests.map((r: any) => r.planId)
  if (activePlanIds.length === 0) {
    return []
  }

  return prisma.signal.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      audience: {
        some: {
          planId: { in: activePlanIds },
        },
      },
    },
    include: {
      creator: {
        select: { name: true },
      },
    },
    orderBy: { publishedAt: "desc" },
  })
}

export async function deleteSignal(id: string) {
  const session = await getServerSession()
  if (!session) throw new AuthError("Non autorisé", 401)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: {
        select: { name: true },
      },
    },
  })

  if (!user || (user.role.name !== "ADMIN" && user.role.name !== "SUPER_ADMIN")) {
    throw new AuthError("Accès refusé", 403)
  }

  return prisma.signal.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })
}

import { SignalPolicy } from "../policies/signal-policy"

export async function getSignalById(id: string) {
  const session = await getServerSession()
  if (!session) throw new AuthError("Non autorisé", 401)

  const hasAccess = await SignalPolicy.canView(session.user.id, id)
  if (!hasAccess) {
    throw new AuthError("Accès refusé", 403)
  }

  const signal = await prisma.signal.findUnique({
    where: { id, deletedAt: null },
    include: {
      creator: { select: { name: true } },
    },
  })

  return signal
}

export async function getSignalVersions(id: string, userId: string) {
  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) throw new Error("Signal introuvable")

  const allowed = await SignalPolicy.canUpdate(userId, signal)
  if (!allowed) throw new AuthError("Accès refusé", 403)

  return prisma.signalVersion.findMany({
    where: { signalId: id },
    orderBy: { version: "desc" },
    include: {
      updater: { select: { name: true } },
    },
  })
}

export async function getSignalStats(id: string, userId: string) {
  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) throw new Error("Signal introuvable")

  const allowed = await SignalPolicy.canUpdate(userId, signal)
  if (!allowed) throw new AuthError("Accès refusé", 403)

  const [uniqueMembers, aggregate, firstReadRow, reads] = await Promise.all([
    prisma.signalRead.count({ where: { signalId: id } }),
    prisma.signalRead.aggregate({
      where: { signalId: id },
      _sum: { viewCount: true },
    }),
    prisma.signalRead.findFirst({
      where: { signalId: id },
      orderBy: { readAt: "asc" },
      select: { readAt: true },
    }),
    prisma.signalRead.findMany({
      where: { signalId: id },
      orderBy: { readAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  return {
    uniqueMembers,
    totalViews: aggregate._sum.viewCount ?? 0,
    firstRead: firstReadRow?.readAt ?? null,
    reads: reads.map((r) => ({
      userName: r.user.name,
      userEmail: r.user.email,
      readAt: r.readAt,
      views: r.viewCount,
    })),
  }
}

