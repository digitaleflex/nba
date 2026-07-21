import { NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { getOnboardingState } from "@nba/lib/services/onboarding"

export async function GET() {
  try {
    const session = await requireActiveUser()
    const state = await getOnboardingState(session.user.id)
    return NextResponse.json(state)
  } catch (error) {
    return handleAuthError(error)
  }
}
