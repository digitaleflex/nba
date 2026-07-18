import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getStats } from "@nba/lib/cache"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    return NextResponse.json(getStats())
  } catch (error) {
    return handleAuthError(error)
  }
}
