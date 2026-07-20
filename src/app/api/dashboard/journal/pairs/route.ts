import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const pairs = await prisma.trade.groupBy({
      by: ["pair"],
      where: { userId: session.user.id, deletedAt: null },
      _count: { pair: true },
      orderBy: { _count: { pair: "desc" } },
      take: 50,
    })

    return NextResponse.json({
      pairs: pairs.map(p => ({ pair: p.pair, count: p._count.pair })),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
