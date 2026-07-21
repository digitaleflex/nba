import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { auditHealth } from "@nba/lib/services/audit"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const stats = await auditHealth()
    return NextResponse.json(stats)
  } catch (error) {
    return handleAuthError(error)
  }
}
