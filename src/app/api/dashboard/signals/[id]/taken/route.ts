import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { canViewSignal } from "@nba/modules/signals/policies/signal-policy"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()
    const { id } = await params
    const taken = await prisma.signalTaken.findUnique({
      where: { signalId_userId: { signalId: id, userId: session.user.id } },
    })
    return NextResponse.json({ taken: !!taken, tradedAt: taken?.tradedAt ?? null })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()
    const { id } = await params

    const allowed = await canViewSignal(session.user.id, id)
    if (!allowed) {
      return NextResponse.json({ error: msg.auth.ACCESS_DENIED }, { status: 403 })
    }

    const existing = await prisma.signalTaken.findUnique({
      where: { signalId_userId: { signalId: id, userId: session.user.id } },
    })

    if (existing) {
      await prisma.signalTaken.delete({
        where: { signalId_userId: { signalId: id, userId: session.user.id } },
      })
      return NextResponse.json({ success: true, taken: false })
    }

    const created = await prisma.signalTaken.create({
      data: { signalId: id, userId: session.user.id },
    })
    return NextResponse.json({ success: true, taken: true, tradedAt: created.tradedAt })
  } catch (error) {
    return handleAuthError(error)
  }
}
