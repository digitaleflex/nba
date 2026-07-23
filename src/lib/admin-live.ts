import { getRedisConnection } from "./queue"

const ADMIN_CHANNELS = {
  HEALTH: "nba:admin:health",
  OPS: "nba:admin:ops",
  ALERTS: "nba:admin:alerts",
  BADGES: "nba:admin:badges",
  QUEUE: "nba:admin:queue",
  FRAUD: "nba:admin:fraud",
} as const

export type AdminChannel = (typeof ADMIN_CHANNELS)[keyof typeof ADMIN_CHANNELS]

export async function publishAdminEvent(channel: AdminChannel, data: Record<string, unknown>): Promise<void> {
  try {
    const redis = getRedisConnection()
    if (!redis) return
    await redis.publish(channel, JSON.stringify(data))
  } catch (err) {
    console.error(`[admin-live] Failed to publish to ${channel}:`, err)
  }
}

export { ADMIN_CHANNELS }
