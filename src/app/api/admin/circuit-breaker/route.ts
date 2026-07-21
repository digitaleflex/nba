import { NextRequest, NextResponse } from "next/server"
import { getAllCircuitStates, createCircuitBreaker } from "@nba/lib/circuit-breaker"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const states = getAllCircuitStates()
    const degraded = Object.values(states).some((s) => s.state === "open")
    return NextResponse.json({ circuits: states, degraded })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Nom du circuit requis" }, { status: 400 })
    }

    const state = getAllCircuitStates()[name]
    if (!state) {
      return NextResponse.json({ error: `Circuit "${name}" introuvable` }, { status: 404 })
    }

    const breaker = createCircuitBreaker(name)
    breaker.reset()

    await logAuditEvent({
      userId: session.user.id,
      action: "admin.circuit_breaker.reset",
      resourceType: "system",
      details: { circuitName: name },
    })

    return NextResponse.json({ success: true, circuit: name, state: getAllCircuitStates()[name] })
  } catch (error) {
    return handleAuthError(error)
  }
}
