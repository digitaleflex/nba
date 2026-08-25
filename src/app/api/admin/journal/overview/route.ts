import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

// Vue d'ensemble : tous les membres ayant un journal, triés par activité récente.
export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const [byUser, winsByUser] = await Promise.all([
      prisma.trade.groupBy({
        by: ["userId"],
        where: { deletedAt: null },
        _count: true,
        _sum: { pnl: true },
        _max: { tradedAt: true },
      }),
      prisma.trade.groupBy({
        by: ["userId"],
        where: { deletedAt: null, result: "WIN" },
        _count: true,
      }),
    ])

    if (byUser.length === 0) return NextResponse.json({ members: [] })

    const users = await prisma.user.findMany({
      where: { id: { in: byUser.map((t) => t.userId) } },
      select: { id: true, name: true, email: true, isActive: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))
    const winsMap = new Map(winsByUser.map((w) => [w.userId, w._count]))

    const members = byUser
      .map((t) => {
        const user = userMap.get(t.userId)
        if (!user) return null
        const total = t._count
        const wins = winsMap.get(t.userId) ?? 0
        return {
          ...user,
          totalTrades: total,
          totalPnl: t._sum.pnl,
          winRate: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0,
          lastTradeAt: t._max.tradedAt,
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => Number(b.lastTradeAt) - Number(a.lastTradeAt))

    return NextResponse.json({ members })
  } catch (error) {
    return handleAuthError(error)
  }
}
