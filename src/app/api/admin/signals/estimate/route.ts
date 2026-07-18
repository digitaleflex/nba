import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

/**
 * Estime le nombre de destinataires uniques qui recevront un signal
 * destiné aux `planIds` sélectionnés, en miroir EXACT de la distribution
 * (`distributeSignal`) :
 *   - user actif + non supprimé
 *   - exclude l'expéditeur (session.user.id = futur signal.createdBy)
 *   - accès APPROVED à l'un des plans OU signalsAccessOverride = true
 *
 * Retourne un breakdown par planId + un overrideCount + un total
 * qui correspond au nombre réel de notifications envoyées.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("signals.create")

    const { searchParams } = new URL(req.url)
    const planIdsStr = searchParams.get("planIds")
    if (!planIdsStr) {
      return NextResponse.json({ breakdown: [], overrideCount: 0, total: 0 })
    }

    const planIds = planIdsStr.split(",").filter(Boolean)
    if (planIds.length === 0) {
      return NextResponse.json({ breakdown: [], overrideCount: 0, total: 0 })
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        id: { not: session.user.id },
        OR: [
          {
            accessRequests: {
              some: {
                planId: { in: planIds },
                status: "APPROVED",
              },
            },
          },
          { signalsAccessOverride: true },
        ],
      },
      select: {
        id: true,
        signalsAccessOverride: true,
        accessRequests: {
          where: {
            planId: { in: planIds },
            status: "APPROVED",
          },
          select: { planId: true },
        },
      },
    })

    const plans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    })

    const countByPlan = new Map<string, number>()
    for (const plan of plans) countByPlan.set(plan.id, 0)

    let overrideCount = 0

    for (const u of users) {
      if (u.signalsAccessOverride && u.accessRequests.length === 0) {
        overrideCount++
        continue
      }
      for (const ar of u.accessRequests) {
        countByPlan.set(ar.planId, (countByPlan.get(ar.planId) ?? 0) + 1)
      }
    }

    const breakdown = plans.map((p) => ({
      planId: p.id,
      name: p.name,
      count: countByPlan.get(p.id) ?? 0,
    }))

    return NextResponse.json({
      breakdown,
      overrideCount,
      total: users.length,
    })
  } catch (err) {
    return handleAuthError(err)
  }
}
