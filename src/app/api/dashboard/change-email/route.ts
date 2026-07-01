import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"
import { emailChangedEmail } from "@nba/lib/email"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { newEmail } = body

    if (!newEmail) {
      return NextResponse.json({ error: "Nouvel email requis" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    // Récupérer l'ancien email avant mise à jour
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const oldEmail = currentUser.email

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: newEmail,
        emailVerified: false,
      },
    })

    // Envoyer notification in-app + email de confirmation sur l'ANCIENNE adresse
    const template = emailChangedEmail(currentUser, newEmail)
    await notify({
      userId: session.user.id,
      type: "SECURITY",
      title: "Adresse email modifiée",
      body: `Votre adresse email a été changée de ${oldEmail} vers ${newEmail}.`,
      data: { action: "email_changed", oldEmail, newEmail },
      linkUrl: "/dashboard/profile",
      email: {
        to: oldEmail, // Envoyer sur l'ancien email pour sécurité
        subject: template.subject,
        html: template.html,
      },
    })

    return NextResponse.json({
      success: true,
      user: { email: updatedUser.email },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
