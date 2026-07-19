import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "../src/lib/db"
import { getStorage } from "../src/lib/storage"
import { sendEmail } from "../src/lib/email"
import { distributeSignal } from "../src/lib/services/signal-distribution"

// Stable connection initialization with timeouts and circuit breaker
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  connectTimeout: 5000,
  commandTimeout: 5000,
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error(`[worker] Redis unavailable after ${times} retries`)
      return null
    }
    return Math.min(times * 200, 2000)
  },
} as any)

connection.on("error", (err: Error) => {
  console.error("[worker] Redis connection error:", err.message)
})

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
  { connection: connection as any }
)

worker.on("completed", (job: any) => {
  console.log(`[cleanup] ${job.id} completed`)
})

worker.on("failed", (job: any, err: any) => {
  console.error(`[cleanup] ${job?.id} failed:`, err.message)
})

console.log("🧹 File cleanup worker started")

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
      console.error(`[notif] Failed to send email to ${to}:`, err)
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "FAILED", errorMessage: err.message || "Email error" },
      })
      throw err
    }
  },
  { connection: connection as any, concurrency: 10 } // Process up to 10 emails in parallel
)

notificationWorker.on("completed", (job: any) => {
  console.log(`[notif] ${job.id} completed`)
})

notificationWorker.on("failed", (job: any, err: any) => {
  console.error(`[notif] ${job?.id} failed:`, err.message)
})

console.log("📧 Notification delivery worker started")

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
  { connection: connection as any }
)

signalWorker.on("completed", (job: any) => {
  console.log(`[signal] ${job.id} completed`)
})

signalWorker.on("failed", (job: any, err: any) => {
  console.error(`[signal] ${job?.id} failed:`, err.message)
})

console.log("📈 Signal distribution worker started")

