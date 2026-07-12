import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleAuthError } from "@nba/lib/auth-utils"
import { validateOrThrow, messageReactionSchema, ValidationError } from "@nba/lib/validations"
import { reactToMessage } from "@nba/lib/services/messaging"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  try {
    const session = await requireAuth()
    const { messageId } = await params
    const body = await req.json().catch(() => ({}))
    const { emoji } = validateOrThrow(messageReactionSchema, body)
    const reactions = await reactToMessage(messageId, session.user.id, emoji)
    return NextResponse.json({ reactions })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
