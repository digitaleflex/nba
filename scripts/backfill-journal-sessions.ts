import "dotenv/config"
import { prisma } from "../src/lib/db"
import { logAuditEvent } from "../src/lib/services/audit"

async function backfillSessions() {
  const dryRun = process.argv.includes("--dry-run")

  const orphanedTrades = await prisma.trade.findMany({
    where: { deletedAt: null, sessionId: null },
    select: { id: true, userId: true, tradedAt: true, pair: true },
    orderBy: { tradedAt: "desc" },
  })

  if (orphanedTrades.length === 0) {
    console.log("[backfill-journal-sessions] Aucun trade orphelin, rien à faire.")
    process.exit(0)
  }

  const byUser = new Map<string, { trades: typeof orphanedTrades; user: { email: string; name: string } | null }>()
  for (const t of orphanedTrades) {
    if (!byUser.has(t.userId)) {
      byUser.set(t.userId, { trades: [], user: null })
    }
    byUser.get(t.userId)!.trades.push(t)
  }

  const users = await prisma.user.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: { id: true, name: true, email: true },
  })
  for (const u of users) {
    if (byUser.has(u.id)) {
      byUser.get(u.id)!.user = { email: u.email, name: u.name }
    }
  }

  console.log(`[backfill-journal-sessions] ${orphanedTrades.length} trades orphelins chez ${byUser.size} utilisateurs${dryRun ? " (DRY RUN)" : ""}`)

  let sessionsCreated = 0
  let tradesLinked = 0

  for (const [userId, group] of byUser) {
    const user = group.user
    const label = user ? `${user.email} (${user.name})` : userId

    if (dryRun) {
      console.log(`[backfill-journal-sessions] [DRY] → ${label} : ${group.trades.length} trades → 1 session`)
      sessionsCreated++
      tradesLinked += group.trades.length
      continue
    }

    try {
      const plan = await prisma.accessRequest.findFirst({
        where: { userId, status: "APPROVED" },
        select: { planId: true },
        orderBy: { reviewedAt: "desc" },
      })

      const session = await prisma.journalSession.create({
        data: {
          userId,
          planId: plan?.planId ?? null,
          isActive: false,
          startedAt: group.trades[group.trades.length - 1].tradedAt,
          endedAt: group.trades[0].tradedAt,
        },
      })

      for (const trade of group.trades) {
        await prisma.trade.update({
          where: { id: trade.id },
          data: { sessionId: session.id },
        })
      }

      sessionsCreated++
      tradesLinked += group.trades.length
      console.log(`[backfill-journal-sessions] OK ${label} : ${group.trades.length} trades liés à session ${session.id}`)
    } catch (err) {
      console.error(`[backfill-journal-sessions] ERREUR ${label}:`, err)
    }
  }

  console.log(`[backfill-journal-sessions] Terminé : ${sessionsCreated} sessions créées, ${tradesLinked} trades liés`)

  if (!dryRun && sessionsCreated > 0) {
    await logAuditEvent({
      action: "journal.backfill_sessions",
      resourceType: "system",
      details: { users: byUser.size, sessionsCreated, tradesLinked },
    })
  }

  process.exit(0)
}

backfillSessions().catch((err) => {
  console.error("[backfill-journal-sessions] ERREUR:", err)
  process.exit(1)
})
