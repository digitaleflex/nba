import { NextRequest, NextResponse } from "next/server"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { cleanupGhostAccess } from "@nba/lib/services/access-cleanup"

/**
 * Révoque les accès APPROVED des utilisateurs inactifs ou supprimés.
 *   - ?dryRun=1 : retourne le résultat SANS modifier la base
 *   - sinon : applique le nettoyage, journalise l'audit, invalide les caches
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("admin.access.cleanup")
    const { searchParams } = new URL(req.url)
    const dryRun = searchParams.get("dryRun") === "1"

    const result = await cleanupGhostAccess({
      triggeredBy: session.user.id,
      dryRun,
    })

    return NextResponse.json({ ok: true, dryRun, ...result })
  } catch (error) {
    return handleAuthError(error)
  }
}
