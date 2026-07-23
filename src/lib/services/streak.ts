import { prisma } from "@nba/lib/db"

export type Badge = {
  id: string
  label: string
  icon: string
  unlockedAt: Date
}

export async function recordLogin(userId: string): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "LOGIN_STREAK" } },
  })

  if (!streak) {
    await prisma.streak.create({
      data: { userId, type: "LOGIN_STREAK", count: 1, bestCount: 1, lastDisciplineDay: today },
    })
    return
  }

  const last = streak.lastDisciplineDay
  if (last && last.getTime() === today.getTime()) return

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const newCount = last && last.getTime() >= yesterday.getTime() ? streak.count + 1 : 1
  const bestCount = Math.max(streak.bestCount, newCount)

  await prisma.streak.update({
    where: { id: streak.id },
    data: { count: newCount, bestCount, lastDisciplineDay: today },
  })
}

export async function getStreak(userId: string): Promise<{ current: number; best: number }> {
  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "LOGIN_STREAK" } },
  })
  if (!streak) return { current: 0, best: 0 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last = streak.lastDisciplineDay
  if (last && last.getTime() < today.getTime()) {
    return { current: 0, best: streak.bestCount }
  }
  return { current: streak.count, best: streak.bestCount }
}

export async function getBadges(userId: string): Promise<Badge[]> {
  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "LOGIN_STREAK" } },
  })

  const badges: Badge[] = []
  if (!streak) return badges

  const milestones = [
    { id: "login_3", label: "3 jours d'affilée", icon: "🔥", minCount: 3 },
    { id: "login_7", label: "Une semaine complète", icon: "⭐", minCount: 7 },
    { id: "login_14", label: "Deux semaines de streak", icon: "💪", minCount: 14 },
    { id: "login_30", label: "Un mois de trading", icon: "🏆", minCount: 30 },
    { id: "login_60", label: "Deux mois de discipline", icon: "💎", minCount: 60 },
    { id: "login_90", label: "Trois mois — trader confirmé", icon: "👑", minCount: 90 },
    { id: "login_180", label: "Six mois — légende", icon: "🌟", minCount: 180 },
    { id: "login_365", label: "Un an — immutable", icon: "🏅", minCount: 365 },
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isActive = streak.lastDisciplineDay && streak.lastDisciplineDay.getTime() >= today.getTime()

  for (const m of milestones) {
    if (isActive && streak.count >= m.minCount) {
      badges.push({ id: m.id, label: m.label, icon: m.icon, unlockedAt: streak.updatedAt })
    }
  }

  return badges
}
