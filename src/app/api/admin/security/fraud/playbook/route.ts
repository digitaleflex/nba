import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { incidentResponder, PLAYBOOKS } from "@nba/lib/security/incident-responder"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const rl = rateLimitMiddleware({ window: 60, max: 20 })

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:playbook")
    if (rlRes) return rlRes
    return NextResponse.json({ playbooks: PLAYBOOKS.map(p => ({ id: p.id, name: p.name, severity: p.severity, detectType: p.detectType, steps: p.steps.length })) })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:playbook-exec")
    if (rlRes) return rlRes
    const { userId, detectType, ipAddress, sessionId } = await req.json()
    if (!userId || !detectType) return NextResponse.json({ error: "userId et detectType requis" }, { status: 400 })
    await incidentResponder.execute(userId, detectType, { ipAddress, sessionId })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
