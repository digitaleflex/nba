import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { notificationPrefsSchema, validateOrThrow } from "@nba/lib/validations"
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
    const session = await requireActiveUser()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationSound: true, metadata: true },
    })
    const meta = (user?.metadata || {}) as Record<string, any>

    return NextResponse.json({
      sound: user?.notificationSound ?? "default",
      sounds: SOUNDS,
      prefs: meta.notificationPrefs || DEFAULT_PREFS,
      quietHours: meta.notificationPrefs?.quietHours || null,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const body = await req.json()
    const input = validateOrThrow(notificationPrefsSchema, body)
    const { sound, prefs, quietHours } = input

    const data: Record<string, any> = {}

    if (sound) {
      if (!SOUNDS.includes(sound)) {
        return NextResponse.json({ error: "Son invalide" }, { status: 400 })
      }
      data.notificationSound = sound
    }

    if (prefs || quietHours !== undefined) {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { metadata: true },
      })
      const meta = (existing?.metadata || {}) as Record<string, any>
      let np = { ...DEFAULT_PREFS, ...(meta.notificationPrefs || {}), ...(prefs || {}) }
      if (quietHours !== undefined) {
        np = { ...np, quietHours: quietHours || undefined }
      }
      data.metadata = { ...meta, notificationPrefs: np }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune donnée" }, { status: 400 })
    }

    await prisma.user.update({ where: { id: session.user.id }, data })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}