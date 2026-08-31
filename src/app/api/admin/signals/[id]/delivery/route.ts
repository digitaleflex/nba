import { NextRequest, NextResponse } from "next/server"
import { getSignalDelivery } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const rl = await rateLimitOrDeny("ADMIN_SIGNAL_MUTATION", session.user.id)
    if (rl) return rl

    const { id } = await params
    const report = await getSignalDelivery(id, session.user.id)
    return NextResponse.json(report)
  } catch (error) {
    return handleAuthError(error)
  }
}
