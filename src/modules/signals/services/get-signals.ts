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

  const activePlanIds = approvedRequests.map((r) => r.planId)
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
