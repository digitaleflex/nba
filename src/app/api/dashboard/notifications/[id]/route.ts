import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response

    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!notification) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ notification: updated })
  } catch (error) {
    return handleAuthError(error)
  }
}
