import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function PUT() {
  try {
    const session = await requireActiveUser()

    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date(), isRead: true },
    })

    return NextResponse.json({ ok: true, count: result.count })
  } catch (error) {
    return handleAuthError(error)
  }
}
