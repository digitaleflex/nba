import { prisma } from "@nba/lib/db"

interface PsychologyAlert {
  rule: string
  message: string
  severity: "info" | "warning" | "critical"
}

export async function checkPsychology(userId: string): Promise<PsychologyAlert[]> {
  const alerts: PsychologyAlert[] = []

  // 1. Revenge trading: 3 pertes en ≤60 min
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentLosses = await prisma.trade.findMany({
    where: { userId, result: "LOSS", deletedAt: null, tradedAt: { gte: oneHourAgo } },
    orderBy: { tradedAt: "desc" },
    take: 3,
  })
  if (recentLosses.length >= 3 && recentLosses.every(t => t.result === "LOSS")) {
    alerts.push({
      rule: "revenge_trading",
      message: "3 pertes en 1h détectées. ⏸️ Fais une pause de 15 minutes avant de continuer.",
      severity: "warning",
    })
  }

  // 2. Overtrading: >10 trades aujourd'hui
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayCount = await prisma.trade.count({
    where: { userId, deletedAt: null, tradedAt: { gte: todayStart } },
  })
  if (todayCount >= 10) {
    alerts.push({
      rule: "overtrading",
      message: `Tu as déjà fait ${todayCount} trades aujourd'hui. Réduis le rythme pour garder ta discipline.`,
      severity: "warning",
    })
  }

  // 3. Overconfidence: 5+ wins d'affilée
  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "WIN_STREAK" } },
  })
  if (streak && streak.count >= 5) {
    alerts.push({
      rule: "overconfidence",
      message: `${streak.count} wins d'affilée ! 🔥 Garde ta discipline, ne surdimensionne pas tes positions.`,
      severity: "info",
    })
  }

  // 4. Loss streak: 3+ pertes d'affilée
  const lossStreak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "LOSS_STREAK" } },
  })
  if (lossStreak && lossStreak.count >= 3) {
    alerts.push({
      rule: "loss_streak",
      message: `${lossStreak.count} pertes d'affilée. Respire, relis ton plan, et ne force pas d'entrée.`,
      severity: "warning",
    })
  }

  // Envoyer les alertes en notification in-app
  for (const alert of alerts) {
    const existingToday = await prisma.notification.findFirst({
      where: {
        userId,
        type: "JOURNAL_PSYCHOLOGY",
        createdAt: { gte: todayStart },
      },
      select: { data: true },
    })

    // Ne pas spammer : max 1 alerte par règle par jour
    const sentRules = (existingToday?.data as any)?.rules ?? []
    if (sentRules.includes(alert.rule)) continue

    await prisma.notification.create({
      data: {
        userId,
        type: "JOURNAL_PSYCHOLOGY",
        title: "Journal de trading",
        body: alert.message,
        data: { rules: [...sentRules, alert.rule] },
      },
    })

    // Si perte streak ≥5, suggérer de fermer la session
    if (lossStreak && lossStreak.count >= 5) {
      const activeSession = await prisma.journalSession.findFirst({
        where: { userId, isActive: true },
      })
      if (activeSession) {
        await prisma.journalSession.update({
          where: { id: activeSession.id },
          data: { isActive: false, endedAt: new Date() },
        })
        await prisma.notification.create({
          data: {
            userId,
            type: "JOURNAL_PSYCHOLOGY",
            title: "Session fermée",
            body: "Session automatiquement fermée : 5 pertes d'affilée. Reviens demain avec un esprit frais.",
            data: { rule: "auto_close_session" },
          },
        })
      }
    }
  }

  return alerts
}
