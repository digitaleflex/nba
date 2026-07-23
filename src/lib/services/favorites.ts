import { prisma } from "@nba/lib/db"

export async function toggleFavorite(userId: string, signalId: string): Promise<boolean> {
  const existing = await prisma.signalFavorite.findUnique({
    where: { signalId_userId: { signalId, userId } },
  })

  if (existing) {
    await prisma.signalFavorite.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.signalFavorite.create({ data: { signalId, userId } })
  return true
}

export async function getFavorites(userId: string) {
  return prisma.signalFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      signal: {
        select: {
          id: true,
          content: true,
          publishedAt: true,
          imageUrl: true,
          status: true,
          currentVersion: true,
        },
      },
    },
  })
}

export async function isFavorited(userId: string, signalId: string): Promise<boolean> {
  const fav = await prisma.signalFavorite.findUnique({
    where: { signalId_userId: { signalId, userId } },
  })
  return !!fav
}
