import { msg } from "../../../lib/messages"
import { prisma } from "@nba/lib/db"
import { AuthError } from "@nba/lib/auth-utils"
import { canCreateSignal } from "../policies/signal-policy"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function duplicateSignal(id: string, userId: string) {
  const signal = await prisma.signal.findUnique({
    where: { id },
    include: { audience: true },
  })

  if (!signal) {
    throw new Error(msg.signal.NOT_FOUND)
  }

  // Check create permissions for the user
  const allowed = await canCreateSignal(userId)
  if (!allowed) {
    throw new AuthError(msg.auth.ACCESS_DENIED, 403)
  }

  // Create the duplicated signal as a DRAFT
  const duplicated = await prisma.signal.create({
    data: {
      content: `${signal.content} (Copie)`,
      imageUrl: signal.imageUrl,
      imageUrls: signal.imageUrls || [],
      status: "DRAFT",
      createdBy: userId,
      audience: {
        create: signal.audience.map((a: any) => ({
          planId: a.planId,
        })),
      },
    },
    include: {
      audience: {
        include: {
          plan: true,
        },
      },
    },
  })

  // Create initial version 1 for the duplicate
  await prisma.signalVersion.create({
    data: {
      signalId: duplicated.id,
      version: 1,
      content: duplicated.content,
      imageUrls: duplicated.imageUrls || [],
      updatedBy: userId,
    },
  })

  await logAuditEvent({
    userId,
    action: "signal.duplicate",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      duplicateId: duplicated.id,
    },
  })

  return duplicated
}
