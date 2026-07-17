import { NextResponse } from "next/server"
import { handleAuthError } from "@nba/lib/auth-utils"

// IMPERSONATION TEMPORAIREMENT DÉSACTIVÉE.
// Le plugin better-auth admin() a été retiré (la colonne ba_role n'existe pas
// encore en prod : db push + backfill requis via scripts/enable-impersonation.sh).
// Réactiver quand la migration DB sera passée.
export async function POST() {
  return NextResponse.json(
    { error: "Impersonation temporairement indisponible (migration requise)." },
    { status: 503 },
  )
}
