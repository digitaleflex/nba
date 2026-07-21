import { NextRequest, NextResponse } from "next/server"
import { handleAuthError, requireRole } from "@nba/lib/auth-utils"
import { banEmail, unbanEmail, getBannedList } from "@nba/lib/services/moderation"
import { validateOrThrow, banUserSchema, unbanUserSchema } from "@nba/lib/validations"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const list = await getBannedList()
    return NextResponse.json(list)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rl = await rateLimitOrDeny("ADMIN_MEMBER_MUTATION", session.user.id)
    if (rl) return rl
    const { email, reason } = validateOrThrow(banUserSchema, await req.json())
    await banEmail({ email, reason, bannedBy: "admin" })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rl = await rateLimitOrDeny("ADMIN_MEMBER_MUTATION", session.user.id)
    if (rl) return rl
    const { email } = validateOrThrow(unbanUserSchema, await req.json())
    await unbanEmail(email)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}