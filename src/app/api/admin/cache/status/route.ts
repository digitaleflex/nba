import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getStats } from "@nba/lib/cache"
import { prisma } from "@nba/lib/db"

const QUEUE_NAMES = ["file-cleanup", "signal-distribution", "notification-delivery"]
const REDIS_URL = process.env.REDIS_URL?.trim()

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const cacheStats = getStats()

    let redisInfo: Record<string, any> = { status: "unreachable" }
    let queues: { name: string; failed: number; waiting: number; active: number; delayed: number }[] = []
    let wsStatus = "unknown"

    if (REDIS_URL) {
      try {
        const { default: IORedis } = await import("ioredis")
        const redis = new IORedis(REDIS_URL, {
          connectTimeout: 3000,
          maxRetriesPerRequest: 0,
          lazyConnect: true,
        })
        await redis.connect()

        const pong = await redis.ping()
        if (pong === "PONG") {
          redisInfo.status = "healthy"
          try {
            const infoRaw = await redis.info("ALL")
            const lines = infoRaw.split("\r\n")
            const info: Record<string, any> = {}
            for (const line of lines) {
              if (line && !line.startsWith("#")) {
                const idx = line.indexOf(":")
                if (idx > 0) info[line.slice(0, idx)] = line.slice(idx + 1)
              }
            }
            redisInfo = {
              status: "healthy",
              version: info.redis_version || "?",
              uptime: parseInt(info.uptime_in_seconds || "0"),
              usedMemory: info.used_memory_human || "?",
              usedMemoryPeak: info.used_memory_peak_human || "?",
              connectedClients: parseInt(info.connected_clients || "0"),
              totalConnectionsReceived: parseInt(info.total_connections_received || "0"),
              keyspaceHits: parseInt(info.keyspace_hits || "0"),
              keyspaceMisses: parseInt(info.keyspace_misses || "0"),
              hitRatio: (() => {
                const hits = parseInt(info.keyspace_hits || "0")
                const misses = parseInt(info.keyspace_misses || "0")
                const total = hits + misses
                return total > 0 ? `${((hits / total) * 100).toFixed(1)}%` : "N/A"
              })(),
              totalKeys: (() => {
                const db0 = info["db0"] as string | undefined
                if (!db0) return 0
                return parseInt(db0.split(",")[0]?.split("=")[1] || "0")
              })(),
              maxMemory: info.maxmemory_human || "?",
              os: info.os || "?",
              processId: parseInt(info.process_id || "0"),
            }
          } catch {}
        }

        // Queue stats via BullMQ
        try {
          const { Queue } = await import("bullmq")
          for (const name of QUEUE_NAMES) {
            const q = new Queue(name, {
              connection: redis as any,
              skipVersionCheck: true,
            })
            const counts = await q.getJobCounts("failed", "waiting", "active", "delayed")
            queues.push({
              name,
              failed: counts.failed || 0,
              waiting: counts.waiting || 0,
              active: counts.active || 0,
              delayed: counts.delayed || 0,
            })
            await q.close()
          }
        } catch {}

        // WebSocket health check
        try {
          const wsRes = await fetch("http://127.0.0.1:3001/health", {
            signal: AbortSignal.timeout(3000),
          })
          if (wsRes.ok) {
            const wsData = await wsRes.json()
            wsStatus = `healthy (${wsData.connections} connexions)`
          } else {
            wsStatus = "error"
          }
        } catch {
          wsStatus = "unreachable"
        }

        await redis.quit()
      } catch {
        redisInfo = { status: "unreachable" }
      }
    }

    // Users avec problèmes (échecs de livraison récents)
    const failedDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: { in: ["FAILED", "BOUNCED"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        status: true,
        channel: true,
        createdAt: true,
        errorMessage: true,
        notification: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    // Compter les users distincts touchés
    const affectedUserIds = new Set<string>()
    for (const d of failedDeliveries) {
      if (d.notification?.title) affectedUserIds.add(d.notification.title)
    }

    // Audit récent pour les erreurs système
    const recentErrors = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      cache: cacheStats,
      redis: redisInfo,
      queues,
      websocket: wsStatus,
      issues: {
        totalFailedDeliveries: failedDeliveries.length,
        recentFailedDeliveries: failedDeliveries.slice(0, 20),
        affectedUserCount: affectedUserIds.size,
        recentAuditErrors: recentErrors,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
