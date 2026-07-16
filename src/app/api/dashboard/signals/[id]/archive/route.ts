import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { SignalPolicy } from "@nba/modules/signals/policies/signal-policy"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()

    const { id } = await params

    const allowed = await SignalPolicy.canView(session.user.id, id)
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Check if already archived
    const existing = await prisma.signalArchive.findUnique({
      where: {
        signalId_userId: {
          signalId: id,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      // Remove from archives
      await prisma.signalArchive.delete({
        where: {
          signalId_userId: {
            signalId: id,
            userId: session.user.id,
          },
        },
      })
      return NextResponse.json({ success: true, archived: false })
    } else {
      // Add to archives
      await prisma.signalArchive.create({
        data: {
          signalId: id,
          userId: session.user.id,
        },
      })
      return NextResponse.json({ success: true, archived: true })
    }
  } catch (error) {
    return handleAuthError(error)
  }
}
