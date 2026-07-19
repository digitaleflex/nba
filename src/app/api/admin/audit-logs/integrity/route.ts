import { NextRequest, NextResponse } from "next/server"
import { handleAuthError, requireRole } from "@nba/lib/auth-utils"
import { verifyChain } from "@nba/lib/audit/integrity"

export async function GET(_request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const report = await verifyChain({ limit: 5000 })

    return NextResponse.json(report)
  } catch (error) {
    return handleAuthError(error)
  }
}
