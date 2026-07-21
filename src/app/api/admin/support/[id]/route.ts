import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { sendEmail } from "@nba/lib/email"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params
    const body = await request.json()
    const { adminResponse, status } = body

    if (!adminResponse || !status) {
      return NextResponse.json(
        { error: "adminResponse et status requis" },
        { status: 400 },
      )
    }

    if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide. Valeurs: OPEN, IN_PROGRESS, CLOSED" },
        { status: 400 },
      )
    }

    const ticket = await prisma.notification.findUnique({
      where: { id, type: "support" },
      select: { id: true, userId: true, data: true, title: true, user: { select: { email: true, name: true } } },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })
    }

    const existingData = ticket.data as Record<string, unknown>
    const updatedData = {
      ...existingData,
      adminResponse,
      status,
      respondedAt: new Date().toISOString(),
      respondedBy: (session.user as any)?.name ?? "Admin",
    }

    await prisma.notification.update({
      where: { id },
      data: { data: updatedData },
    })

    // Notifier le membre que l'admin a répondu
    const submitterId = (existingData as any)?.userId as string | undefined
    if (submitterId) {
      await prisma.notification.create({
        data: {
          userId: submitterId,
          type: "support_response",
          title: `Réponse à votre ticket : ${ticket.title}`,
          body: adminResponse.slice(0, 500),
          data: { ticketId: id, adminResponse: adminResponse.slice(0, 200), status },
        },
      })
    }

    // Envoyer un email au membre
    if (ticket.user?.email) {
      await sendEmail(ticket.user.email, {
        subject: `[NBA] Réponse à votre ticket — ${ticket.title}`,
        html: `<p>Bonjour ${ticket.user.name ?? ""},</p>
<p>Un administrateur a répondu à votre ticket <strong>${ticket.title}</strong> :</p>
<blockquote style="background:#f5f5f5;padding:12px;border-radius:6px">${adminResponse}</blockquote>
<p><b>Statut :</b> ${status}</p>
<p><a href="https://access.signauxx.com/dashboard/support">Voir mes tickets</a></p>`,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, data: updatedData })
  } catch (error) {
    return handleAuthError(error)
  }
}
