import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

const MODELS = ["User", "Session", "Account", "Signal", "Trade", "Device", "SecurityEvent", "LoginAttempt", "Notification", "AuditLog", "KycDocument", "BrokerVerification"]

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const counts: Record<string, number> = {}
    for (const model of MODELS) {
      try {
        const count = await (prisma as any)[model[0].toLowerCase() + model.slice(1)].count()
        counts[model] = count
      } catch { counts[model] = -1 }
    }
    return NextResponse.json({ models: counts, total: Object.values(counts).reduce((a, b) => a + Math.max(0, b), 0) })
  } catch (error) {
    return handleAuthError(error)
  }
}
