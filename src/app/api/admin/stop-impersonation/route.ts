import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { logAuditEvent } from "@nba/lib/services/audit"
import { handleAuthError } from "@nba/lib/auth-utils"

// Termine une session d'impersonation en cours et restaure la session admin.
// Le client force ensuite un full reload.
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const result = await auth.api.stopImpersonating({ headers: await headers() })

    await logAuditEvent({
      userId: session.user.id,
      action: "admin.member.stop_impersonation",
      resourceType: "user",
      resourceId: session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
