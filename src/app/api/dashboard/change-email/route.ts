import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { notify } from "@nba/lib/services/notifications"
import { emailChangedEmail } from "@nba/lib/email"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const emailChangeRateLimit = rateLimitMiddleware({ window: 3600, max: 3 })

export async function PUT(request: Request) {
  try {
    const requestClone = request.clone()
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const rateLimitRes = await emailChangeRateLimit(requestClone, `email-change:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const { newEmail, currentPassword } = body

    if (!newEmail || !currentPassword) {
      return NextResponse.json({ error: "Nouvel email et mot de passe actuel requis" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 })
    }

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: "credential" },
      select: { password: true },
    })

    if (!account?.password) {
      return NextResponse.json({ error: "Aucun mot de passe configuré" }, { status: 400 })
    }

    const { verifyPassword } = await import("@better-auth/utils/password")
    const valid = await verifyPassword(account.password, currentPassword)
    if (!valid) {
      return NextResponse.json({ error: "Le mot de passe est incorrect" }, { status: 400 })
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
