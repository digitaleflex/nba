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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }) as { name: string; email: string } | null

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Verify password using Better Auth's signIn
    const { auth } = await import("@nba/lib/auth")

    await auth.api.signInEmail({
      body: {
        email: user.email,
        password: password,
      },
    })

    // Envoyer un email de confirmation avant suppression
    await sendAccountDeletionEmail(user).catch((err) =>
      console.error("[delete-account] email failed:", err)
    )

    // Soft delete - set deletedAt
    await prisma.user.update({
      where: { id: session.user.id },
      data: { deletedAt: new Date() },
    })

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message = error.message || "Erreur lors de la suppression du compte"
    if (message.includes("invalid") || message.includes("password") || message.includes("Invalid")) {
      return NextResponse.json({ error: "Le mot de passe est incorrect" }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
