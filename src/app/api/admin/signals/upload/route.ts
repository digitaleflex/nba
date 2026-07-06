import { NextRequest, NextResponse } from "next/server"
import { getStorage } from "@nba/lib/storage"
import { requirePermission, handleAuthError, AuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const signalUploadLimit = rateLimitMiddleware({ window: 3600, max: 20 })

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_MB = 10

export async function POST(req: NextRequest) {
  try {
    const blocked = await signalUploadLimit(req, "signal-upload")
    if (blocked) return blocked
    await requirePermission("signals.create")
    const form = await req.formData()
    const file = form.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    // Validation précoce côté route (avant le storage)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé : ${file.type}. Formats acceptés : JPG, PNG, WebP.` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` },
        { status: 400 }
      )
    }

    const storage = getStorage()
    const result = await storage.upload(file, "signals")
    return NextResponse.json({ path: result.path })
  } catch (error) {
    if (error instanceof AuthError) {
      return handleAuthError(error)
    }
    // Erreur de stockage (magic bytes, mkdir, etc.)
    const message = error instanceof Error ? error.message : "Erreur lors du chargement de l'image"
    console.error("[signal-upload]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
