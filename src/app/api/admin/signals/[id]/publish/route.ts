import { NextRequest, NextResponse } from "next/server"
import { publishSignal } from "@nba/modules/signals/services/publish-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response
    const updated = await publishSignal(id, session.user.id)
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
