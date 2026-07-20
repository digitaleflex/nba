import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getAllCircuitStates } from "@nba/lib/circuit-breaker"

export async function GET() {
  const checks: Record<string, string> = {}

  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = "healthy"
  } catch {
    checks.database = "unhealthy"
  }

  // WebSocket check
  if (process.env.WS_ENABLED === "true") {
    try {
      const ws = await fetch(
        "http://127.0.0.1:3001/socket.io/?EIO=4&transport=polling",
        { signal: AbortSignal.timeout(3000) }
      )
      const body = await ws.text()
      checks.websocket = body.includes('"sid"') ? "healthy" : "unhealthy"
    } catch {
      checks.websocket = "unhealthy"
    }
  }

  // Circuit breakers (informational)
  const circuitStates = getAllCircuitStates()
  const circuitOpen = Object.values(circuitStates).some((c) => c.state === "open")
  checks.circuitBreakers = circuitOpen ? "degraded" : "healthy"

  const allHealthy = Object.values(checks).every((s) => s === "healthy")
  const hasDegraded = Object.values(checks).some((s) => s === "degraded")

  const status = allHealthy ? "healthy" : hasDegraded ? "degraded" : "unhealthy"

  return NextResponse.json(
    {
      status,
      checks,
      circuitBreakers: circuitStates,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  )
}
