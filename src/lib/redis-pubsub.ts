import IORedis from "ioredis"

const redisUrl = process.env.REDIS_URL?.trim()
const pubsubEnabled = Boolean(redisUrl)

function getConnection(): IORedis | null {
  if (!pubsubEnabled || !redisUrl) return null
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
}

const CHANNEL_PREFIX = "nba:notif:"

export function userChannel(userId: string): string {
  return `${CHANNEL_PREFIX}user:${userId}`
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

export { pubsubEnabled, redisUrl, getConnection }
