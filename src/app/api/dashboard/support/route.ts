import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { subject, message } = await req.json()

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Sujet et message requis" }, { status: 400 })
    }

    // Notifier les admins
    const admins = await prisma.user.findMany({
      where: {
        role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
      },
      select: { id: true },
    })

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "support",
        title: `Support de ${session.user.email}`,
        body: `[${subject}] ${message}`,
        data: { userId: session.user.id, subject, message },
      })),
    })

    // Envoyer un email à l'équipe support
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@signauxx.com",
        to: process.env.SUPPORT_EMAIL || "support@signauxx.com",
        subject: `[Support NBA] ${subject}`,
        text: `De: ${session.user.email} (${session.user.name})\n\n${message}`,
      })
    } catch {
      // L'email est optionnel, on ignore l'erreur
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
