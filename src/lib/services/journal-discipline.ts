import { prisma } from "@nba/lib/db"

/**
 * Met à jour le DISCIPLINE_STREAK de l'utilisateur.
 * Un jour "discipliné" = au moins 1 trade + au moins 1 réflexion ce jour-là.
 * Le streak est incrémenté si le jour courant est discipliné, reset à 0 sinon
 * (la logique de "jour consécutif" est gérée en comparant la dernière date).
 */
export async function updateDisciplineStreak(userId: string, day: Date): Promise<void> {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [tradeCount, reflection] = await Promise.all([
    prisma.trade.count({
      where: { userId, deletedAt: null, tradedAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.dailyReflection.findFirst({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
    }),
  ])

  const isDisciplined = tradeCount > 0 && !!reflection
  if (!isDisciplined) return

  const existing = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "DISCIPLINE_STREAK" } },
  })

  if (existing) {
    const lastDay = existing.lastDisciplineDay
      ? new Date(existing.lastDisciplineDay)
      : null

    let count = existing.count
    if (lastDay) {
      const lastDayStart = new Date(lastDay)
      lastDayStart.setHours(0, 0, 0, 0)
      const diffDays = Math.round((dayStart.getTime() - lastDayStart.getTime()) / 86_400_000)
      if (diffDays === 1) count += 1
      else if (diffDays > 1) count = 1
    } else {
      count = 1
    }

    await prisma.streak.update({
      where: { id: existing.id },
      data: {
        count,
        bestCount: count > existing.bestCount ? count : existing.bestCount,
        lastDisciplineDay: dayStart,
      },
    })
  } else {
    await prisma.streak.create({
      data: {
        userId,
        type: "DISCIPLINE_STREAK",
        count: 1,
        bestCount: 1,
        lastDisciplineDay: dayStart,
      },
    })
  }
}
