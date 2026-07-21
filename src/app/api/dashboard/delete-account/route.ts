import { NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { sendAccountDeletionEmail } from "@nba/lib/services/notifications"
import { logAuditEvent } from "@nba/lib/services/audit"
import { softDeleteUser } from "@nba/lib/services/user-deletion"
import { invalidatePrefix } from "@nba/lib/cache"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, deleteAccountSchema } from "@nba/lib/validations"

const log = logger.child({ module: "delete-account" })

const SESSION_COOKIE_NAMES = ["__Secure-better-auth.session_token", "better-auth.session_token"]
const deleteAccountRateLimit = rateLimitMiddleware({ window: 3600, max: 2 })

export async function DELETE(request: Request) {
  try {
    const requestClone = request.clone()
    const session = await requireActiveUser()

    const rateLimitRes = await deleteAccountRateLimit(requestClone, `delete-account:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const { password } = validateOrThrow(deleteAccountSchema, body)

    const [user, account] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      }),
      prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "credential" },
        select: { password: true },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (!account?.password) {
      return NextResponse.json({ error: "Aucun mot de passe configuré" }, { status: 400 })
    }

    // Verify password using Better Auth's scrypt hasher (avoids signInEmail which creates a session)
    const { verifyPassword } = await import("@better-auth/utils/password")
    const valid = await verifyPassword(account.password, password)
    if (!valid) {
      return NextResponse.json({ error: "Le mot de passe est incorrect" }, { status: 400 })
    }

    // Soft delete: anonymise l'email + désactive le compte + supprime les sessions
    await softDeleteUser(prisma, session.user.id)

    // Audit log + cache invalidation (non-blocking)
    Promise.all([
      logAuditEvent({
        userId: session.user.id,
        action: "DELETE",
        resourceType: "user",
        resourceId: session.user.id,
        details: { selfService: true, userEmail: user.email, softDelete: true },
      }),
      invalidatePrefix("members:"),
      invalidatePrefix("ops"),
    ]).catch((err) => {
      log.warn({ err, userId: session.user.id }, "Non-blocking audit/cache invalidation failed")
    })

    // Send confirmation email (non-blocking)
    sendAccountDeletionEmail(user).catch((err) =>
      log.error({ err, userId: session.user.id }, "Deletion confirmation email failed")
    )

    // Clear session cookies
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
    const message = error.message || "Erreur lors de la suppression du compte"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
