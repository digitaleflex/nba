import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewDocumentSchema, validateOrThrow } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("broker.review")
    const { id } = await params
    const body = await req.json()
    const parsed = validateOrThrow(reviewDocumentSchema, body)

    const updated = await prisma.brokerVerification.update({
      where: { id },
      data: {
        status: parsed.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.notes,
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: `broker.${parsed.status.toLowerCase()}`,
      resourceType: "broker_verification",
      resourceId: id,
      details: { notes: parsed.notes },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
