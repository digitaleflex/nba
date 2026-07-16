import { NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { sendAccountDeletionEmail } from "@nba/lib/services/notifications"
import { logAuditEvent } from "@nba/lib/services/audit"
import { hardDeleteUser } from "@nba/lib/services/user-deletion"
import { invalidatePrefix } from "@nba/lib/cache"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const deleteAccountRateLimit = rateLimitMiddleware({ window: 3600, max: 2 })

export async function DELETE(request: Request) {
  try {
    const requestClone = request.clone()
    const session = await requireActiveUser()

    const rateLimitRes = await deleteAccountRateLimit(requestClone, `delete-account:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Mot de passe requis pour supprimer le compte" }, { status: 400 })
    }

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

    // Hard delete (removes user + all dependent records)
    await hardDeleteUser(prisma, session.user.id)

    // Audit log + cache invalidation (non-blocking)
    Promise.all([
      logAuditEvent({
        userId: session.user.id,
        action: "DELETE",
        resourceType: "user",
        resourceId: session.user.id,
        details: { selfService: true, userEmail: user.email },
      }),
      invalidatePrefix("members:"),
      invalidatePrefix("ops"),
    ]).catch(() => {})

    // Send confirmation email (non-blocking)
    sendAccountDeletionEmail(user).catch((err) =>
      console.error("[delete-account] email failed:", err)
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.name === "AuthError") {
      return handleAuthError(error)
    }
    const message = error.message || "Erreur lors de la suppression du compte"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
