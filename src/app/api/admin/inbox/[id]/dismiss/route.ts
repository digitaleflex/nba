import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { dismissItem } from "@nba/lib/services/admin-inbox"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })
    await dismissItem(decodeURIComponent(id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleAuthError(err)
  }
}
