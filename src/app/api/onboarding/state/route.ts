import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { getOnboardingState } from "@nba/lib/services/onboarding"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } })
    if (!me?.isActive) {
      return NextResponse.json({ error: "Votre compte a été suspendu" }, { status: 403 })
    }

    const state = await getOnboardingState(session.user.id)
    return NextResponse.json(state)
  } catch (err) {
    console.error("[onboarding/state] Error:", err)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
