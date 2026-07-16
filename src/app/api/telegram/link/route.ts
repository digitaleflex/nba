import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    const session = await requireActiveUser()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { metadata: true },
    })
    const meta = (user?.metadata || {}) as Record<string, any>

    return NextResponse.json({
      linked: !!meta.telegram_chat_id,
      active: meta.telegram_active !== false,
      code: meta.telegram_link_code || null,
    })
  } catch (err) {
    return handleAuthError(err)
  }
}

export async function POST() {
  try {
    const session = await requireActiveUser()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { metadata: true },
    })
    const meta = (user?.metadata || {}) as Record<string, any>

    if (meta.telegram_chat_id && meta.telegram_active !== false) {
      return NextResponse.json({ linked: true, code: null })
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await prisma.user.update({
      where: { id: session.user.id },
      data: { metadata: { ...meta, telegram_link_code: code } },
    })

    return NextResponse.json({ linked: false, code })
  } catch (err) {
    return handleAuthError(err)
  }
}

export async function DELETE() {
  try {
    const session = await requireActiveUser()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { metadata: true },
    })
    const meta = (user?.metadata || {}) as Record<string, any>
    await prisma.user.update({
      where: { id: session.user.id },
      data: { metadata: { ...meta, telegram_chat_id: null, telegram_active: false, telegram_link_code: null } },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleAuthError(err)
  }
}