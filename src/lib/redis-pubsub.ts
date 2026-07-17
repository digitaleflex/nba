import IORedis from "ioredis"

const redisUrl = process.env.REDIS_URL?.trim()
const pubsubEnabled = Boolean(redisUrl)

function getConnection(): IORedis | null {
  if (!pubsubEnabled || !redisUrl) return null
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
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

/**
 * Publie un événement sur le canal Redis d'un utilisateur.
 * Le serveur WebSocket subscribe à ces canaux et forward aux clients connectés.
 */
export async function publishNotification(userId: string, payload: unknown): Promise<void> {
  const conn = getConnection()
  if (!conn) return
  try {
    await conn.publish(userChannel(userId), JSON.stringify(payload))
  } catch (err) {
    console.error("[pubsub] publish failed:", err)
  } finally {
    conn.disconnect()
  }
}

/**
 * Publie un message de chat sur le canal Redis d'un utilisateur.
 * Le serveur WebSocket subscribe à ces canaux et forward aux clients connectés.
 */
export async function publishMessage(userId: string, payload: unknown): Promise<void> {
  const conn = getConnection()
  if (!conn) return
  try {
    await conn.publish(messageChannel(userId), JSON.stringify(payload))
  } catch (err) {
    console.error("[pubsub] publish message failed:", err)
  } finally {
    conn.disconnect()
  }
}

/**
 * Publie un accusé de lecture (message lu) sur le canal Redis de l'expéditeur.
 * Le serveur WebSocket forward l'event "message_read" au client concerné.
 */
export async function publishMessageRead(userId: string, payload: unknown): Promise<void> {
  const conn = getConnection()
  if (!conn) return
  try {
    await conn.publish(readChannel(userId), JSON.stringify(payload))
  } catch (err) {
    console.error("[pubsub] publish message read failed:", err)
  } finally {
    conn.disconnect()
  }
}

/**
 * Publie un événement générique sur un canal Redis (ex: nba:signal:admin,
 * nba:signal:user:<id>). Utilisé pour le feed signals temps réel et le
 * dashboard de diffusion admin.
 */
export async function publishSignalEvent(channel: string, payload: unknown): Promise<void> {
  const conn = getConnection()
  if (!conn) return
  try {
    await conn.publish(channel, JSON.stringify(payload))
  } catch (err) {
    console.error("[pubsub] publish signal event failed:", err)
  } finally {
    conn.disconnect()
  }
}

export { pubsubEnabled, redisUrl, getConnection }
