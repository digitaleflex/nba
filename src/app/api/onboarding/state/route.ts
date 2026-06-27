import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { getOnboardingState } from "@nba/lib/services/onboarding"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const state = await getOnboardingState(session.user.id)
  return NextResponse.json(state)
}
