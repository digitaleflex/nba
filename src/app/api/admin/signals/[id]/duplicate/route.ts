import { NextRequest, NextResponse } from "next/server"
import { duplicateSignal } from "@nba/modules/signals/services/duplicate-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const duplicated = await duplicateSignal(id, session.user.id)
    return NextResponse.json(duplicated)
  } catch (error) {
    return handleAuthError(error)
  }
}
