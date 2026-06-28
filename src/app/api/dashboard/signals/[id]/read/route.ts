import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { SignalPolicy } from "@nba/modules/signals/policies/signal-policy"
import { handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

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
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response

    // Strict security check: must be allowed to view this signal to record a read receipt!
    const allowed = await SignalPolicy.canView(session.user.id, id)
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
