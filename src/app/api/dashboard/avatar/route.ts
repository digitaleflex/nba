import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const formData = await req.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: msg.onboarding.NO_FILE }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: msg.onboarding.FILE_MUST_BE_IMAGE }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: msg.onboarding.IMAGE_TOO_LARGE }, { status: 400 })
    }

    const storage = getStorage()
    const result = await storage.upload(file, `avatars/${session.user.id}`)

    // Supprimer l'ancien avatar s'il existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })

    if (user?.image) {
      try {
        await storage.delete(user.image)
      } catch {
        // Ignorer si l'ancien fichier n'existe plus
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.path },
    })

    return NextResponse.json({
      url: `/api/files/${result.path}`,
      path: result.path,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE() {
  try {
    const session = await requireActiveUser()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })

    if (user?.image) {
      const storage = getStorage()
      await storage.delete(user.image)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
