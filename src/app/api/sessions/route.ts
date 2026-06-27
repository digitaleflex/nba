import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const sessions = await auth.api.listSessions({ headers: await headers() })
  return NextResponse.json(sessions)
}
