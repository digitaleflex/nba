import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "../src/lib/db"
import { getStorage } from "../src/lib/storage"
import { sendEmail, tradingSignalEmail } from "../src/lib/email"
import { logAuditEvent } from "../src/lib/services/audit"

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
})

export const cleanupQueue = new Queue("file-cleanup", { connection: connection as any })

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

// ── Signal Distribution Queue & Worker ──

export const signalDistributionQueue = new Queue("signal-distribution", { connection: connection as any })

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

    if (!signal || signal.status !== "PUBLISHED") {
      return
    }

    const planIds = signal.audience.map((a) => a.planId)
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

    for (const member of members) {
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

      // 3. Send Email
      try {
        const template = tradingSignalEmail(member, signal.content, signal.imageUrl)
        await sendEmail(member.email, template)
        
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "SENT", sentAt: new Date() },
        })
      } catch (err: any) {
        console.error(`[signal] Failed to send email to ${member.email}:`, err)
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "FAILED", errorMessage: err.message || "Email error" },
        })
      }
    }

    // 4. Log Audit Event
    await logAuditEvent({
      userId: signal.createdBy,
      action: "signal.publish",
      resourceType: "signal",
      resourceId: signal.id,
      details: {
        recipientCount: members.length,
        plans: signal.audience.map((a) => a.plan.name),
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

