import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })
    await prisma.session.deleteMany({ where: { userId } })
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, suspendedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
