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

async function handlePushRecovery(_payload: Record<string, unknown>): Promise<void> {
  log.warn({}, "Push recovery not implemented")
}


