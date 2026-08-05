import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"
import { invalidatePrefix } from "@nba/lib/cache"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"
import { z } from "zod"

const revokeSchema = z.object({
  groupName: z.string().min(1),
  keepUserId: z.string().min(1),
  revokeUserIds: z.array(z.string().min(1)).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("subscriptions.manage")
    const rl = await rateLimitOrDeny("ADMIN_MEMBER_MUTATION", session.user.id)
    if (rl) return rl

    const { groupName, keepUserId, revokeUserIds } = revokeSchema.parse(await request.json())

    const keepUser = await prisma.user.findUnique({
      where: { id: keepUserId },
      select: { id: true, email: true, name: true },
    })
    if (!keepUser) {
      return NextResponse.json({ error: "Compte à conserver introuvable" }, { status: 404 })
    }

    const usersToRevoke = await prisma.user.findMany({
      where: { id: { in: revokeUserIds } },
      select: { id: true, email: true, name: true },
    })

    let revokedAccess = 0
    let suspendedAccounts = 0

    for (const user of usersToRevoke) {
      const approved = await prisma.accessRequest.findMany({
        where: { userId: user.id, status: "APPROVED" },
        select: { id: true },
      })

      if (approved.length > 0) {
        await prisma.accessRequest.updateMany({
          where: { userId: user.id, status: "APPROVED" },
          data: {
            status: "REVOKED",
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            notes: `Doublon détecté (groupe « ${groupName} ») — compte conservé : ${keepUser.email}`,
          },
        })
        revokedAccess += approved.length
      }

      await prisma.user.updateMany({
        where: { id: user.id },
        data: { isActive: false },
      })
      suspendedAccounts += 1
    }

    await logAuditEvent({
      userId: session.user.id,
      action: "duplicates.revoke",
      resourceType: "user",
      resourceId: revokeUserIds.join(","),
      details: {
        groupName,
        keepUser: { id: keepUser.id, email: keepUser.email },
        revoked: usersToRevoke.map((u) => ({ id: u.id, email: u.email })),
        revokedAccess,
      },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("members:")
    await invalidatePrefix("access:")

    return NextResponse.json({
      success: true,
      revokedAccess,
      suspendedAccounts,
      kept: keepUser.email,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
