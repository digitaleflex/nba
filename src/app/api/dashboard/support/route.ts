import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { Resend } from "resend"
import { supportTicketEmail } from "@nba/lib/email"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, supportSchema } from "@nba/lib/validations"

const supportRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await supportRateLimit(req, `support:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await req.json()
    const { subject, message } = validateOrThrow(supportSchema, body)

    // Créer UN ticket unique (pas une notif par admin)
    // On l'assigne au premier admin pour qu'il apparaisse dans /api/admin/support
    const firstAdmin = await prisma.user.findFirst({
      where: { role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

    await prisma.notification.create({
      data: {
        userId: firstAdmin?.id ?? session.user.id,
        type: "support",
        title: `Support de ${session.user.email}`,
        body: `[${subject}] ${message}`,
        data: { userId: session.user.id, userEmail: session.user.email, userName: session.user.name, subject, message },
      },
    })

    // Envoyer un email à l'équipe support
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const template = supportTicketEmail(
        { name: session.user.name ?? "Utilisateur", email: session.user.email },
        subject,
        message,
      )
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@signauxx.com",
        to: process.env.SUPPORT_EMAIL || "support@signauxx.com",
        subject: template.subject,
        html: template.html,
      })
    } catch {
      // L'email est optionnel
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
