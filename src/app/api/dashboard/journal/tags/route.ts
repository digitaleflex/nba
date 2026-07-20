import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const trades = await prisma.trade.findMany({
      where: { userId: session.user.id, deletedAt: null },
      select: { tags: true },
    })

    const tagCount = new Map<string, number>()
    for (const trade of trades) {
      for (const tag of trade.tags) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1)
      }
    }

    const tags = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([tag]) => tag)

    return NextResponse.json({ tags })
  } catch (error) {
    return handleAuthError(error)
  }
}
