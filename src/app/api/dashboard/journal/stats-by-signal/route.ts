import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const tradeGroups = await prisma.trade.groupBy({
      by: ["signalId"],
      where: { userId: session.user.id, deletedAt: null, signalId: { not: null } },
      _count: { id: true },
      _sum: { pnl: true },
    })

    const signalIds = tradeGroups.map(g => g.signalId).filter(Boolean) as string[]

    const signalMap = new Map<string, { content: string; publishedAt: Date | null }>()
    if (signalIds.length > 0) {
      const signals = await prisma.signal.findMany({
        where: { id: { in: signalIds } },
        select: { id: true, content: true, publishedAt: true },
      })
      for (const s of signals) {
        signalMap.set(s.id, { content: s.content ?? "", publishedAt: s.publishedAt })
      }
    }

    const result = tradeGroups.map((g) => {
      const signal = signalMap.get(g.signalId!)
      const total = Number(g._count.id)
      return {
        signalId: g.signalId,
        content: signal?.content?.slice(0, 80) ?? "—",
        publishedAt: signal?.publishedAt ?? null,
        tradeCount: total,
        pnl: Math.round(Number(g._sum.pnl ?? 0) * 100) / 100,
        winRate: 0,
      }
    })

    return NextResponse.json({ signals: result })
  } catch (error) {
    return handleAuthError(error)
  }
}
