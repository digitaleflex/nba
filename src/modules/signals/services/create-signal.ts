import { prisma } from "@nba/lib/db"
import { signalCreateSchema } from "../validators/signal-schema"
import { requirePermission } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"
import { signalDistributionQueue } from "@nba/lib/queue"

export interface CreateSignalInput {
  content: string
  imageUrl?: string | null
  planIds: string[]
  status: "DRAFT" | "PUBLISHED"
}

export async function createSignal(input: CreateSignalInput) {
  const session = await requirePermission("signals.create")
  const parsed = signalCreateSchema.parse(input)

  const signal = await prisma.signal.create({
    data: {
      content: parsed.content,
      imageUrl: parsed.imageUrl || null,
      status: parsed.status,
      createdBy: session.user.id,
      publishedAt: parsed.status === "PUBLISHED" ? new Date() : null,
      audience: {
        create: parsed.planIds.map((planId) => ({
          planId,
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

  if (parsed.status === "PUBLISHED") {
    await signalDistributionQueue.add(`distribute-${signal.id}`, {
      signalId: signal.id,
    })
  }

  await logAuditEvent({
    userId: session.user.id,
    action: parsed.status === "PUBLISHED" ? "signal.publish" : "signal.draft",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      status: parsed.status,
      recipientPlans: signal.audience.map((a) => a.plan.name),
    },
  })

  return signal
}
