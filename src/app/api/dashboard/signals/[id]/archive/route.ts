import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { SignalPolicy } from "@nba/modules/signals/policies/signal-policy"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

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
