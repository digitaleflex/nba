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

    // Strict security check: must be allowed to view this signal to record a read receipt!
    const allowed = await canViewSignal(session.user.id, id)
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Upsert the read record
    const readRecord = await prisma.signalRead.upsert({
      where: {
        signalId_userId: {
          signalId: id,
          userId: session.user.id,
        },
      },
      update: {
        viewCount: { increment: 1 },
      },
      create: {
        signalId: id,
        userId: session.user.id,
        viewCount: 1,
      },
    })

    return NextResponse.json({ success: true, viewCount: readRecord.viewCount })
  } catch (error) {
    return handleAuthError(error)
  }
}
