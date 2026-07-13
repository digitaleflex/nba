import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { listMessageReports } from "@nba/lib/services/messaging"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const reports = await listMessageReports(true)
    return NextResponse.json({ reports })
  } catch (error) {
    return handleAuthError(error)
  }
}
