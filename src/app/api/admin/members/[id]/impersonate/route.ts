import { NextResponse } from "next/server"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
import { msg } from "@nba/lib/messages"

// IMPERSONATION DÉSACTIVÉE.
// Le plugin better-auth admin() cassait getSession (session.user.id undefined
// -> 403 sur les routes admin). On revient à l'état fonctionnel précédent.
// Réactiver plus tard via une approche compatible avec le schéma user existant.
export async function POST() {
  return errorResponse(503, ErrorCode.NOT_IMPLEMENTED, msg.admin.IMPERSONATION_UNAVAILABLE)
}
