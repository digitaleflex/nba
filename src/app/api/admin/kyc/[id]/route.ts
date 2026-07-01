import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewDocumentSchema, validateOrThrow } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"
import { notify } from "@nba/lib/services/notifications"
import { kycApprovedEmail, kycRejectedEmail } from "@nba/lib/email"
import { scheduleFileCleanup } from "../../../../../../workers/queue"

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

    // Planifier le nettoyage des fichiers après 7 jours (APPROVED ou REJECTED)
    if (parsed.status === "APPROVED" || parsed.status === "REJECTED") {
      await scheduleFileCleanup("kyc", id)
    }

    // Notifier l'utilisateur du résultat
    const user = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { name: true, email: true },
    })

    if (user) {
      const isApproved = parsed.status === "APPROVED"
      const template = isApproved
        ? kycApprovedEmail(user)
        : kycRejectedEmail(user, parsed.notes || "Aucun motif précisé")

      await notify({
        userId: updated.userId,
        type: "KYC",
        title: isApproved ? "Documents KYC approuvés" : "Documents KYC rejetés",
        body: isApproved
          ? "Vos documents d'identité ont été vérifiés avec succès."
          : `Vos documents ont été rejetés. Motif : ${parsed.notes || "Non précisé"}`,
        data: { documentId: id, status: parsed.status },
        linkUrl: "/dashboard/verification",
        email: {
          to: user.email,
          subject: template.subject,
          html: template.html,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
