import { msg } from "../../../lib/messages"
import { prisma, withRetryTransaction } from "@nba/lib/db"
import { signalUpdateSchema } from "../validators/signal-schema"
import { AuthError } from "@nba/lib/auth-utils"
import { canUpdateSignal } from "../policies/signal-policy"
import { logAuditEvent } from "@nba/lib/services/audit"
import { signalDistributionQueue } from "@nba/lib/queue"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "update-signal" })

export interface UpdateSignalInput {
  content?: string
  imageUrl?: string | null
  imageUrls?: string[]
  suggestedStopLoss?: number
  suggestedTakeProfit?: number
  planIds?: string[]
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  scheduledAt?: string | null
}

export async function updateSignal(id: string, userId: string, input: UpdateSignalInput) {
  const signal = await prisma.signal.findUnique({
    where: { id },
    include: { audience: true }
  })

  if (!signal) {
    throw new Error(msg.signal.NOT_FOUND)
  }

  const allowed = await canUpdateSignal(userId, signal)
  if (!allowed) {
    throw new AuthError(msg.auth.ACCESS_DENIED, 403)
  }

  const parsed = signalUpdateSchema.parse(input)

  const isScheduled = !!parsed.scheduledAt && new Date(parsed.scheduledAt).getTime() > Date.now()
  const nextStatus = isScheduled ? "DRAFT" : (parsed.status ?? signal.status)

  if (signal.jobId) {
    try {
      const job = await signalDistributionQueue.getJob(signal.jobId).catch(() => null)
      if (job) {
        await job.remove()
      }
    } catch (err) {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "[signal] Failed to remove previous scheduled job")
    }
  }

  const imageUrls = parsed.imageUrls ?? (signal.imageUrls as string[])
  const imageUrl = parsed.imageUrl ?? imageUrls[0] ?? null
  const contentChanged = parsed.content !== undefined && parsed.content !== signal.content
  const version = contentChanged ? signal.currentVersion + 1 : signal.currentVersion

  const updateData: any = {}

  if (parsed.content !== undefined) updateData.content = parsed.content
  if (parsed.imageUrl !== undefined || parsed.imageUrls !== undefined) {
    updateData.imageUrl = imageUrl
    updateData.imageUrls = imageUrls
  }
  if (parsed.suggestedStopLoss !== undefined) updateData.suggestedStopLoss = parsed.suggestedStopLoss
  if (parsed.suggestedTakeProfit !== undefined) updateData.suggestedTakeProfit = parsed.suggestedTakeProfit
  updateData.status = nextStatus
  if (contentChanged) updateData.currentVersion = version
  updateData.publishedAt = (!isScheduled && parsed.status === "PUBLISHED") ? new Date() : signal.publishedAt
  if (parsed.scheduledAt !== undefined) {
    updateData.scheduledAt = isScheduled ? new Date(parsed.scheduledAt!) : null
  }
  updateData.jobId = null

  if (parsed.planIds !== undefined) {
    updateData.audience = {
      deleteMany: {},
      create: parsed.planIds.map((planId: string) => ({ planId })),
    }
  }

  const [updatedSignal] = await withRetryTransaction(async (tx) => {
    const s = await tx.signal.update({
      where: { id },
      data: updateData,
      include: {
        audience: { include: { plan: true } },
      },
    })

    if (contentChanged) {
      await tx.signalVersion.create({
        data: {
          signalId: s.id,
          version,
          content: parsed.content!,
          imageUrls,
          updatedBy: userId,
        },
      })
    }

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
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "[signal] BullMQ failed during rescheduling")
      queueFailed = true
    }
  } else if (parsed.status === "PUBLISHED" && signal.status !== "PUBLISHED") {
    try {
      await signalDistributionQueue.add(`distribute-${signal.id}`, {
        signalId: signal.id,
      })
    } catch (err) {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "[signal] BullMQ failed during update publication")
      queueFailed = true
    }
  }

  await logAuditEvent({
    userId,
    action: "signal.update",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      fromStatus: signal.status,
      toStatus: nextStatus,
      version,
      contentChanged,
      isScheduled,
      queueFailed,
    },
  })

  return { ...updatedSignal, queueFailed }
}
