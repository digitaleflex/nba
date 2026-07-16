import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getInbox } from "@nba/lib/services/admin-inbox"

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const category = req.nextUrl.searchParams.get("category") ?? undefined
    const { items, total } = await getInbox(category ?? undefined)
    return NextResponse.json({ items, total })
  } catch (err) {
    return handleAuthError(err)
  }
}
