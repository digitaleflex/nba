import IORedis from "ioredis"

const redisUrl = process.env.REDIS_URL?.trim()
const pubsubEnabled = Boolean(redisUrl)

const globalForPubSub = globalThis as unknown as { redisPub?: IORedis }

let pubAvailable = true
let pubUnavailableUntil = 0

function getConnection(): IORedis | null {
  if (!pubsubEnabled || !redisUrl) return null
  if (!pubAvailable) {
    if (Date.now() < pubUnavailableUntil) return null
    pubAvailable = true
  }
  if (!globalForPubSub.redisPub) {
    globalForPubSub.redisPub = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 1500,
      lazyConnect: true,
    })
  }
  return globalForPubSub.redisPub
}

function markUnavailable() {
  pubAvailable = false
  pubUnavailableUntil = Date.now() + 30000
}

export const CHANNEL_PREFIX = "nba:notif:"
const MESSAGE_PREFIX = "nba:msg:"
const READ_PREFIX = "nba:read:"

export function userChannel(userId: string): string {
  return `${CHANNEL_PREFIX}user:${userId}`
}

export function messageChannel(userId: string): string {
  return `${MESSAGE_PREFIX}user:${userId}`
}

export function readChannel(userId: string): string {
  return `${READ_PREFIX}user:${userId}`
}

async function publish(channel: string, payload: unknown): Promise<void> {
  const conn = getConnection()
  if (!conn) return
  try {
    await conn.publish(channel, JSON.stringify(payload))
  } catch (err) {
    console.error("[pubsub] publish failed:", err)
    markUnavailable()
  }
}

export async function publishNotification(userId: string, payload: unknown): Promise<void> {
  await publish(userChannel(userId), payload)
}

export async function publishMessage(userId: string, payload: unknown): Promise<void> {
  await publish(messageChannel(userId), payload)
}

export async function publishMessageRead(userId: string, payload: unknown): Promise<void> {
  await publish(readChannel(userId), payload)
}

export async function publishSignalEvent(channel: string, payload: unknown): Promise<void> {
  await publish(channel, payload)
}

export { pubsubEnabled, redisUrl, getConnection }
