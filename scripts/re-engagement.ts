import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "re-engagement" })

const THRESHOLDS = [
  { days: 7, label: "7 jours" },
  { days: 14, label: "2 semaines" },
  { days: 30, label: "1 mois" },
]

async function main() {
  log.info("Demarrage du script de re-engagement...")

  const activeMembers = await prisma.user.findMany({
    where: {
      isActive: true,
      onboardingStatus: "ACTIVE",
      role: { name: "MEMBER" },
    },
    select: { id: true, name: true, email: true },
  })

  let sent = 0
  for (const user of activeMembers) {
    const lastLogin = await prisma.loginAttempt.findFirst({
      where: { userId: user.id, success: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })

    if (!lastLogin) continue

    const daysSinceLogin = (Date.now() - lastLogin.createdAt.getTime()) / (1000 * 60 * 60 * 24)

    const threshold = THRESHOLDS.find((t) => daysSinceLogin >= t.days)
    if (!threshold) continue

    const newSignalsCount = await prisma.signal.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: lastLogin.createdAt },
        audience: {
          some: {
            plan: { accessRequests: { some: { userId: user.id, status: "APPROVED" } } },
          },
        },
      },
    })

    const body = newSignalsCount > 0
      ? `Vous avez ${newSignalsCount} nouveau${newSignalsCount > 1 ? "x" : ""} signal${newSignalsCount > 1 ? "x" : ""} en attente depuis ${threshold.label}.`
      : "Cela fait longtemps ! Revenez decouvrir les derniers signaux et maintienez votre streak."

    await notify({
      userId: user.id,
      type: "SYSTEM",
      title: "Vous nous manquez !",
      body,
      data: { reengagement: true, daysSinceLogin: Math.floor(daysSinceLogin), newSignalsCount },
      linkUrl: "/dashboard/signals",
    })

    sent++
  }

  log.info(`Re-engagement termine : ${sent} notifications envoyees`)
}

main()
  .catch((err) => { log.error(err, "Re-engagement script failed"); process.exit(1) })
  .finally(() => process.exit(0))
