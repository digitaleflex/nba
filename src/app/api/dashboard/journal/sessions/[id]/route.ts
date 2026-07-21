import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })
    const { id } = await params

    const ses = await prisma.journalSession.findUnique({
      where: { id },
      include: { trades: { where: { deletedAt: null } } },
    })
    if (!ses || ses.userId !== session.user.id || !ses.isActive) {
      return NextResponse.json({ error: msg.dashboard.SESSION_NOT_FOUND }, { status: 404 })
    }

    const wins = ses.trades.filter(t => t.result === "WIN").length
    const losses = ses.trades.filter(t => t.result === "LOSS").length
    const totalPnl = ses.trades.reduce((s, t) => s + Number(t.pnl ?? 0), 0)

    await prisma.journalSession.update({
      where: { id },
      data: { isActive: false, endedAt: new Date() },
    })

    return NextResponse.json({
      closed: true,
      summary: {
        tradeCount: ses.trades.length,
        wins,
        losses,
        breakevens: ses.trades.length - wins - losses,
        totalPnl: Math.round(totalPnl * 100) / 100,
        startedAt: ses.startedAt,
        endedAt: new Date(),
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
