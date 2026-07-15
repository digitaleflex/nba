import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"
import { NOTIFICATION_SOUND_IDS } from "@nba/lib/notification-sounds"

const SOUNDS = NOTIFICATION_SOUND_IDS
export type NotificationSound = (typeof SOUNDS)[number]

const DEFAULT_PREFS = {
  signal: true,
  kyc: true,
  broker: true,
  access: true,
  security: true,
  system: true,
  message: true,
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationSound: true, metadata: true },
    })

    const meta = (user?.metadata || {}) as Record<string, any>

    return NextResponse.json({
      sound: user?.notificationSound ?? "default",
      sounds: SOUNDS,
      prefs: meta.notificationPrefs || DEFAULT_PREFS,
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

    const body = await req.json()
    const { sound, prefs } = body

    const data: Record<string, any> = {}

    if (sound) {
      if (!SOUNDS.includes(sound)) {
        return NextResponse.json(
          { error: "Son invalide. Options: " + SOUNDS.join(", ") },
          { status: 400 },
        )
      }
      data.notificationSound = sound
    }

    if (prefs) {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { metadata: true },
      })
      const meta = (existing?.metadata || {}) as Record<string, any>
      const merged = { ...DEFAULT_PREFS, ...(meta.notificationPrefs || {}), ...prefs }
      data.metadata = { ...meta, notificationPrefs: merged }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true },
    })

    return NextResponse.json({ ok: true, sound: data.notificationSound || (await getPref()), prefs: data.metadata?.notificationPrefs })
  } catch (error) {
    return handleAuthError(error)
  }
}

async function getPref() {
  const session = await getServerSession()
  const u = session ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { notificationSound: true, metadata: true } }) : null
  const meta = (u?.metadata || {}) as Record<string, any>
  return { sound: u?.notificationSound ?? "default", prefs: meta.notificationPrefs || DEFAULT_PREFS }
}
