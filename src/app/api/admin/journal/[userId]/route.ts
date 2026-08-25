import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { calculateRR } from "@nba/lib/services/pnl"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isActive: true },
    })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    const [trades, wins, recentTrades, reflections, streaks, sessions] = await Promise.all([
      prisma.trade.aggregate({
        where: { userId, deletedAt: null },
        _count: true,
        _sum: { pnl: true },
      }),
      prisma.trade.count({
        where: { userId, deletedAt: null, result: "WIN" },
      }),
      prisma.trade.findMany({
        where: { userId: userId, deletedAt: null },
        orderBy: { tradedAt: "desc" },
        take: 20,
        select: {
          id: true, pair: true, direction: true, result: true,
          entryPrice: true, exitPrice: true, stopLoss: true, takeProfit: true,
          lotSize: true, spread: true, commission: true, swap: true,
          pnl: true,
          strategy: true, setupType: true, mood: true, confidence: true,
          tradedAt: true, tags: true, note: true,
        },
      }),
      prisma.dailyReflection.findMany({
        where: { userId: userId },
        orderBy: { date: "desc" },
        take: 30,
        select: { id: true, date: true, rating: true, mood: true, tradeCount: true, wins: true, losses: true, totalPnl: true, note: true },
      }),
      prisma.streak.findMany({
        where: { userId: userId },
        select: { type: true, count: true, bestCount: true },
      }),
      prisma.journalSession.findMany({
        where: { userId: userId },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: { id: true, startedAt: true, endedAt: true, isActive: true },
      }),
    ])

    // Même calcul de R:R que la vue membre (lib partagée)
    const recentTradesWithRR = recentTrades.map((trade) => ({
      ...trade,
      rrRatio: calculateRR({
        entryPrice: Number(trade.entryPrice),
        stopLoss: trade.stopLoss === null ? null : Number(trade.stopLoss),
        takeProfit: trade.takeProfit === null ? null : Number(trade.takeProfit),
        direction: trade.direction as "BUY" | "SELL",
      }),
    }))

    return NextResponse.json({
      user,
      stats: {
        totalTrades: trades._count,
        totalPnl: trades._sum.pnl,
        // Même définition que /api/dashboard/journal/stats : wins sur l'historique complet
        winRate: trades._count > 0 ? Math.round((wins / trades._count) * 1000) / 10 : 0,
      },
      recentTrades: recentTradesWithRR,
      reflections,
      streaks,
      sessions,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
