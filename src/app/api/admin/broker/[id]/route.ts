import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewDocumentSchema, validateOrThrow } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"
import { scheduleFileCleanup } from "../../../../../../workers/queue"

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

    // Planifier le nettoyage des fichiers après 7 jours (APPROVED ou REJECTED)
    if (parsed.status === "APPROVED" || parsed.status === "REJECTED") {
      await scheduleFileCleanup("broker", id)
    }

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
