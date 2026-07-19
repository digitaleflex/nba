import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { validateOrThrow, messageEditSchema, messageDeleteSchema, ValidationError } from "@nba/lib/validations"
import { editMessage, deleteMessage } from "@nba/lib/services/messaging"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  try {
    const session = await requireActiveUser()
    const { messageId } = await params
    const body = await req.json().catch(() => ({}))
    const { content } = validateOrThrow(messageEditSchema, body)
    const message = await editMessage(messageId, session.user.id, content)
    return NextResponse.json({ message })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  try {
    const session = await requireActiveUser()
    const { messageId } = await params
    const body = await req.json().catch(() => ({}))
    const { forEveryone } = validateOrThrow(messageDeleteSchema, body)
    const result = await deleteMessage(messageId, session.user.id, forEveryone)
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
