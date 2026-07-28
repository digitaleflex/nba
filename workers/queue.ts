import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import * as Sentry from "@sentry/node"
import { prisma } from "../src/lib/db"
import { getStorage } from "../src/lib/storage"
import { sendEmail } from "../src/lib/email"
import { distributeSignal } from "../src/lib/services/signal-distribution"
import { processRecovery, enqueueRecovery, type RecoveryJobData } from "../src/lib/services/recovery"
import { listPendingForRetry, incrementAttempts, escalateDlq, replayEmailEvent } from "../src/lib/services/email-webhooks"
import { sendPushToUser } from "../src/lib/services/push"
import { logger } from "../src/lib/logger"

// Initialize Sentry for worker process
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "production",
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Scrub PII
      const scrub = (obj: unknown) => {
        if (!obj || typeof obj !== "object") return
        const o = obj as Record<string, unknown>
        for (const key of ["password", "token", "secret", "authorization", "email"]) {
          if (key in o) o[key] = "[REDACTED]"
        }
      }
      try {
        scrub(event.request?.headers)
        scrub(event.request?.data)
      } catch {}
      return event
    },
  })
}

const log = logger.child({ module: "worker" })

// Stable connection initialization with timeouts and circuit breaker
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  connectTimeout: 5000,
  commandTimeout: 5000,
  retryStrategy: (times: number) => {
    if (times > 10) {
      log.error({ retries: times }, "Redis unavailable after max retries")
      return null
    }
    return Math.min(times * 200, 2000)
  },
} as any)

connection.on("error", (err: Error) => {
  log.error({ err }, "Redis connection error")
})

// ── Dead Letter Queue ──
export const deadLetterQueue = new Queue("dead-letter", { connection: connection as any, skipVersionCheck: true })

async function sendToDeadLetter(
  queueName: string,
  job: any,
  err: Error,
) {
  try {
    await deadLetterQueue.add(
      `${queueName}:${job.id}`,
      {
        originalQueue: queueName,
        originalJobId: job.id,
        jobName: job.name,
        jobData: job.data,
        errorMessage: err.message,
        failedAt: new Date().toISOString(),
      },
      { removeOnComplete: { age: 7 * 24 * 3600 }, removeOnFail: { age: 14 * 24 * 3600 } },
    )
      log.warn({ jobId: job.id, queue: queueName }, "Job moved to DLQ")
    } catch (dlqErr: any) {
      log.error({ err: dlqErr }, "Failed to enqueue to DLQ")
  }
}

// ── File Cleanup Queue ──
export const cleanupQueue = new Queue("file-cleanup", { connection: connection as any, skipVersionCheck: true })

const worker = new Worker(
  "file-cleanup",
  async (job: any) => {
    const { type, id } = job.data

    if (type === "kyc") {
      const doc = await prisma.kycDocument.findUnique({ where: { id } })
      if (!doc) return

      const storage = getStorage()
      const files = [doc.frontFilePath, doc.backFilePath].filter(Boolean) as string[]
      for (const file of files) {
        await storage.delete(file).catch(() => {})
      }
    }

    if (type === "broker") {
      const verif = await prisma.brokerVerification.findUnique({ where: { id } })
      if (!verif) return

      const storage = getStorage()
      await storage.delete(verif.videoFilePath).catch(() => {})
    }
  },
  {
    connection: connection as any,
    stalledInterval: 30000,
    lockDuration: 60000,
  }
)

worker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "file-cleanup" }, "Job completed")
})

worker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "file-cleanup", err }, "Job failed")
  Sentry.captureException(err, { extra: { queue: "file-cleanup", jobId: job?.id } })
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("file-cleanup", job, err)
    enqueueRecovery({
      type: "FILE_CLEANUP",
      originalQueue: "file-cleanup",
      originalJobId: job.id,
      originalJobName: job.name,
      payload: job.data,
      errorMessage: err.message,
      failedAt: new Date().toISOString(),
    })
  }
})

log.info("File cleanup worker started")

export async function scheduleFileCleanup(type: "kyc" | "broker", id: string) {
  await cleanupQueue.add(
    `cleanup-${type}-${id}`,
    { type, id },
    { delay: 7 * 24 * 60 * 60 * 1000 } // 7 days
  )
}

// ── Email / Notification Delivery Queue ──
export const notificationDeliveryQueue = new Queue("notification-delivery", { connection: connection as any, skipVersionCheck: true })

const notificationWorker = new Worker(
  "notification-delivery",
  async (job: any) => {
    const { deliveryId, to, subject, html } = job.data
    try {
      const externalId = await sendEmail(to, { subject, html })
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "SENT", sentAt: new Date(), externalId: externalId ?? undefined },
      })
    } catch (err: any) {
      log.error({ err, to }, "Échec envoi email")
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "FAILED", errorMessage: err.message || "Erreur email" },
      })
      throw err
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
    stalledInterval: 30000,
    lockDuration: 60000,
  }
)

notificationWorker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "notification-delivery" }, "Job completed")
})

notificationWorker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "notification-delivery", err }, "Job failed")
  Sentry.captureException(err, { extra: { queue: "notification-delivery", jobId: job?.id } })
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("notification-delivery", job, err)
    enqueueRecovery({
      type: "EMAIL_SEND",
      originalQueue: "notification-delivery",
      originalJobId: job.id,
      originalJobName: job.name,
      payload: job.data,
      errorMessage: err.message,
      failedAt: new Date().toISOString(),
    })
  }
})

log.info("Notification delivery worker started")

// ── Push Delivery Queue (avec retry automatique) ──
export const pushDeliveryQueue = new Queue("push-delivery", { connection: connection as any, skipVersionCheck: true })

const pushWorker = new Worker(
  "push-delivery",
  async (job: any) => {
    const { deliveryId, userId, title, body, url, tag } = job.data
    try {
      const result = await sendPushToUser(userId, { title, body, url, tag })
      if (result.sent > 0 || result.failed === 0) {
        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: { status: "SENT", sentAt: new Date() },
        })
      } else {
        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: { status: "FAILED", errorMessage: "Aucune souscription push active" },
        })
      }
    } catch (err: any) {
      log.error({ err, userId }, "Échec envoi push")
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "FAILED", errorMessage: err.message || "Erreur push" },
      })
      throw err
    }
  },
  {
    connection: connection as any,
    concurrency: 10,
    stalledInterval: 30000,
    lockDuration: 60000,
  }
)

pushWorker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "push-delivery" }, "Job completed")
})

pushWorker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "push-delivery", err }, "Job failed")
  Sentry.captureException(err, { extra: { queue: "push-delivery", jobId: job?.id } })
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("push-delivery", job, err)
    enqueueRecovery({
      type: "PUSH_SEND",
      originalQueue: "push-delivery",
      originalJobId: job.id,
      originalJobName: job.name,
      payload: job.data,
      errorMessage: err.message,
      failedAt: new Date().toISOString(),
    })
  }
})

log.info("Push delivery worker started")

// ── Signal Distribution Queue ──
export const signalDistributionQueue = new Queue("signal-distribution", { connection: connection as any, skipVersionCheck: true })

const signalWorker = new Worker(
  "signal-distribution",
  async (job: any) => {
    await distributeSignal(job.data.signalId, {
      publish: async (channel, payload) => {
        await connection.publish(channel, JSON.stringify(payload))
      },
      enqueueEmail: (name, data, opts) => notificationDeliveryQueue.add(name, data, opts),
      enqueuePush: (name, data, opts) => pushDeliveryQueue.add(name, data, opts),
    })
  },
  {
    connection: connection as any,
    concurrency: 1,
    stalledInterval: 60000,
    lockDuration: 120000,
  }
)

signalWorker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "signal-distribution" }, "Job completed")
})

signalWorker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "signal-distribution", err }, "Job failed")
  Sentry.captureException(err, { extra: { queue: "signal-distribution", jobId: job?.id } })
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("signal-distribution", job, err)
    enqueueRecovery({
      type: "SIGNAL_DISTRIBUTION",
      originalQueue: "signal-distribution",
      originalJobId: job.id,
      originalJobName: job.name,
      payload: job.data,
      errorMessage: err.message,
      failedAt: new Date().toISOString(),
    })
  }
})

log.info("Signal distribution worker started")

// ── Recovery Queue ──
export const recoveryQueue = new Queue("recovery", { connection: connection as any, skipVersionCheck: true })

const recoveryWorker = new Worker(
  "recovery",
  async (job: any) => {
    const data = job.data as RecoveryJobData
    log.info({ type: data.type, originalJobId: data.originalJobId, attempt: job.attemptsMade + 1 }, "Processing recovery job")
    await processRecovery(data)
  },
  {
    connection: connection as any,
    concurrency: 5,
    stalledInterval: 30000,
    lockDuration: 60000,
  }
)

recoveryWorker.on("completed", (job: any) => {
  log.info({ jobId: job.id, type: job.data?.type }, "Recovery job completed")
})

recoveryWorker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, type: job?.data?.type, err }, "Recovery job exhausted retries")
  Sentry.captureException(err, { extra: { queue: "recovery", jobId: job?.id } })
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("recovery", job, err)
  }
})

log.info("Recovery worker started")

// ── Stale Delivery Cleanup (every hour) ──
// Nettoie les records PENDING orphelins de plus de 24h.
const STALE_DELIVERY_CLEANUP_MS = 60 * 60 * 1000

let staleDeliveryTimer: ReturnType<typeof setInterval> | null = null

async function cleanupStaleDeliveries() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    const result = await prisma.notificationDelivery.updateMany({
      where: { status: "PENDING", createdAt: { lt: cutoff } },
      data: { status: "FAILED", errorMessage: "Stale: no delivery after 24h" },
    })
    if (result.count > 0) {
      log.info({ count: result.count }, "Stale PENDING deliveries marked as FAILED")
    }
  } catch (err) {
    log.error({ err, errorCode: "DATABASE_ERROR" }, "Failed to cleanup stale deliveries")
  }
}

staleDeliveryTimer = setInterval(cleanupStaleDeliveries, STALE_DELIVERY_CLEANUP_MS)
log.info({ intervalMs: STALE_DELIVERY_CLEANUP_MS }, "Stale delivery cleanup cron started")

// ── DLQ Auto-Retry Cron (every 5 minutes) ──
const DLQ_RETRY_INTERVAL_MS = 5 * 60 * 1000

let dlqTimer: ReturnType<typeof setInterval> | null = null

async function processDlqRetry() {
  const entries = await listPendingForRetry()
  if (entries.length === 0) return

  log.info({ count: entries.length }, "DLQ auto-retry cycle started")

  for (const entry of entries) {
    try {
      let body: any
      try {
        body = entry.rawBody ? JSON.parse(entry.rawBody) : entry.payload
      } catch {
        body = entry.payload
      }

      const result = await replayEmailEvent({
        event: body,
        externalId: entry.externalId ?? "",
        svixId: entry.svixId ?? `dlq-cron-${entry.id}`,
      })

      if (result.ok) {
        await prisma.webhookDlq.update({
          where: { id: entry.id },
          data: { status: "REPLAYED", replayedAt: new Date(), lastAttemptAt: new Date() },
        })
        log.info({ id: entry.id, eventType: entry.eventType }, "DLQ auto-retry succeeded")
      }
    } catch (err: any) {
      await incrementAttempts(entry.id, err?.message ?? "Auto-retry failed")

      if (entry.attempts + 1 >= 3) {
        await escalateDlq([entry.id])
        log.warn({ id: entry.id, eventType: entry.eventType, attempts: entry.attempts + 1 }, "DLQ entry escalated after exhausting retries")
      } else {
        log.warn({ id: entry.id, eventType: entry.eventType, attempt: entry.attempts + 1 }, "DLQ auto-retry failed, will retry later")
      }
    }
  }
}

dlqTimer = setInterval(processDlqRetry, DLQ_RETRY_INTERVAL_MS)
log.info({ intervalMs: DLQ_RETRY_INTERVAL_MS }, "DLQ auto-retry cron started")

// ── Graceful shutdown ──
const workers = [worker, notificationWorker, pushWorker, signalWorker, recoveryWorker]
const queues = [cleanupQueue, notificationDeliveryQueue, pushDeliveryQueue, signalDistributionQueue, deadLetterQueue, recoveryQueue]
let shuttingDown = false

async function gracefulShutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  log.info({ signal }, "Graceful shutdown initiated")

  // Force exit after 30s
  const forceTimer = setTimeout(() => {
    log.error("Shutdown timed out, forcing exit")
    process.exit(1)
  }, 30_000)

  try {
    // Stop cron timers
    if (staleDeliveryTimer) clearInterval(staleDeliveryTimer)
    if (dlqTimer) clearInterval(dlqTimer)
    log.info("Cron timers stopped")

    // Close all workers (stop accepting new jobs, wait for running jobs)
    await Promise.all(workers.map((w) => w.close()))
    log.info("All workers closed")

    // Close all queues
    await Promise.all(queues.map((q) => q.close()))
    log.info("All queues closed")

    // Disconnect Redis
    await connection.quit()
    log.info("Redis connection closed")

    // Close Prisma
    await prisma.$disconnect()
    log.info("Prisma connection closed")

    clearTimeout(forceTimer)
    process.exit(0)
  } catch (err) {
    log.error({ err }, "Error during graceful shutdown")
    clearTimeout(forceTimer)
    process.exit(1)
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

