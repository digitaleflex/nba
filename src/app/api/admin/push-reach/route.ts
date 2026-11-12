import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getPushReach, listMembersWithoutPush } from "@nba/lib/services/push-reach"

// GET /api/admin/push-reach — taux de membres joignables en push + membres sans alerte
export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const [reach, withoutPush] = await Promise.all([getPushReach(), listMembersWithoutPush(50)])
    return NextResponse.json({ ...reach, withoutPush })
  } catch (error) {
    return handleAuthError(error)
  }
}
