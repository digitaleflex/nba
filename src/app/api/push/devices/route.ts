import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

// GET /api/push/devices — liste les abonnements push de l'utilisateur courant
export async function GET() {
  try {
    const session = await requireActiveUser()
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: { id: true, endpoint: true, userAgent: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ devices: subs })
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/push/devices?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })
    await prisma.pushSubscription.deleteMany({ where: { id, userId: session.user.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
