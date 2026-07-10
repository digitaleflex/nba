import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { handleAuthError } from "@nba/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "L'image ne doit pas dépasser 5 MB" }, { status: 400 })
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
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

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
