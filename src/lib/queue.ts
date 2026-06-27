import { Queue } from "bullmq"
import IORedis from "ioredis"

const connectionString = process.env.REDIS_URL ?? "redis://localhost:6379"

function getRedisConnection() {
  const globalForRedis = globalThis as unknown as {
    redisConnection: IORedis | undefined
  }
  if (!globalForRedis.redisConnection) {
    globalForRedis.redisConnection = new IORedis(connectionString, {
      maxRetriesPerRequest: null,
    })
  }
  return globalForRedis.redisConnection
}

function getQueue(name: string) {
  const globalForQueues = globalThis as unknown as {
    queues: Record<string, Queue> | undefined
  }
  if (!globalForQueues.queues) {
    globalForQueues.queues = {}
  }
  if (!globalForQueues.queues[name]) {
    const connection = getRedisConnection()
    globalForQueues.queues[name] = new Queue(name, { connection: connection as any })
  }
  return globalForQueues.queues[name]
}

export const fileCleanupQueue = getQueue("file-cleanup")
export const signalDistributionQueue = getQueue("signal-distribution")
export { getRedisConnection }
