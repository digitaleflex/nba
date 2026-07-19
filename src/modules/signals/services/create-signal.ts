import { prisma } from "@nba/lib/db"
import { signalCreateSchema } from "../validators/signal-schema"
import { requirePermission } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"
import { signalDistributionQueue } from "@nba/lib/queue"

export interface CreateSignalInput {
  content: string
  imageUrl?: string | null
  imageUrls?: string[]
  suggestedStopLoss?: number
  suggestedTakeProfit?: number
  planIds: string[]
  status: "DRAFT" | "PUBLISHED"
  scheduledAt?: string | null
}

export async function createSignal(input: CreateSignalInput) {
  const session = await requirePermission("signals.create")
  const parsed = signalCreateSchema.parse(input)

  const isScheduled = !!parsed.scheduledAt && new Date(parsed.scheduledAt).getTime() > Date.now()
  const initialStatus = isScheduled ? "DRAFT" : parsed.status
  const imageUrl = parsed.imageUrls?.[0] ?? parsed.imageUrl ?? null

  const [signal] = await prisma.$transaction(async (tx) => {
    const s = await tx.signal.create({
      data: {
        content: parsed.content,
        imageUrl,
        imageUrls: parsed.imageUrls || [],
        suggestedStopLoss: parsed.suggestedStopLoss ?? null,
        suggestedTakeProfit: parsed.suggestedTakeProfit ?? null,
        status: initialStatus,
        createdBy: session.user.id,
        publishedAt: (!isScheduled && parsed.status === "PUBLISHED") ? new Date() : null,
        scheduledAt: isScheduled ? new Date(parsed.scheduledAt!) : null,
        audience: {
          create: parsed.planIds.map((planId) => ({ planId })),
        },
      },
      include: {
        audience: { include: { plan: true } },
      },
    })

    await tx.signalVersion.create({
      data: {
        signalId: s.id,
        version: 1,
        content: parsed.content,
        imageUrls: parsed.imageUrls || [],
        updatedBy: session.user.id,
      },
    })

    return [s]
  })

  let queueFailed = false

  if (isScheduled) {
    try {
      const delay = new Date(parsed.scheduledAt!).getTime() - Date.now()
      const job = await signalDistributionQueue.add(
        `distribute-${signal.id}`,
        { signalId: signal.id },
        { delay }
      )
      await prisma.signal.update({
        where: { id: signal.id },
        data: { jobId: job.id || null },
      })
    } catch (err) {
      console.error("[signal] BullMQ failed during scheduling:", err)
      queueFailed = true
    }
  } else if (parsed.status === "PUBLISHED") {
    try {
      await signalDistributionQueue.add(`distribute-${signal.id}`, {
        signalId: signal.id,
      })
    } catch (err) {
      console.error(`[signal] BullMQ failed during publication (signalId=${signal.id}):`, err)
      queueFailed = true
    }
  }

  await logAuditEvent({
    userId: session.user.id,
    action: parsed.status === "PUBLISHED"
      ? (isScheduled ? "signal.schedule" : "signal.publish")
      : "signal.draft",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      status: parsed.status,
      isScheduled,
      scheduledAt: parsed.scheduledAt,
      queueFailed,
      recipientPlans: signal.audience.map((a: any) => a.plan.name),
    },
  })

  return { ...signal, queueFailed }
}
