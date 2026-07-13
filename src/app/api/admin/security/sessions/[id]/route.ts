import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params
    await prisma.session.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
