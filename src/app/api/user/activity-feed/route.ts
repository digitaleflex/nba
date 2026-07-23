import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { getActivityFeed } from "@nba/lib/services/activity-feed"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sinceParam = searchParams.get("since")
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const items = await getActivityFeed(session.user.id, since)

    return NextResponse.json({ items, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error("[activity-feed] GET error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
