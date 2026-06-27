import { NextRequest, NextResponse } from "next/server"
import { duplicateSignal } from "@nba/modules/signals/services/duplicate-signal"
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
    const duplicated = await duplicateSignal(id, session.user.id)
    return NextResponse.json(duplicated)
  } catch (error) {
    return handleAuthError(error)
  }
}
