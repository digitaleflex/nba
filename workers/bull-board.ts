import "dotenv/config"
import express, { Request, Response, NextFunction } from "express"
import IORedis from "ioredis"
import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { ExpressAdapter } from "@bull-board/express"
import { Queue } from "bullmq"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const PORT = parseInt(process.env.BULL_BOARD_PORT || "3002", 10)
const REDIS_URL = process.env.REDIS_URL
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET

if (!REDIS_URL || !BETTER_AUTH_SECRET) {
  console.error("[bull-board] REDIS_URL and BETTER_AUTH_SECRET required")
  process.exit(1)
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath("/admin/queues")

function extractSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/)
  return match?.[1] ?? null
}

const app = express()

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" })
})

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/health") return next()
  const sessionToken = extractSessionToken(req.headers.cookie)
  if (!sessionToken) {
    res.status(401).json({ error: "No session" })
    return
  }
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: { select: { role: { select: { name: true } } } } },
    })
    if (!session || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({ error: "Invalid or expired session" })
      return
    }
    const role = session.user.role?.name ?? "USER"
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      res.status(403).json({ error: "Forbidden" })
      return
    }
  } catch {
    res.status(500).json({ error: "Auth check failed" })
    return
  }
  next()
})

app.use("/admin/queues", serverAdapter.getRouter())

async function main() {
  const redis = new IORedis(REDIS_URL!, {
    maxRetriesPerRequest: null,
    connectTimeout: 10_000,
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error("[bull-board] Redis unavailable after max retries, starting without queues")
        return null
      }
      return Math.min(times * 200, 2000)
    },
  } as any)

  redis.on("error", (err: Error) => {
    console.error("[bull-board] Redis error:", err.message)
  })

  await redis.ping().catch(() => {
    console.warn("[bull-board] Redis not reachable, Bull Board will be empty")
  })

  try {
    createBullBoard({
      queues: [
        new BullMQAdapter(new Queue("file-cleanup", { connection: redis as any, skipVersionCheck: true })),
        new BullMQAdapter(new Queue("signal-distribution", { connection: redis as any, skipVersionCheck: true })),
        new BullMQAdapter(new Queue("notification-delivery", { connection: redis as any, skipVersionCheck: true })),
        new BullMQAdapter(new Queue("push-delivery", { connection: redis as any, skipVersionCheck: true })),
      ],
      serverAdapter,
    })
  } catch (err) {
    console.error("[bull-board] Failed to initialize Bull Board queues:", err)
  }

  app.listen(PORT, () => {
    console.log(`[bull-board] Listening on :${PORT}`)
  })

  process.on("SIGTERM", () => { redis.disconnect(); prisma.$disconnect(); process.exit(0) })
  process.on("SIGINT", () => { redis.disconnect(); prisma.$disconnect(); process.exit(0) })
}

main()
