import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { notify, sendEmailSync } from "@nba/lib/services/notifications"
import { passwordChangedEmail } from "@nba/lib/email"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Mot de passe actuel et nouveau mot de passe requis" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Use Better Auth's API to change password
    const { auth } = await import("@nba/lib/auth")

    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: request.headers,
    })

    // Envoyer notification in-app + email de confirmation
    const template = passwordChangedEmail(user)
    await notify({
      userId: session.user.id,
      type: "SECURITY",
      title: "Mot de passe modifié",
      body: "Votre mot de passe a été modifié avec succès.",
      data: { action: "password_changed" },
      linkUrl: "/dashboard/profile",
      email: {
        to: user.email,
        subject: template.subject,
        html: template.html,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message = error.message || "Erreur lors du changement de mot de passe"
    if (message.includes("Invalid password") || message.includes("incorrect")) {
      return NextResponse.json({ error: "Le mot de passe actuel est incorrect" }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
