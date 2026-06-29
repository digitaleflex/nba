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

    // Check if already favorited
    const existing = await prisma.signalFavorite.findUnique({
      where: {
        signalId_userId: {
          signalId: id,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      // Remove from favorites
      await prisma.signalFavorite.delete({
        where: {
          signalId_userId: {
            signalId: id,
            userId: session.user.id,
          },
        },
      })
      return NextResponse.json({ success: true, favorited: false })
    } else {
      // Add to favorites
      await prisma.signalFavorite.create({
        data: {
          signalId: id,
          userId: session.user.id,
        },
      })
      return NextResponse.json({ success: true, favorited: true })
    }
  } catch (error) {
    return handleAuthError(error)
  }
}
