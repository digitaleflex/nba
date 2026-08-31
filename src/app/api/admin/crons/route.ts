import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { CRON_DEFINITIONS } from "@nba/lib/cron-definitions"

interface CronJobInfo {
  name: string
  schedule: string
  command: string
  logFile: string | null
  lastRun: string | null
  lastStatus: "success" | "failed" | "unknown"
  lastMessage: string | null
  enabled: boolean
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const jobs: CronJobInfo[] = CRON_DEFINITIONS.map((def) => ({
      name: def.name,
      schedule: def.schedule,
      command: def.command,
      logFile: def.logFile ?? null,
      lastRun: null,
      lastStatus: "unknown" as const,
      lastMessage: null,
      enabled: def.enabled,
    }))

    return NextResponse.json({ jobs })
  } catch (error) {
    return handleAuthError(error)
  }
}
