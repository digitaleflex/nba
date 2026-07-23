import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"
import { hardDeleteUser } from "@nba/lib/services/user-deletion"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"
import { z } from "zod"

const batchDeleteSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(50, "Maximum 50 utilisateurs à la fois"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rl = await rateLimitOrDeny("ADMIN_MEMBER_MUTATION", session.user.id)
    if (rl) return rl

    const { userIds } = batchDeleteSchema.parse(await request.json())

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: false },
      select: { id: true, name: true, email: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ error: "Aucun utilisateur inactif trouvé avec ces IDs" }, { status: 400 })
    }

    for (const user of users) {
      await hardDeleteUser(prisma, user.id)
    }

    await logAuditEvent({
      userId: session.user.id,
      action: "BATCH_DELETE",
      resourceType: "user",
      resourceId: users.map((u) => u.id).join(","),
      details: { count: users.length, deleted: users.map((u) => ({ id: u.id, email: u.email })) },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("members:")
    return NextResponse.json({ count: users.length })
  } catch (error) {
    return handleAuthError(error)
  }
}
