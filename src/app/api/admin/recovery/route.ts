import { NextRequest, NextResponse } from "next/server"
import { Queue } from "bullmq"
import IORedis from "ioredis"
import { logger } from "@nba/lib/logger"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"

const log = logger.child({ module: "admin-recovery" })

const QUEUE_NAMES = ["recovery", "dead-letter"]

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const data = await Promise.all(
      QUEUE_NAMES.map(async (name) => {
        try {
          const conn = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
          const queue = new Queue(name, { connection: conn as any })
          const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed")
          await queue.close()
          conn.disconnect()
          return { name, ...counts }
        } catch {
          return { name, error: "Erreur de connexion" }
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

    const body = await request.json().catch(() => ({}))
    const target = body.queue ?? "recovery"

    if (!QUEUE_NAMES.includes(target)) {
      return NextResponse.json({ error: "Queue invalide" }, { status: 400 })
    }

    const conn = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
    const queue = new Queue(target, { connection: conn as any })
    const retried = await queue.retryJobs()
    await queue.close()
    conn.disconnect()

    await logAuditEvent({
      userId: session.user.id,
      action: "admin.queues.retry",
      resourceType: "system",
      details: { target, retried },
    })
    return NextResponse.json({ success: true, retried })
  } catch (error) {
    return handleAuthError(error)
  }
}
