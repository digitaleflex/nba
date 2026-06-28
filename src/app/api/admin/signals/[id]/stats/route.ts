import { NextRequest, NextResponse } from "next/server"
import { getSignalStats } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response
    const stats = await getSignalStats(id, session.user.id)
    return NextResponse.json(stats)
  } catch (error) {
    return handleAuthError(error)
  }
}
