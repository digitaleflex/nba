import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { snoozeItem } from "@nba/lib/services/admin-inbox"
import { msg } from "@nba/lib/messages"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params
    if (!id) return NextResponse.json({ error: msg.admin.ID_REQUIRED }, { status: 400 })
    await snoozeItem(decodeURIComponent(id), 8)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleAuthError(err)
  }
}
