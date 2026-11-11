import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { notificationPrefsSchema, validateOrThrow } from "@nba/lib/validations"
import { NOTIFICATION_SOUND_IDS } from "@nba/lib/notification-sounds"
import { msg } from "@nba/lib/messages"

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
      soundsByType: (meta.notificationPrefs as Record<string, unknown> | undefined)?.soundsByType ?? {},
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
    const { sound, soundsByType, prefs, quietHours } = input as {
      sound?: string
      soundsByType?: Record<string, string>
      prefs?: Record<string, boolean>
      quietHours?: { start: string; end: string } | null
    }

    const data: Record<string, any> = {}

    if (sound) {
      if (!SOUNDS.includes(sound)) {
        return NextResponse.json({ error: msg.dashboard.INVALID_SOUND }, { status: 400 })
      }
      data.notificationSound = sound
    }

    if (soundsByType || prefs || quietHours !== undefined) {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { metadata: true },
      })
      const meta = (existing?.metadata || {}) as Record<string, any>
      const prevNp = (meta.notificationPrefs || {}) as Record<string, any>
      let np: Record<string, any> = { ...DEFAULT_PREFS, ...prevNp, ...(prefs || {}) }
      if (soundsByType) {
        const ALLOWED_KEYS = new Set(["signal", "redpill", "message", "system", "kyc", "broker", "access", "security"])
        const clean: Record<string, string> = {}
        for (const [k, v] of Object.entries(soundsByType)) {
          if (ALLOWED_KEYS.has(k) && typeof v === "string" && SOUNDS.includes(v)) clean[k] = v
        }
        np = { ...np, soundsByType: { ...(prevNp.soundsByType || {}), ...clean } }
      }
      if (quietHours !== undefined) {
        np = { ...np, quietHours: quietHours || undefined }
      }
      data.metadata = { ...meta, notificationPrefs: np }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: msg.dashboard.NO_DATA }, { status: 400 })
    }

    await prisma.user.update({ where: { id: session.user.id }, data })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}