import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { readFile } from "fs/promises"
import { execSync } from "child_process"
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

function getScriptName(command: string): string {
  const match = command.match(/scripts\/([\w-]+)\.(ts|sh|py)/)
  return match ? match[1] : command.slice(0, 60)
}

async function readLastLogLine(filePath: string): Promise<{ lastRun: string | null; lastStatus: "success" | "failed" | "unknown"; lastMessage: string | null }> {
  try {
    const content = await readFile(filePath, "utf-8")
    const lines = content.trim().split("\n").filter(Boolean)
    if (lines.length === 0) return { lastRun: null, lastStatus: "unknown", lastMessage: null }

    const lastLine = lines[lines.length - 1]
    const timeMatch = lastLine.match(/^\[([^\]]+)\]/)
    const lastRun = timeMatch ? timeMatch[1] : null

    const isError = lastLine.toLowerCase().includes("erreur") || lastLine.toLowerCase().includes("error") || lastLine.toLowerCase().includes("failed")
    const isSuccess = lastLine.toLowerCase().includes("termin") || lastLine.toLowerCase().includes("complete") || lastLine.toLowerCase().includes("envoy") || lastLine.toLowerCase().includes("ok")

    const lastStatus = isError ? "failed" : isSuccess ? "success" : "unknown"
    return { lastRun, lastStatus, lastMessage: lastLine.slice(0, 200) }
  } catch {
    return { lastRun: null, lastStatus: "unknown", lastMessage: null }
  }
}

/**
 * Tente de lire la crontab système (VPS Linux). Renvoie null si indisponible
 * (Windows, CI, conteneur sans crontab) — on se rabat alors sur la config statique.
 */
function readSystemCrontab(): { schedule: string; command: string; logFile: string | null }[] | null {
  try {
    const crontabOutput = execSync("crontab -l 2>/dev/null", { encoding: "utf-8", timeout: 5000 })
    const jobs: { schedule: string; command: string; logFile: string | null }[] = []
    const lines = crontabOutput.split("\n")

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue

      const cronMatch = trimmed.match(/^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/)
      if (!cronMatch) continue

      const schedule = cronMatch[1]
      const command = cronMatch[2]
      const logMatch = command.match(/>>\s*(\/\S+)\s*2>&1/)
      const logFile = logMatch ? logMatch[1] : null

      jobs.push({ schedule, command, logFile })
    }
    return jobs.length > 0 ? jobs : null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    // Source unique de vérité : config statique (toujours disponible, même sur Windows/dev).
    const systemCrons = readSystemCrontab()
    const jobs: CronJobInfo[] = []

    for (const def of CRON_DEFINITIONS) {
      let schedule = def.schedule
      let logFile: string | null = def.logFile
      let lastRun: string | null = null
      let lastStatus: "success" | "failed" | "unknown" = "unknown"
      let lastMessage: string | null = null

      // Enrichissement depuis la crontab système si présente.
      if (systemCrons) {
        const sys = systemCrons.find((s) => getScriptName(s.command) === def.name)
        if (sys) {
          schedule = sys.schedule
          logFile = sys.logFile ?? def.logFile
        }
      }

      // Enrichissement depuis le fichier de log si lisible.
      if (logFile) {
        const logInfo = await readLastLogLine(logFile)
        lastRun = logInfo.lastRun
        lastStatus = logInfo.lastStatus
        lastMessage = logInfo.lastMessage
      }

      jobs.push({
        name: def.name,
        schedule,
        command: def.command,
        logFile,
        lastRun,
        lastStatus,
        lastMessage,
        enabled: def.enabled,
      })
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    return handleAuthError(error)
  }
}
