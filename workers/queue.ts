import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "../src/lib/db"
import { getStorage } from "../src/lib/storage"
import { sendEmail, tradingSignalEmail } from "../src/lib/email"
import { logAuditEvent } from "../src/lib/services/audit"

// Stable connection initialization with proper typing (casting options to avoid TS issues)
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
} as any)

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
      await sendEmail(to, { subject, html })
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "SENT", sentAt: new Date() },
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
    const { signalId } = job.data

    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: {
        audience: {
          include: {
            plan: true,
          },
        },
      },
    })

    if (!signal) return

    // Automatically publish the signal if it is a scheduled draft whose time has arrived
    if (signal.status === "DRAFT" && signal.scheduledAt && new Date(signal.scheduledAt).getTime() <= Date.now() + 5000) {
      await prisma.signal.update({
        where: { id: signalId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          jobId: null,
        },
      })
      signal.status = "PUBLISHED"
      signal.publishedAt = new Date()
    }

    if (signal.status !== "PUBLISHED") return

    const planIds = signal.audience.map((a: any) => a.planId)
    if (planIds.length === 0) return

    // Find active members with approved access requests for these plans
    const members = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        accessRequests: {
          some: {
            planId: { in: planIds },
            status: "APPROVED",
          },
        },
      },
    })

    console.log(`[signal] Distributing signal ${signalId} to ${members.length} member(s)`)

    // Parallelized batch creation of notifications and queueing of email delivery jobs
    const BATCH_SIZE = 50
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (member) => {
          // 1. Create In-App Notification
          const notification = await prisma.notification.create({
            data: {
              userId: member.id,
              type: "SIGNAL",
              title: "Nouveau signal de trading",
              body: `Un nouveau signal a été publié pour vos groupes.`,
              data: { signalId: signal.id },
            },
          })

          // 2. Create Email Delivery
          const delivery = await prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              channel: "EMAIL",
              status: "PENDING",
            },
          })

          // 3. Enqueue Email to BullMQ
          const template = tradingSignalEmail(member, signal.content, signal.imageUrl)
          await notificationDeliveryQueue.add(
            `delivery-${delivery.id}`,
            {
              deliveryId: delivery.id,
              to: member.email,
              subject: template.subject,
              html: template.html,
            },
            {
              attempts: 3,
              backoff: { type: "exponential", delay: 5000 },
            }
          )
        })
      )
    }

    // 4. Log Audit Event
    await logAuditEvent({
      userId: signal.createdBy,
      action: "signal.publish",
      resourceType: "signal",
      resourceId: signal.id,
      details: {
        recipientCount: members.length,
        plans: signal.audience.map((a: any) => a.plan.name),
      },
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

