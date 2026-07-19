import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"

function computeByDay(trades: Array<{ result: string; pnl: unknown; tradedAt: Date; confidence: number | null }>) {
  const map = new Map<string, { count: number; wins: number; pnl: number; confidenceSum: number; confidenceCount: number }>()
  for (const t of trades) {
    const date = new Date(t.tradedAt).toISOString().slice(0, 10)
    const entry = map.get(date) ?? { count: 0, wins: 0, pnl: 0, confidenceSum: 0, confidenceCount: 0 }
    entry.count++
    if (t.result === "WIN") entry.wins++
    entry.pnl += Number(t.pnl ?? 0)
    if (t.confidence != null) {
      entry.confidenceSum += t.confidence
      entry.confidenceCount++
    }
    map.set(date, entry)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 90)
    .map(([date, v]) => ({
      date,
      count: v.count,
      wins: v.wins,
      pnl: Math.round(v.pnl * 100) / 100,
      winRate: v.count > 0 ? Math.round((v.wins / v.count) * 100 * 10) / 10 : 0,
      avgConfidence: v.confidenceCount > 0 ? Math.round((v.confidenceSum / v.confidenceCount) * 10) / 10 : 0,
    }))
}

function buildEvolution(byDay: Array<{ date: string; pnl: number; winRate: number; avgConfidence: number }>) {
  // Ordre chronologique pour les courbes
  const chronological = [...byDay].reverse()
  const labels = chronological.map((d) => d.date)

  let cumulativePnl = 0
  const pnlCum = chronological.map((d) => {
    cumulativePnl += d.pnl
    return Math.round(cumulativePnl * 100) / 100
  })

  return {
    labels,
    series: [
      { key: "pnlCum", label: "PnL cumulé", color: "#10b981", unit: "€", values: pnlCum },
      { key: "winRate", label: "Win rate %", color: "#6366f1", unit: "%", values: chronological.map((d) => d.winRate) },
      { key: "confidence", label: "Confiance moy.", color: "#f59e0b", unit: "/5", values: chronological.map((d) => d.avgConfidence) },
    ],
  }
}

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

  const [trades, byPair, byMood, streaks] = await Promise.all([
    prisma.trade.findMany({
      where,
        select: { result: true, pnl: true, pair: true, entryPrice: true, exitPrice: true, lotSize: true, tradedAt: true, mood: true, confidence: true },
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

    // Risk metrics
    const winTrades = trades.filter(t => t.result === "WIN")
    const lossTrades = trades.filter(t => t.result === "LOSS")
    const grossProfit = winTrades.reduce((s, t) => s + Math.max(0, Number(t.pnl ?? 0)), 0)
    const grossLoss = Math.abs(lossTrades.reduce((s, t) => s + Math.min(0, Number(t.pnl ?? 0)), 0))
    const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? Infinity : 0
    const avgWinner = winTrades.length > 0 ? Math.round((grossProfit / winTrades.length) * 100) / 100 : 0
    const avgLoser = lossTrades.length > 0 ? Math.round((grossLoss / lossTrades.length) * 100) / 100 : 0
    const riskRewardRatio = avgWinner > 0 ? Math.round((avgLoser / avgWinner) * 100) / 100 : 0
    const winRateDecimal = total > 0 ? wins / total : 0
    const lossRateDecimal = total > 0 ? losses / total : 0
    const expectancy = avgLoser > 0
      ? Math.round(((winRateDecimal * avgWinner) - (lossRateDecimal * avgLoser)) / avgLoser * 100) / 100
      : 0

    // Max drawdown (peak-to-trough on cumulative PnL)
    let cumulativePnl = 0
    let peak = 0
    let maxDrawdown = 0
    const tradesByDate = [...trades].sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime())
    for (const trade of tradesByDate) {
      cumulativePnl += Number(trade.pnl ?? 0)
      if (cumulativePnl > peak) peak = cumulativePnl
      const drawdown = peak - cumulativePnl
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    return NextResponse.json({
      winRate,
      totalTrades: total,
      wins,
      losses,
      breakevens,
      totalPnl: Math.round(totalPnl * 100) / 100,
      bestTrade: sortedPnl[0] ? { pair: sortedPnl[0].pair, pnl: Number(sortedPnl[0].pnl ?? 0), date: sortedPnl[0].tradedAt } : null,
      worstTrade: sortedPnl.length > 0 ? { pair: sortedPnl[sortedPnl.length - 1].pair, pnl: Number(sortedPnl[sortedPnl.length - 1].pnl ?? 0), date: sortedPnl[sortedPnl.length - 1].tradedAt } : null,
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
      byDay: computeByDay(trades),

      evolution: buildEvolution(computeByDay(trades)),
      streaks: {
        currentWinStreak: winStreak?.count ?? 0,
        bestWinStreak: winStreak?.bestCount ?? 0,
        currentLossStreak: lossStreak?.count ?? 0,
        bestLossStreak: lossStreak?.bestCount ?? 0,
      },
      riskMetrics: {
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        expectancy,
        profitFactor,
        avgWinner,
        avgLoser,
        riskRewardRatio,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
