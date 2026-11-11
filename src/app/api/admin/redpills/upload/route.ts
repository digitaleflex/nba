import { NextRequest, NextResponse } from "next/server"
import { getStorage } from "@nba/lib/storage"
import { requireAdmin, adminError } from "../_auth"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const uploadLimit = rateLimitMiddleware({ window: 3600, max: 30 })

// Types acceptés : images (cover) + audio (note vocale) + vidéo (prévu)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "video/webm",
]
const MAX_SIZE_MB = 50

// POST /api/admin/redpills/upload — upload audio/image/vidéo (multipart `file`)
// Réutilise le même système de storage que /api/admin/signals/upload.
export async function POST(req: NextRequest) {
  try {
    const blocked = await uploadLimit(req, "redpill-upload")
    if (blocked) return blocked
    await requireAdmin()

    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    const rawMime = file.type || ""
    const mime = rawMime.split(";")[0].trim().toLowerCase()
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: `Type non autorisé (${rawMime || "inconnu"}). Images, audio ou vidéo uniquement.` },
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
    const result = await storage.upload(file, "redpills")
    return NextResponse.json({ path: result.path })
  } catch (error) {
    return adminError(error)
  }
}
