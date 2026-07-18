import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") ?? "all"

    const dateFilter = period !== "all" ? {
      tradedAt: { gte: new Date(Date.now() - (period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000) },
    } : {}

    const where = { userId: session.user.id, deletedAt: null, ...dateFilter }

    const [trades, byPair, byMood, byDay, streaks] = await Promise.all([
      prisma.trade.findMany({
        where,
        select: { result: true, pnl: true, pair: true, entryPrice: true, exitPrice: true, lotSize: true, tradedAt: true, mood: true },
        orderBy: { tradedAt: "desc" },
      }),
      prisma.trade.groupBy({
        by: ["pair"],
        where,
        _count: { id: true },
        _sum: { pnl: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.trade.groupBy({
        by: ["mood"],
        where: { ...where, mood: { not: null } },
        _count: { id: true },
      }),
      prisma.$queryRawUnsafe<Array<{ date: Date, count: bigint, wins: bigint, pnl: number }>>(
        `SELECT
          DATE(traded_at) as date,
          COUNT(*)::int as count,
          COUNT(CASE WHEN result = 'WIN' THEN 1 END)::int as wins,
          COALESCE(SUM(pnl), 0) as pnl
        FROM trades
        WHERE user_id = $1 AND deleted_at IS NULL
        GROUP BY DATE(traded_at)
        ORDER BY date DESC
        LIMIT 90`,
        session.user.id,
      ),
      prisma.streak.findMany({ where: { userId: session.user.id } }),
    ])

    const wins = trades.filter(t => t.result === "WIN").length
    const losses = trades.filter(t => t.result === "LOSS").length
    const breakevens = trades.filter(t => t.result === "BREAKEVEN").length
    const total = trades.length
    const winRate = total > 0 ? Math.round((wins / total) * 100 * 10) / 10 : 0
    const totalPnl = trades.reduce((s, t) => s + Number(t.pnl ?? 0), 0)
    const sortedPnl = [...trades].sort((a, b) => Number(b.pnl ?? 0) - Number(a.pnl ?? 0))

    const winStreak = streaks.find(s => s.type === "WIN_STREAK")
    const lossStreak = streaks.find(s => s.type === "LOSS_STREAK")

    return NextResponse.json({
      winRate,
      totalTrades: total,
      wins,
      losses,
      breakevens,
      totalPnl: Math.round(totalPnl * 100) / 100,
      bestTrade: sortedPnl[0] ? { pair: sortedPnl[0].pair, pnl: Number(sortedPnl[0].pnl ?? 0), date: sortedPnl[0].tradedAt } : null,
      worstTrade: sortedPnl.length > 0 ? { pair: sortedPnl[total - 1].pair, pnl: Number(sortedPnl[total - 1].pnl ?? 0), date: sortedPnl[total - 1].tradedAt } : null,
      byPair: byPair.map(p => ({
        pair: p.pair,
        count: Number(p._count.id),
        winRate: trades.filter(t => t.pair === p.pair).length > 0
          ? Math.round((trades.filter(t => t.pair === p.pair && t.result === "WIN").length / trades.filter(t => t.pair === p.pair).length) * 100 * 10) / 10 : 0,
        pnl: Math.round(Number(p._sum.pnl ?? 0) * 100) / 100,
      })),
      byMood: byMood.map(m => ({
        mood: m.mood,
        count: Number(m._count.id),
        winRate: trades.filter(t => t.mood === m.mood).length > 0
          ? Math.round((trades.filter(t => t.mood === m.mood && t.result === "WIN").length / trades.filter(t => t.mood === m.mood).length) * 100 * 10) / 10 : 0,
      })),
      byDay: byDay.map(d => ({
        date: d.date,
        count: Number(d.count),
        wins: Number(d.wins),
        pnl: Math.round(Number(d.pnl) * 100) / 100,
      })),
      streaks: {
        currentWinStreak: winStreak?.count ?? 0,
        bestWinStreak: winStreak?.bestCount ?? 0,
        currentLossStreak: lossStreak?.count ?? 0,
        bestLossStreak: lossStreak?.bestCount ?? 0,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
