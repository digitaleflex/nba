import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { sendAccountDeletionEmail } from "@nba/lib/services/notifications"

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

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

    // Soft delete + delete all sessions + remove password credentials
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { deletedAt: new Date() },
      }),
      prisma.session.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.account.deleteMany({
        where: { userId: session.user.id },
      }),
    ])

    // Send confirmation email (non-blocking)
    sendAccountDeletionEmail(user).catch((err) =>
      console.error("[delete-account] email failed:", err)
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message = error.message || "Erreur lors de la suppression du compte"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
