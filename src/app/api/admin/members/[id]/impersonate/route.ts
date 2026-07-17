import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { auth } from "@nba/lib/auth"
import { logAuditEvent } from "@nba/lib/services/audit"

// Admin : se connecter "en tant que" un membre (impersonation better-auth).
// better-auth pose un nouveau cookie de session (impersonatedBy = admin id).
// Le client force ensuite un full reload pour adopter la session.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id: targetUserId } = await params
    if (!targetUserId) {
      return NextResponse.json({ error: "ID membre requis" }, { status: 400 })
    }

    // Empêche un admin de s'impersonifier lui-même (inutile).
    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Impossible de vous impersonifier vous-même" }, { status: 400 })
    }

    const result = await auth.api.impersonateUser({
      body: { userId: targetUserId },
      headers: await headers(),
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "admin.member.impersonate",
      resourceType: "user",
      resourceId: targetUserId,
      details: { targetEmail: (result as any)?.user?.email ?? null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
