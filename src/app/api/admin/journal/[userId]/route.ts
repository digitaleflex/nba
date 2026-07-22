import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, email: true, isActive: true },
    })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    const [trades, recentTrades, reflections, streaks, sessions] = await Promise.all([
      prisma.trade.aggregate({
        where: { userId: params.userId, deletedAt: null },
        _count: true,
        _sum: { pnl: true },
        _avg: { pnl: true },
      }),
      prisma.trade.findMany({
        where: { userId: params.userId, deletedAt: null },
        orderBy: { tradedAt: "desc" },
        take: 20,
        select: {
          id: true, pair: true, direction: true, result: true,
          entryPrice: true, exitPrice: true, pnl: true, lotSize: true,
          strategy: true, setupType: true, mood: true, confidence: true,
          tradedAt: true, tags: true, note: true,
        },
      }),
      prisma.dailyReflection.findMany({
        where: { userId: params.userId },
        orderBy: { date: "desc" },
        take: 30,
        select: { id: true, date: true, rating: true, mood: true, tradeCount: true, wins: true, losses: true, totalPnl: true, note: true },
      }),
      prisma.streak.findMany({
        where: { userId: params.userId },
        select: { type: true, count: true, bestCount: true },
      }),
      prisma.journalSession.findMany({
        where: { userId: params.userId },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: { id: true, startedAt: true, endedAt: true, isActive: true },
      }),
    ])

    return NextResponse.json({
      user,
      stats: {
        totalTrades: trades._count,
        totalPnl: trades._sum.pnl,
        avgPnl: trades._avg.pnl,
        winRate: 0, // calculated client-side
      },
      recentTrades,
      reflections,
      streaks,
      sessions,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
