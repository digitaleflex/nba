import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { validateOrThrow, startMessageSchema, messageSendSchema, ValidationError } from "@nba/lib/validations"
import { listConversations, startOrReplyAsAdmin } from "@nba/lib/services/messaging"

export async function GET() {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const conversations = await listConversations(session.user.id)
    return NextResponse.json({ conversations })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await req.json().catch(() => ({}))
    const { memberId } = validateOrThrow(startMessageSchema, body)
    const { content, attachment } = validateOrThrow(messageSendSchema, body)

    const { conversationId, message } = await startOrReplyAsAdmin(
      session.user.id,
      memberId,
      content,
      attachment ?? null,
    )
    return NextResponse.json({ conversationId, message })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
