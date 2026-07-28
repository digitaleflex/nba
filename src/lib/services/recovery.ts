import { recoveryQueue } from "../queue"
import { sendEmail } from "../email"
import { prisma } from "../db"
import { logger } from "../logger"

const log = logger.child({ module: "recovery" })

export type RecoveryJobType =
  | "EMAIL_SEND"
  | "PUSH_SEND"
  | "SIGNAL_DISTRIBUTION"
  | "FILE_CLEANUP"

export interface RecoveryJobData {
  type: RecoveryJobType
  originalQueue: string
  originalJobId: string
  originalJobName: string
  payload: Record<string, unknown>
  errorMessage: string
  failedAt: string
}

export async function enqueueRecovery(data: RecoveryJobData): Promise<void> {
  await recoveryQueue.add(
    `recovery-${data.type}-${data.originalJobId}`,
    data,
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 14 * 24 * 3600 },
    },
  )
  log.info({ type: data.type, originalJobId: data.originalJobId }, "Recovery job enqueued")
}

export async function processRecovery(job: RecoveryJobData): Promise<void> {
  const { type, payload } = job

  switch (type) {
    case "EMAIL_SEND":
      await handleEmailRecovery(payload as unknown as EmailPayload)
      break
    case "PUSH_SEND":
      await handlePushRecovery(payload)
      break
    case "SIGNAL_DISTRIBUTION":
      await handleSignalDistributionRecovery(payload)
      break
    case "FILE_CLEANUP":
      log.info({ payload }, "File cleanup retry — re-enqueued")
      const { getQueue } = await import("@nba/lib/queue")
      const cleanupQueue = getQueue("file-cleanup")
      await cleanupQueue.add(payload.originalJobName as string, payload.payload || {}, { delay: 60_000 })
      break
    default:
      log.warn({ type }, "Unhandled recovery job type")
  }
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  deliveryId?: string
}

async function handleEmailRecovery(payload: EmailPayload): Promise<void> {
  const externalId = await sendEmail(payload.to, {
    subject: payload.subject,
    html: payload.html,
  })

  if (payload.deliveryId) {
    await prisma.notificationDelivery.update({
      where: { id: payload.deliveryId },
      data: { status: "SENT", sentAt: new Date(), externalId: externalId ?? undefined },
    })
  }
}

async function handlePushRecovery(payload: Record<string, unknown>): Promise<void> {
  const deliveryId = payload.deliveryId as string | undefined
  if (!deliveryId) {
    log.warn({}, "Push recovery skipped: missing deliveryId")
    return
  }

  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
  })
  if (!delivery || delivery.status !== "PENDING") {
    log.warn({ deliveryId, status: delivery?.status }, "Push recovery skipped: delivery not PENDING")
    return
  }

  const { getQueue } = await import("@nba/lib/queue")
  const queue = getQueue("push-delivery")
  await queue.add(
    `push-recovery-${deliveryId}`,
    {
      deliveryId: payload.deliveryId,
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard",
      tag: payload.tag || deliveryId,
    },
    { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  )

  log.info({ deliveryId }, "Push recovery job re-enqueued")
}

async function handleSignalDistributionRecovery(payload: Record<string, unknown>): Promise<void> {
  const signalId = payload.signalId as string | undefined
  if (!signalId) {
    log.warn({}, "Signal distribution recovery skipped: missing signalId")
    return
  }

  const { getQueue } = await import("@nba/lib/queue")
  const queue = getQueue("signal-distribution")
  await queue.add(
    `distribute-recovery-${signalId}`,
    { signalId },
    { attempts: 1, backoff: { type: "exponential", delay: 5000 } },
  )

  log.info({ signalId }, "Signal distribution recovery job re-enqueued")
}


