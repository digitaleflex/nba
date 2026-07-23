import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { getStreak, getBadges } from "@nba/lib/services/streak"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const [streak, badges] = await Promise.all([
      getStreak(session.user.id),
      getBadges(session.user.id),
    ])

    return NextResponse.json({ streak, badges })
  } catch (error) {
    console.error("[streak] GET error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
