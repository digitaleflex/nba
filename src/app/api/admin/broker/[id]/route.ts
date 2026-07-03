import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nba/lib/db";
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils";
import { reviewDocumentSchema, validateOrThrow } from "@nba/lib/validations";
import { logAuditEvent } from "@nba/lib/services/audit";
import { notify } from "@nba/lib/services/notifications";
import { brokerApprovedEmail, brokerRejectedEmail } from "@nba/lib/email";
import { scheduleFileCleanup } from "@nba/lib/queue";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("broker.review");
    const { id } = await params;
    const body = await req.json();
    const parsed = validateOrThrow(reviewDocumentSchema, body);

    const updated = await prisma.brokerVerification.update({
      where: { id },
      data: {
        status: parsed.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.notes,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: `broker.${parsed.status.toLowerCase()}`,
      resourceType: "broker_verification",
      resourceId: id,
      details: { notes: parsed.notes },
    });

    // Planifier le nettoyage des fichiers après 7 jours (APPROVED ou REJECTED)
    if (parsed.status === "APPROVED" || parsed.status === "REJECTED") {
      await scheduleFileCleanup("broker", id);
    }

    // Notifier l'utilisateur du résultat
    const user = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { name: true, email: true },
    });

    if (user) {
      const isApproved = parsed.status === "APPROVED";
      const template = isApproved
        ? brokerApprovedEmail(user)
        : brokerRejectedEmail(user, parsed.notes || "Aucun motif précisé");

      await notify({
        userId: updated.userId,
        type: "BROKER",
        title: isApproved
          ? "Compte Broker vérifié"
          : "Vérification Broker rejetée",
        body: isApproved
          ? "Votre compte Broker a été vérifié avec succès."
          : `Votre vérification Broker a été rejetée. Motif : ${parsed.notes || "Non précisé"}`,
        data: { documentId: id, status: parsed.status },
        linkUrl: "/dashboard/verification",
        email: {
          to: user.email,
          subject: template.subject,
          html: template.html,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}
