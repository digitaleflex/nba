import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const signals = await prisma.trade.groupBy({
      by: ["signalId"],
      where: { userId: session.user.id, deletedAt: null, signalId: { not: null } },
      _count: { id: true },
    })

    const result = await Promise.all(signals.map(async (s) => {
      const signalTrades = await prisma.trade.findMany({
        where: { signalId: s.signalId, userId: session.user.id, deletedAt: null },
        select: { result: true, pnl: true },
      })
      const wins = signalTrades.filter(t => t.result === "WIN").length
      const total = signalTrades.length
      const signal = await prisma.signal.findUnique({
        where: { id: s.signalId! },
        select: { content: true, publishedAt: true },
      })
      return {
        signalId: s.signalId,
        content: signal?.content?.slice(0, 80) ?? "—",
        publishedAt: signal?.publishedAt,
        tradeCount: total,
        winRate: total > 0 ? Math.round((wins / total) * 100 * 10) / 10 : 0,
      }
    }))

    return NextResponse.json({ signals: result.filter(s => s.tradeCount > 0) })
  } catch (error) {
    return handleAuthError(error)
  }
}
