import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { verifyDeviceCode } from "@nba/lib/services/device"
import { validateOrThrow, deviceVerifySchema } from "@nba/lib/validations"
import { msg } from "@nba/lib/messages"
<<<<<<< HEAD
=======
import { rateLimitOrDeny } from "@nba/lib/rate-limit"
>>>>>>> 2ae613b (feat(errors): E12 — rate limiting amélioré)

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const rl = await rateLimitOrDeny("DEVICE_MUTATION", session.user.id)
    if (rl) return rl
    const body = await req.json()
    const { code } = validateOrThrow(deviceVerifySchema, body)
    await verifyDeviceCode(session.user.id, code, req)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Code invalide ou expiré") {
      return NextResponse.json({ error: msg.onboarding.CODE_INCORRECT }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
