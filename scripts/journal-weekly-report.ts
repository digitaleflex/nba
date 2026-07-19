import "dotenv/config"
import { prisma } from "../src/lib/db"
import { sendEmail, weeklyJournalReport } from "../src/lib/email"
import { logAuditEvent } from "../src/lib/services/audit"

interface UserStats {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalPnl: number
  bestPair: string
  worstPair: string
  streak: number
}

async function getWeeklyStats(userId: string, weekStart: Date): Promise<UserStats | null> {
  const trades = await prisma.trade.findMany({
    where: {
      userId,
      deletedAt: null,
      tradedAt: { gte: weekStart },
    },
    select: { result: true, pnl: true, pair: true },
    orderBy: { tradedAt: "desc" },
  })

  if (trades.length === 0) return null

  const wins = trades.filter(t => t.result === "WIN").length
  const losses = trades.filter(t => t.result === "LOSS").length
  const total = trades.length
  const winRate = total > 0 ? Math.round((wins / total) * 100 * 10) / 10 : 0
  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl ?? 0), 0)

  const byPair = new Map<string, { count: number; pnl: number; wins: number }>()
  for (const t of trades) {
    const p = byPair.get(t.pair) ?? { count: 0, pnl: 0, wins: 0 }
    p.count++
    p.pnl += Number(t.pnl ?? 0)
    if (t.result === "WIN") p.wins++
    byPair.set(t.pair, p)
  }

  let bestPair = ""
  let worstPair = ""
  let bestPnl = -Infinity
  let worstPnl = Infinity
  for (const [pair, data] of byPair) {
    if (data.pnl > bestPnl) { bestPnl = data.pnl; bestPair = pair }
    if (data.pnl < worstPnl) { worstPnl = data.pnl; worstPair = pair }
  }

  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "WIN_STREAK" } },
  })

  return {
    totalTrades: total,
    wins,
    losses,
    winRate,
    totalPnl,
    bestPair,
    worstPair,
    streak: streak?.count ?? 0,
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  console.log(`[journal-weekly-report] ${dryRun ? "DRY RUN" : "RUN"} — génération des rapports hebdomadaires`)

  // Lundi dernier 00:00
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysSinceMonday - 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  console.log(`[journal-weekly-report] Période: ${weekStart.toISOString().slice(0, 10)} → ${weekEnd.toISOString().slice(0, 10)}`)

  // Membres actifs avec au moins un trade dans la période
  const userIds = await prisma.trade.findMany({
    where: {
      deletedAt: null,
      tradedAt: { gte: weekStart, lt: weekEnd },
      user: { isActive: true, deletedAt: null, role: { name: "MEMBER" } },
    },
    select: { userId: true },
    distinct: ["userId"],
  })

  console.log(`[journal-weekly-report] ${userIds.length} membre(s) avec trades cette semaine`)

  if (userIds.length === 0) {
    console.log(`[journal-weekly-report] Aucun trade cette semaine, fin.`)
    process.exit(0)
  }

  // Charger les users en une requête
  const users = await prisma.user.findMany({
    where: { id: { in: userIds.map(u => u.userId) } },
    select: { id: true, name: true, email: true, emailStatus: true },
  })

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    if (user.emailStatus !== "OK") {
      console.log(`[journal-weekly-report] SKIP ${user.email} — emailStatus=${user.emailStatus}`)
      skipped++
      continue
    }

    const stats = await getWeeklyStats(user.id, weekStart)
    if (!stats) {
      skipped++
      continue
    }

    const template = weeklyJournalReport(
      { name: user.name, email: user.email },
      stats,
    )

    if (dryRun) {
      console.log(`[journal-weekly-report] [DRY] → ${user.email} (${user.name}) — ${stats.totalTrades} trades, ${stats.winRate}% WR, ${stats.totalPnl.toFixed(0)}€`)
      sent++
      continue
    }

    try {
      const result = await sendEmail(user.email, template)
      if (result) {
        sent++
        console.log(`[journal-weekly-report] OK ${user.email} — ${stats.totalTrades} trades`)
      } else {
        skipped++
        console.log(`[journal-weekly-report] BLOQUÉ ${user.email}`)
      }
    } catch (err) {
      failed++
      console.error(`[journal-weekly-report] ERREUR ${user.email}:`, err)
    }
  }

  console.log(`[journal-weekly-report] Terminé : ${sent} envoyés, ${skipped} ignorés, ${failed} échoués`)

  if (!dryRun) {
    await logAuditEvent({
      action: "journal.weekly_report",
      resourceType: "system",
      details: {
        period: { from: weekStart.toISOString(), to: weekEnd.toISOString() },
        totalMembers: userIds.length,
        sent,
        skipped,
        failed,
      },
    })
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("[journal-weekly-report] ERREUR:", err)
  process.exit(1)
})
