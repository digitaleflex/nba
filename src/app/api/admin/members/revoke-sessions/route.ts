import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 })
    }

    const result = await prisma.session.deleteMany({ where: { userId } })
    await invalidatePrefix("ops")
    await logAuditEvent({
      userId: session.user.id,
      action: "admin.member.revoke_sessions",
      resourceType: "user",
      resourceId: userId,
      details: { count: result.count },
    })
    return NextResponse.json({ success: true, revoked: result.count })
  } catch (error) {
    return handleAuthError(error)
  }
}
