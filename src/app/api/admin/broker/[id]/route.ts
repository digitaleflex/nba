import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status, reviewerId, notes } = body

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const updated = await prisma.brokerVerification.update({
    where: { id },
    data: {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    },
  })

  return NextResponse.json(updated)
}
