import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"

const CACHE_PREFIXES = [
  "ops",
  "members:",
  "kyc:",
  "broker:",
  "access:",
  "conv:",
  "notif:",
  "signals:",
  "plans:",
  "roles:",
  "audit:",
  "dashboard:",
]

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    let purged = 0
    for (const prefix of CACHE_PREFIXES) {
      await invalidatePrefix(prefix)
      purged++
    }
    await logAuditEvent({
      userId: session.user.id,
      action: "admin.cache.purge",
      resourceType: "system",
      details: { prefixes: CACHE_PREFIXES },
    })
    return NextResponse.json({ success: true, purged })
  } catch (error) {
    return handleAuthError(error)
  }
}
