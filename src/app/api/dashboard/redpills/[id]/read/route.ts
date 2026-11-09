import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

// POST /api/dashboard/redpills/[id]/read — marquer une pilule comme lue
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveUser()
    const { id } = await params

    const redpill = await prisma.redpill.findFirst({
      where: { id, isPublished: true },
      select: { id: true },
    })
    if (!redpill) {
      return NextResponse.json({ error: "Pilule introuvable" }, { status: 404 })
    }

    await prisma.redpillRead.upsert({
      where: { redpillId_userId: { redpillId: id, userId: session.user.id } },
      update: {},
      create: { redpillId: id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
