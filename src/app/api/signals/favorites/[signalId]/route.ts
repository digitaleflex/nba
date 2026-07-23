import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { toggleFavorite } from "@nba/lib/services/favorites"

export async function POST(req: NextRequest, { params }: { params: Promise<{ signalId: string }> }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { signalId } = await params
    const isFav = await toggleFavorite(session.user.id, signalId)

    return NextResponse.json({ favorited: isFav })
  } catch (error) {
    console.error("[favorites] POST error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
