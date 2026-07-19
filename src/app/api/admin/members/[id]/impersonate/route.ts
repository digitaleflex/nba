import { NextResponse } from "next/server"

// IMPERSONATION DÉSACTIVÉE.
// Le plugin better-auth admin() cassait getSession (session.user.id undefined
// -> 403 sur les routes admin). On revient à l'état fonctionnel précédent.
// Réactiver plus tard via une approche compatible avec le schéma user existant.
export async function POST() {
  return NextResponse.json(
    { error: "Impersonation temporairement indisponible." },
    { status: 503 },
  )
}
