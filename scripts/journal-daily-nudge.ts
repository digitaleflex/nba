import "dotenv/config"
import { prisma } from "../src/lib/db"
import { sendPushToUser } from "../src/lib/services/push"
import { logAuditEvent } from "../src/lib/services/audit"

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_URL || "https://signauxx.com").replace(/\/+$/, "")

function currentHourInTz(timezone: string): number {
  const now = new Date()
  const local = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  return local.getHours()
}

async function getActiveMembersWithSignalsToday(): Promise<{ id: string; timezone: string }[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = await prisma.notification.findMany({
    where: {
      type: "SIGNAL",
      createdAt: { gte: today },
      user: {
        isActive: true,
        deletedAt: null,
        role: { name: "MEMBER" },
      },
    },
    select: {
      userId: true,
      user: { select: { timezone: true } },
    },
    distinct: ["userId"],
  })

  return rows.map((r) => ({ id: r.userId, timezone: r.user?.timezone ?? "UTC" }))
}

async function hasReflectedToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  const reflection = await prisma.dailyReflection.findUnique({
    where: { userId_date: { userId, date: new Date(today) } },
    select: { id: true },
  })
  return reflection !== null
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  console.log(`[journal-daily-nudge] ${dryRun ? "DRY RUN" : "RUN"}`)

  const members = await getActiveMembersWithSignalsToday()
  console.log(`[journal-daily-nudge] ${members.length} membre(s) avec signaux aujourd'hui`)

  let sent = 0
  let skippedTz = 0
  let skippedReflected = 0
  let failed = 0
  let noPush = 0

  for (const member of members) {
    const hour = currentHourInTz(member.timezone)
    if (hour < 17 || hour >= 23) {
      skippedTz++
      continue
    }

    const reflected = await hasReflectedToday(member.id)
    if (reflected) {
      skippedReflected++
      continue
    }

    if (dryRun) {
      console.log(`[journal-daily-nudge] [DRY] → ${member.id} (${member.timezone}, ${hour}h)`)
      sent++
      continue
    }

    try {
      const result = await sendPushToUser(member.id, {
        title: "Ta réflexion du jour ? 🧠",
        body: "Comment s'est passée ta journée de trading ? Note ta réflexion en 30 secondes dans ton journal.",
        url: `${APP_DOMAIN}/dashboard/journal?tab=reflections`,
        tag: "journal-daily-nudge",
      })
      if (result.sent > 0) {
        sent++
      } else {
        noPush++
      }
    } catch (err) {
      failed++
      console.error(`[journal-daily-nudge] ERREUR push ${member.id}:`, err)
    }
  }

  console.log(
    `[journal-daily-nudge] Terminé : ${sent} envoyés, ${skippedTz} hors fenêtre, ` +
    `${skippedReflected} déjà réfléchi, ${noPush} sans push, ${failed} échoués`,
  )

  if (!dryRun) {
    await logAuditEvent({
      action: "journal.daily_nudge",
      resourceType: "system",
      details: {
        totalMembers: members.length,
        sent,
        skippedTz,
        skippedReflected,
        noPush,
        failed,
      },
    })
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("[journal-daily-nudge] ERREUR:", err)
  process.exit(1)
})
