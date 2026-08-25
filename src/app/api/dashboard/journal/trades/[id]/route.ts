import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })
    const { id } = await params

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.user.id) {
      return NextResponse.json({       error: msg.dashboard.TRADE_NOT_FOUND }, { status: 404 })
    }

    await prisma.trade.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
