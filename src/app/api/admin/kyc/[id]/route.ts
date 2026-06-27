import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewDocumentSchema, validateOrThrow } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("kyc.review")
    const { id } = await params
    const body = await req.json()
    const parsed = validateOrThrow(reviewDocumentSchema, body)

    const updated = await prisma.kycDocument.update({
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
      action: `kyc.${parsed.status.toLowerCase()}`,
      resourceType: "kyc_document",
      resourceId: id,
      details: { notes: parsed.notes },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
