import { NextRequest, NextResponse } from "next/server"
import { Queue } from "bullmq"
import IORedis from "ioredis"
import { logger } from "@nba/lib/logger"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"
import { validateOrThrow, queueRetrySchema } from "@nba/lib/validations"

const log = logger.child({ module: "admin-queues" })

const QUEUE_NAMES = ["file-cleanup", "signal-distribution", "notification-delivery"]

async function withQueue<T>(name: string, fn: (q: Queue) => Promise<T>): Promise<T> {
  const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  const queue = new Queue(name, { connection: connection as any })
  try {
    return await fn(queue)
  } finally {
    await queue.close().catch((err) => {
      log.warn({ err, queueName: name }, "Failed to close queue connection")
    })
    connection.disconnect()
  }
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const data = await Promise.all(
      QUEUE_NAMES.map(async (name) => {
        try {
          const q = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
          const queue = new Queue(name, { connection: q as any })
          const counts = await queue.getJobCounts(
            "waiting",
            "active",
            "completed",
            "failed",
            "delayed",
            "paused",
          )
          await queue.close().catch((err) => {
            log.warn({ err, queueName: name }, "Failed to close queue connection in GET")
          })
          q.disconnect()
          return { name, ...counts }
        } catch (e) {
          return { name, error: "Erreur de connexion à la file d'attente" }
        }
      }),
    )
    return NextResponse.json({ queues: data })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { name } = validateOrThrow(queueRetrySchema, await request.json().catch(() => ({ name: null })))
    const targets = name ? [name] : QUEUE_NAMES

    let retried = 0
    for (const n of targets) {
      if (!QUEUE_NAMES.includes(n)) continue
      await withQueue(n, (q) => q.retryJobs())
      retried++
    }

    await logAuditEvent({
      userId: session.user.id,
      action: "admin.queues.retry",
      resourceType: "system",
      details: { targets, retried },
    })
    return NextResponse.json({ success: true, retried })
  } catch (error) {
    return handleAuthError(error)
  }
}
