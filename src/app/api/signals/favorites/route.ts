import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { getFavorites } from "@nba/lib/services/favorites"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const favorites = await getFavorites(session.user.id)
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("[favorites] GET error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
