import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("broker.review")
    const { id } = await params
    const body = await req.json()
    const { status, notes } = body

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    const updated = await prisma.brokerVerification.update({
      where: { id },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
