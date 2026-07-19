import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"

interface PsychologyAlert {
  rule: string
  message: string
  severity: "info" | "warning" | "critical"
}

const COOLDOWN_MINUTES = 15

export async function checkPsychology(userId: string): Promise<PsychologyAlert[]> {
  const alerts: PsychologyAlert[] = []

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentLosses = await prisma.trade.findMany({
    where: { userId, result: "LOSS", deletedAt: null, tradedAt: { gte: oneHourAgo } },
    orderBy: { tradedAt: "desc" },
    take: 3,
  })
  if (recentLosses.length >= 3 && recentLosses.every(t => t.result === "LOSS")) {
    alerts.push({
      rule: "revenge_trading",
      message: "3 pertes récentes détectées. ⏸️ Respire et fais une pause de 15 minutes avant de reprendre.",
      severity: "warning",
    })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayCount = await prisma.trade.count({
    where: { userId, deletedAt: null, tradedAt: { gte: todayStart } },
  })
  if (todayCount >= 10) {
    alerts.push({
      rule: "overtrading",
      message: `Tu as déjà fait ${todayCount} trades aujourd'hui. Ralentis pour garder ta discipline.`,
      severity: "warning",
    })
  }

  const winStreak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "WIN_STREAK" } },
  })
  if (winStreak && winStreak.count >= 5) {
    alerts.push({
      rule: "overconfidence",
      message: `${winStreak.count} wins d'affilée ! 🔥 Reste discipliné, ne surdimensionne pas.`,
      severity: "info",
    })
  }

  const lossStreak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "LOSS_STREAK" } },
  })
  if (lossStreak && lossStreak.count >= 3) {
    alerts.push({
      rule: "loss_streak",
      message: `${lossStreak.count} pertes d'affilée. Relis ton plan et ne force pas d'entrée.`,
      severity: "warning",
    })
  }

  for (const alert of alerts) {
    const cooldownStart = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000)
    const recentAlert = await prisma.notification.findFirst({
      where: {
        userId,
        type: "JOURNAL_PSYCHOLOGY",
        createdAt: { gte: cooldownStart },
        data: { path: ["rules"], array_contains: alert.rule },
      },
    })
    if (recentAlert) continue

    await notify({
      userId,
      type: "JOURNAL_PSYCHOLOGY",
      title: "Journal de trading",
      body: alert.message,
      data: { rules: [alert.rule], severity: alert.severity },
      linkUrl: "/dashboard/journal?tab=reflections",
    })
  }

  if (lossStreak && lossStreak.count >= 5) {
    const cooldownStart = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000)
    const recentClose = await prisma.notification.findFirst({
      where: {
        userId,
        type: "JOURNAL_PSYCHOLOGY",
        createdAt: { gte: cooldownStart },
        data: { path: ["rule"], equals: "suggest_close_session" },
      },
    })
    if (!recentClose) {
      await notify({
        userId,
        type: "JOURNAL_PSYCHOLOGY",
        title: "Session de trading",
        body: `${lossStreak.count} pertes d'affilée. Envisage de fermer ta session et de revenir demain.`,
        data: { rule: "suggest_close_session", severity: "warning" },
        linkUrl: "/dashboard/journal",
      })
    }
  }

  return alerts
}
