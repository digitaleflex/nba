import { NextRequest, NextResponse } from "next/server"
import { handleAuthError, requireRole } from "@nba/lib/auth-utils"
import { banEmail, unbanEmail, getBannedList } from "@nba/lib/services/moderation"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const list = await getBannedList()
    return NextResponse.json(list)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { email, reason } = await req.json()
    if (!email || !reason) {
      return NextResponse.json({ error: "Email et motif requis" }, { status: 400 })
    }
    await banEmail({ email, reason, bannedBy: "admin" })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }
    await unbanEmail(email)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}