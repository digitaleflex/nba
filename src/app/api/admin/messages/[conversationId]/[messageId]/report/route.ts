import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { validateOrThrow, messageReportSchema, ValidationError } from "@nba/lib/validations"
import { reportMessage } from "@nba/lib/services/messaging"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { messageId } = await params
    const body = await req.json().catch(() => ({}))
    const { reason } = validateOrThrow(messageReportSchema, body)
    const report = await reportMessage(messageId, session.user.id, reason)
    return NextResponse.json({ report })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
