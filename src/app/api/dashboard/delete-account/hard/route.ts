import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { hardDeleteUser } from "@nba/lib/services/user-deletion"
import { logAuditEvent } from "@nba/lib/services/audit"
import { invalidatePrefix } from "@nba/lib/cache"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, deleteAccountSchema } from "@nba/lib/validations"
import { msg } from "@nba/lib/messages"

const log = logger.child({ module: "hard-delete" })

const SESSION_COOKIE_NAMES = ["__Secure-better-auth.session_token", "better-auth.session_token"]
const hardDeleteRateLimit = rateLimitMiddleware({ window: 3600, max: 1 })

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await hardDeleteRateLimit(request, `hard-delete:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const { password } = validateOrThrow(deleteAccountSchema, body)

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: "credential" },
      select: { password: true },
    })

    if (!account?.password) {
      return NextResponse.json({ error: msg.auth.NO_PASSWORD_SET }, { status: 400 })
    }

    const { verifyPassword } = await import("@better-auth/utils/password")
    const valid = await verifyPassword(account.password, password)
    if (!valid) {
      return NextResponse.json({ error: msg.auth.INCORRECT_PASSWORD }, { status: 400 })
    }

    const userEmail = session.user.email

    await hardDeleteUser(prisma, session.user.id)

    await Promise.all([
      logAuditEvent({
        userId: session.user.id,
        action: "DELETE_PERMANENT",
        resourceType: "user",
        resourceId: session.user.id,
        details: { selfService: true, userEmail, gdpr: true },
      }),
      invalidatePrefix("members:"),
      invalidatePrefix("ops"),
    ]).catch((err) => {
      log.warn({ err, userId: session.user.id, errorCode: "DATABASE_ERROR" }, "Non-blocking audit/cache invalidation failed during hard delete")
    })

    const response = NextResponse.json({ success: true })
    const isSecure = process.env.NODE_ENV === "production"
    for (const cookieName of SESSION_COOKIE_NAMES) {
      response.cookies.set(cookieName, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: cookieName.startsWith("__Secure-") ? true : isSecure,
        sameSite: "lax",
      })
    }

    return response
  } catch (error: any) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error)
    }
    return NextResponse.json({ error: error.message || msg.dashboard.ERROR }, { status: 500 })
  }
}
