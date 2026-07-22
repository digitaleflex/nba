import { type NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { securityEventBus } from "@nba/lib/security/security-event-bus"

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100)
    const events = await securityEventBus.getRecentEvents(session.user.id, limit)
    return NextResponse.json({ events })
  } catch (error) {
    return handleAuthError(error)
  }
}
