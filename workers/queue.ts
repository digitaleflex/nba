import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "../src/lib/db"
import { getStorage } from "../src/lib/storage"
import { sendEmail } from "../src/lib/email"
import { distributeSignal } from "../src/lib/services/signal-distribution"
import { logger } from "../src/lib/logger"

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
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  }
)

worker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "file-cleanup" }, "Job completed")
})

worker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "file-cleanup", err }, "Job failed")
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("file-cleanup", job, err)
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
      log.error({ err, to }, "Failed to send email")
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "FAILED", errorMessage: err.message || "Email error" },
      })
      throw err
    }
  },
  {
    connection: connection as any,
    concurrency: 10,
    stalledInterval: 30000,
    lockDuration: 60000,
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
  }
)

notificationWorker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "notification-delivery" }, "Job completed")
})

notificationWorker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "notification-delivery", err }, "Job failed")
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("notification-delivery", job, err)
  }
})

log.info("Notification delivery worker started")

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
    })
  },
  {
    connection: connection as any,
    stalledInterval: 60000,
    lockDuration: 120000,
    attempts: 3,
    backoff: { type: "exponential", delay: 15_000 },
  }
)

signalWorker.on("completed", (job: any) => {
  log.info({ jobId: job.id, queue: "signal-distribution" }, "Job completed")
})

signalWorker.on("failed", (job: any, err: any) => {
  log.error({ jobId: job?.id, queue: "signal-distribution", err }, "Job failed")
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    sendToDeadLetter("signal-distribution", job, err)
  }
})

log.info("Signal distribution worker started")

// ── Graceful shutdown ──
const workers = [worker, notificationWorker, signalWorker]
const queues = [cleanupQueue, notificationDeliveryQueue, signalDistributionQueue, deadLetterQueue]
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

