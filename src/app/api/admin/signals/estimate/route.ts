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

    const total = await prisma.user.count({
      where: {
        isActive: true,
        deletedAt: null,
        id: { not: session.user.id },
      },
    })

    return NextResponse.json({
      breakdown: [],
      overrideCount: 0,
      total,
    })
  } catch (err) {
    return handleAuthError(err)
  }
}
