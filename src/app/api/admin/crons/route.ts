import { NextResponse } from "next/server"
import { requireRole } from "@nba/lib/auth-utils"
import { readFile } from "fs/promises"
import { execSync } from "child_process"

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

function parseCronSchedule(cronExpr: string): string {
  const parts = cronExpr.trim().split(/\s+/)
  if (parts.length < 5) return cronExpr

  const [min, hour, dom, month, dow] = parts

  const days: Record<string, string> = { "0": "dim", "1": "lun", "2": "mar", "3": "mer", "4": "jeu", "5": "ven", "6": "sam", "7": "dim" }
  const months: Record<string, string> = { "1": "janv", "2": "fév", "3": "mars", "4": "avr", "5": "mai", "6": "juin", "7": "juil", "8": "août", "9": "sept", "10": "oct", "11": "nov", "12": "déc" }

  const freq = min === "0" && hour === "*" && dom === "*" && month === "*" && dow === "*" ? "Toutes les heures"
    : min === "0" && hour !== "*" && hour.includes("/") && dom === "*" && month === "*" && dow === "*" ? `Toutes les ${hour.replace("*/", "")}h`
    : min === "0" && hour !== "*" && !hour.includes("/") && dom === "*" && month === "*" && dow === "*" ? `Tous les jours à ${hour}h`
    : min === "0" && hour !== "*" && dom === "*" && month === "*" && dow !== "*" && !dow.includes("/") ? `${days[dow] || `jour ${dow}`} à ${hour}h`
    : `${cronExpr}`

  return freq
}

function getScriptName(command: string): string {
  const match = command.match(/scripts\/([\w-]+)\.ts/)
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

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const crontabOutput = execSync("crontab -l 2>/dev/null", { encoding: "utf-8", timeout: 5000 })

    const jobs: CronJobInfo[] = []
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

      let lastRun: string | null = null
      let lastStatus: "success" | "failed" | "unknown" = "unknown"
      let lastMessage: string | null = null

      if (logFile) {
        const logInfo = await readLastLogLine(logFile)
        lastRun = logInfo.lastRun
        lastStatus = logInfo.lastStatus
        lastMessage = logInfo.lastMessage
      }

      jobs.push({
        name: getScriptName(command),
        schedule,
        command: command.slice(0, 120),
        logFile,
        lastRun,
        lastStatus,
        lastMessage,
        enabled: true,
      })
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    console.error("[crons] Erreur:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des crons" }, { status: 500 })
  }
}
