import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveUser()

    const { id } = await params
    await auth.api.revokeSession({ headers: await headers(), body: { token: id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
