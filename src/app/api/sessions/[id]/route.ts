import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { getServerSession } from "@nba/lib/get-session"
import { validateId } from "@nba/lib/validations"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = await params
  const idCheck = validateId(id)
  if (!idCheck.valid) return idCheck.response
  await auth.api.revokeSession({ headers: await headers(), body: { token: id } })
  return NextResponse.json({ ok: true })
}
