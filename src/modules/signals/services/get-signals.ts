import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { AuthError } from "@nba/lib/auth-utils"

export async function getSignals() {
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
    return prisma.signal.findMany({
      where: { deletedAt: null },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        audience: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
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

  const reads = await prisma.signalRead.findMany({
    where: { signalId: id },
    include: { user: { select: { name: true, email: true } } },
  })

  const uniqueMembers = reads.length
  const totalViews = reads.reduce((sum: number, r: any) => sum + r.viewCount, 0)
  
  const firstRead = reads.length > 0 
    ? reads.reduce((min: Date, r: any) => r.readAt < min ? r.readAt : min, reads[0].readAt) 
    : null

  return {
    uniqueMembers,
    totalViews,
    firstRead,
    reads: reads.map((r: any) => ({
      userName: r.user.name,
      userEmail: r.user.email,
      readAt: r.readAt,
      views: r.viewCount,
    })),
  }
}

