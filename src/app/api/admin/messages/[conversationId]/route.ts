import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, messageSendSchema, ValidationError } from "@nba/lib/validations"
import { getConversationMessages, sendMessage } from "@nba/lib/services/messaging"

const messageRateLimit = rateLimitMiddleware({ window: 60, max: 20 })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { conversationId } = await params
    const before = req.nextUrl.searchParams.get("before")
    const result = await getConversationMessages(conversationId, session.user.id, {
      before: before || null,
    })
    return NextResponse.json(result)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const limited = await messageRateLimit(req, session.user.id)
    if (limited) return limited
    const { conversationId } = await params
    const body = await req.json().catch(() => ({}))
    const { content, attachment } = validateOrThrow(messageSendSchema, body)

    const message = await sendMessage(conversationId, session.user.id, content, attachment ?? null)
    return NextResponse.json({ message })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
