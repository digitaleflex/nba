import { prisma } from "@nba/lib/db"

export interface PushReach {
  reachable: number
  total: number
  rate: number
  byPlatform: { ios: number; android: number; desktop: number }
}

/** Taux de membres actifs joignables en push (au moins un appareil abonné) — PUSH-3 #366. */
export async function getPushReach(): Promise<PushReach> {
  const memberWhere = { isActive: true, role: { name: "MEMBER" } }
  const [total, reachableUsers, subs] = await Promise.all([
    prisma.user.count({ where: memberWhere }),
    prisma.user.count({ where: { ...memberWhere, pushSubscriptions: { some: {} } } }),
    prisma.pushSubscription.groupBy({
      by: ["platform"],
      where: { user: memberWhere },
      _count: { _all: true },
    }),
  ])
  const count = (p: string) => subs.find((s) => s.platform === p)?._count._all ?? 0
  return {
    reachable: reachableUsers,
    total,
    rate: total > 0 ? Math.round((reachableUsers / total) * 100) : 0,
    byPlatform: { ios: count("ios"), android: count("android"), desktop: count("desktop") + subs.filter((s) => !s.platform).reduce((a, s) => a + s._count._all, 0) },
  }
}

/** Membres actifs sans aucun appareil abonné (pour les relancer). Limité à `take` lignes. */
export async function listMembersWithoutPush(take = 50) {
  return prisma.user.findMany({
    where: { isActive: true, role: { name: "MEMBER" }, pushSubscriptions: { none: {} } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, name: true, email: true, createdAt: true },
  })
}
