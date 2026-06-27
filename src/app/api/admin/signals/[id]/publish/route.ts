import { NextRequest, NextResponse } from "next/server"
import { publishSignal } from "@nba/modules/signals/services/publish-signal"
import { getServerSession } from "@nba/lib/get-session"
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
    const updated = await publishSignal(id, session.user.id)
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
