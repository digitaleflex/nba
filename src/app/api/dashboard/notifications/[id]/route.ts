import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()

    const { id } = await params

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true, readAt: true },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification introuvable" }, { status: 404 })
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (notification.readAt) {
      return NextResponse.json({ ok: true, alreadyRead: true })
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), isRead: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()

    const { id } = await params

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification introuvable" }, { status: 404 })
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
