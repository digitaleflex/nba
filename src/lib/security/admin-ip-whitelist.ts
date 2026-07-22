import { NextResponse } from "next/server"
import { getConnection as getRedis } from "../redis-pubsub"
import { logger } from "../logger"

const log = logger.child({ module: "admin-ip-whitelist" })

const DEFAULT_ALLOWED_IPS: string[] = []

export async function checkAdminIp(ip: string | null): Promise<boolean> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return true

  const allowedEnv = process.env.ADMIN_ALLOWED_IPS
  if (!allowedEnv) return true

  const allowed = allowedEnv.split(",").map(s => s.trim()).filter(Boolean)
  if (allowed.length === 0) return true

  if (allowed.includes(ip)) return true

  const redis = getRedis()
  if (redis) {
    const bypassKey = `admin:ip-bypass:${ip}`
    const bypassed = await redis.get(bypassKey)
    if (bypassed === "1") return true
  }

  log.warn({ ip }, "Admin IP non authorisee")
  return false
}

export function adminIpGuard(ip: string | null): Response | null {
  if (!ip) return null
  const allowedEnv = process.env.ADMIN_ALLOWED_IPS
  if (!allowedEnv) return null
  const allowed = allowedEnv.split(",").map(s => s.trim()).filter(Boolean)
  if (allowed.length === 0) return null
  if (allowed.includes(ip)) return null
  return NextResponse.json({ error: "Acces non authorise depuis cette IP" }, { status: 403 })
}
