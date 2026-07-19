import { NextRequest, NextResponse } from "next/server"
import { publishSignal } from "@nba/modules/signals/services/publish-signal"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { invalidatePrefix } from "@nba/lib/cache"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const updated = await publishSignal(id, session.user.id)
    await invalidatePrefix("ops")
    await invalidatePrefix("signals:")
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
