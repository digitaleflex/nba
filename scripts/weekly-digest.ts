import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "weekly-digest" })

async function main() {
  log.info("Demarrage du digest hebdomadaire...")

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const activeUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      onboardingStatus: "ACTIVE",
      role: { name: "MEMBER" },
    },
    select: { id: true, name: true, email: true },
  })

  let sent = 0
  for (const user of activeUsers) {
    try {
      const newSignalsCount = await prisma.signal.count({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: oneWeekAgo },
          audience: {
            some: {
              plan: { accessRequests: { some: { userId: user.id, status: "APPROVED" } } },
            },
          },
        },
      })

      const signalsRead = await prisma.signalRead.count({
        where: { userId: user.id, readAt: { gte: oneWeekAgo } },
      })

      const tradesCount = await prisma.trade.count({
        where: { userId: user.id, createdAt: { gte: oneWeekAgo } },
      })

      const streak = await prisma.streak.findUnique({
        where: { userId_type: { userId: user.id, type: "LOGIN_STREAK" } },
      })

      if (newSignalsCount === 0 && signalsRead === 0 && tradesCount === 0) continue

      const bodyParts: string[] = []
      if (newSignalsCount > 0) bodyParts.push(`${newSignalsCount} nouveau${newSignalsCount > 1 ? "x" : ""} signal${newSignalsCount > 1 ? "x" : ""}`)
      if (signalsRead > 0) bodyParts.push(`${signalsRead} signal${signalsRead > 1 ? "x" : ""} lu${signalsRead > 1 ? "s" : ""}`)
      if (tradesCount > 0) bodyParts.push(`${tradesCount} trade${tradesCount > 1 ? "s" : ""} enregistre${tradesCount > 1 ? "s" : ""}`)

      await notify({
        userId: user.id,
        type: "SYSTEM",
        title: "Votre semaine en bref",
        body: bodyParts.join(" · ") + (streak ? ` · Streak: ${streak.count}j` : ""),
        data: { digest: true, week: oneWeekAgo.toISOString() },
        linkUrl: "/dashboard",
      })

      sent++
    } catch (err) {
      log.warn({ userId: user.id, err }, "Echec digest pour utilisateur")
    }
  }

  log.info(`Digest hebdomadaire termine : ${sent} notifications envoyees`)
}

main()
  .catch((err) => { log.error(err, "Weekly digest failed"); process.exit(1) })
  .finally(() => process.exit(0))
