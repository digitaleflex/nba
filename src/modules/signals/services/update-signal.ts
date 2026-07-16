import { prisma } from "@nba/lib/db"
import { signalUpdateSchema } from "../validators/signal-schema"
import { AuthError } from "@nba/lib/auth-utils"
import { SignalPolicy } from "../policies/signal-policy"
import { logAuditEvent } from "@nba/lib/services/audit"
import { signalDistributionQueue } from "@nba/lib/queue"

export interface UpdateSignalInput {
  content?: string
  imageUrl?: string | null
  imageUrls?: string[]
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
    throw new Error("Signal introuvable")
  }

  // 1. Check permissions using SignalPolicy
  const allowed = await SignalPolicy.canUpdate(userId, signal)
  if (!allowed) {
    throw new AuthError("Accès refusé", 403)
  }

  const parsed = signalUpdateSchema.parse(input)

  // 2. Handle scheduled publishing / BullMQ job management
  const isScheduled = !!parsed.scheduledAt && new Date(parsed.scheduledAt).getTime() > Date.now()
  const nextStatus = isScheduled ? "DRAFT" : (parsed.status ?? signal.status)

  // Cancel existing BullMQ job if any
  if (signal.jobId) {
    try {
      const job = await signalDistributionQueue.getJob(signal.jobId).catch(() => null)
      if (job) {
        await job.remove()
      }
    } catch (err) {
      console.error("[signal] Failed to remove previous scheduled job:", err)
    }
  }

  // Increment version number
  const nextVersion = signal.currentVersion + 1

  // Handle first image legacy url
  const existingImageUrls = (signal.imageUrls as string[]) ?? []
  const imageUrls = parsed.imageUrls ?? existingImageUrls
  const legacyImageUrl = imageUrls.length > 0
    ? imageUrls[0]
    : (parsed.imageUrl ?? signal.imageUrl ?? null)

  // 3. Build update data
  const updateData: Record<string, unknown> = {
    currentVersion: nextVersion,
  }

  if (parsed.content !== undefined) updateData.content = parsed.content
  if (parsed.imageUrl !== undefined) updateData.imageUrl = parsed.imageUrl
  if (parsed.imageUrls !== undefined) updateData.imageUrls = parsed.imageUrls
  updateData.status = nextStatus
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

  const updatedSignal = await prisma.signal.update({
    where: { id },
    data: updateData,
    include: {
      audience: {
        include: {
          plan: true,
        },
      },
    },
  })

  // 4. Create new SignalVersion history entry (only if content changed)
  if (parsed.content !== undefined) {
    await prisma.signalVersion.create({
      data: {
        signalId: signal.id,
        version: nextVersion,
        content: parsed.content,
        imageUrls: imageUrls,
        updatedBy: userId,
      },
    })
  }

  let queueFailed = false
  let newJobId: string | null = null

  // 5. Schedule/Publish job if needed
  if (isScheduled) {
    try {
      const delay = new Date(parsed.scheduledAt!).getTime() - Date.now()
      const job = await signalDistributionQueue.add(
        `distribute-${signal.id}`,
        { signalId: signal.id },
        { delay }
      )
      newJobId = job.id || null
      
      await prisma.signal.update({
        where: { id: signal.id },
        data: { jobId: newJobId },
      })
    } catch (err) {
      console.error("[signal] BullMQ failed during rescheduling:", err)
      queueFailed = true
    }
  } else if (parsed.status === "PUBLISHED" && signal.status !== "PUBLISHED") {
    // Only queue distribution if publishing a previously unpublished signal
    try {
      await signalDistributionQueue.add(`distribute-${signal.id}`, {
        signalId: signal.id,
      })
    } catch (err) {
      console.error("[signal] BullMQ failed during update publication:", err)
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
      version: nextVersion,
      isScheduled,
      queueFailed,
    },
  })

  return {
    ...updatedSignal,
    queueFailed,
  }
}
