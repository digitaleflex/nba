import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "../src/lib/db"
import { getStorage } from "../src/lib/storage"

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
})

export const cleanupQueue = new Queue("file-cleanup", { connection })

const worker = new Worker(
  "file-cleanup",
  async (job) => {
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
  { connection }
)

worker.on("completed", (job) => {
  console.log(`[cleanup] ${job.id} completed`)
})

worker.on("failed", (job, err) => {
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
