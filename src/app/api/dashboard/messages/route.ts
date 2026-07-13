import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, startMessageMemberSchema, messageSendSchema, ValidationError } from "@nba/lib/validations"
import { listConversations, startConversationAsMember } from "@nba/lib/services/messaging"
import { getCached } from "@nba/lib/cache"

const messageRateLimit = rateLimitMiddleware({ window: 60, max: 20 })

export async function GET() {
  try {
    const session = await requireAuth()
    const conversations = await getCached(
      "conv:" + session.user.id,
      () => listConversations(session.user.id),
      10,
    )
    return NextResponse.json({ conversations })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const limited = await messageRateLimit(req, session.user.id)
    if (limited) return limited
    const body = await req.json().catch(() => ({}))
    const { adminId } = validateOrThrow(startMessageMemberSchema, body)
    const { content, attachment } = validateOrThrow(messageSendSchema, body)

    const { conversationId, message } = await startConversationAsMember(
      session.user.id,
      adminId,
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
