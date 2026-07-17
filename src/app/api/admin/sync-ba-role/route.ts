import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { syncBaRole } from "@nba/lib/services/sync-ba-role"

// Déclenche la synchronisation ba_role (rôle better-auth pour l'impersonation)
// à partir du RBAC custom. Protégé ADMIN/SUPER_ADMIN. Idempotent.
export async function POST() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { updated } = await syncBaRole()
    return NextResponse.json({ success: true, updated })
  } catch (error) {
    return handleAuthError(error)
  }
}
