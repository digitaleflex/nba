import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = await params
  await auth.api.revokeSession({ headers: await headers(), body: { token: id } })
  return NextResponse.json({ ok: true })
}
