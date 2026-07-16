import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireActiveUser()

    const sessions = await auth.api.listSessions({ headers: await headers() })
    return NextResponse.json(sessions)
  } catch (error) {
    return handleAuthError(error)
  }
}
