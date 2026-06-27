import { prisma } from "@nba/lib/db"
import { AuthError } from "@nba/lib/auth-utils"
import { SignalPolicy } from "../policies/signal-policy"
import { logAuditEvent } from "@nba/lib/services/audit"
import { signalDistributionQueue } from "@nba/lib/queue"

export async function publishSignal(id: string, userId: string) {
  const signal = await prisma.signal.findUnique({
    where: { id },
  })

  if (!signal) {
    throw new Error("Signal introuvable")
  }

  // Check publish permissions for the user
  const allowed = await SignalPolicy.canPublish(userId)
  if (!allowed) {
    throw new AuthError("Accès refusé", 403)
  }

  // Cancel any scheduled job
  if (signal.jobId) {
    try {
      const job = await signalDistributionQueue.getJob(signal.jobId).catch(() => null)
      if (job) {
        await job.remove()
      }
    } catch (err) {
      console.error("[signal] Failed to remove scheduled job on immediate publish:", err)
    }
  }

  // Publish signal
  const publishedSignal = await prisma.signal.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      scheduledAt: null,
      jobId: null,
    },
    include: {
      audience: {
        include: {
          plan: true,
        },
      },
    },
  })

  let queueFailed = false
  try {
    await signalDistributionQueue.add(`distribute-${signal.id}`, {
      signalId: signal.id,
    })
  } catch (err) {
    console.error("[signal] BullMQ failed during manual publication:", err)
    queueFailed = true
  }

  await logAuditEvent({
    userId,
    action: "signal.publish",
    resourceType: "signal",
    resourceId: signal.id,
    details: {
      manual: true,
      queueFailed,
    },
  })

  return {
    ...publishedSignal,
    queueFailed,
  }
}
