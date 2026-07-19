import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { canViewSignal } from "@nba/modules/signals/policies/signal-policy"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()

    const { id } = await params

    const allowed = await canViewSignal(session.user.id, id)
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
