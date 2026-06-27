import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { getOnboardingState } from "@nba/lib/services/onboarding"

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const state = await getOnboardingState(session.user.id)
  return NextResponse.json(state)
}
