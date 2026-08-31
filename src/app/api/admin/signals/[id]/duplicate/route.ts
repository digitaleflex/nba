import { NextRequest, NextResponse } from "next/server"
import { duplicateSignal } from "@nba/modules/signals/services/duplicate-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const rl = await rateLimitOrDeny("ADMIN_SIGNAL_MUTATION", session.user.id)
    if (rl) return rl

    const { id } = await params
    const duplicated = await duplicateSignal(id, session.user.id)
    return NextResponse.json(duplicated)
  } catch (error) {
    return handleAuthError(error)
  }
}
