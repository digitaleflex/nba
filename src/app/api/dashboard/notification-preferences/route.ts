import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"
import { NOTIFICATION_SOUND_IDS } from "@nba/lib/notification-sounds"

const SOUNDS = NOTIFICATION_SOUND_IDS
export type NotificationSound = (typeof SOUNDS)[number]

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationSound: true },
    })

    return NextResponse.json({
      sound: user?.notificationSound ?? "default",
      sounds: SOUNDS,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { sound } = await req.json()

    if (!SOUNDS.includes(sound)) {
      return NextResponse.json(
        { error: "Son invalide. Options: " + SOUNDS.join(", ") },
        { status: 400 },
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationSound: sound },
    })

    return NextResponse.json({ sound })
  } catch (error) {
    return handleAuthError(error)
  }
}
