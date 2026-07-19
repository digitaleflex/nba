import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { uploadMessageAttachment } from "@nba/lib/services/messaging"

const messageUploadLimit = rateLimitMiddleware({ window: 3600, max: 30 })

export async function POST(req: NextRequest) {
  try {
    const blocked = await messageUploadLimit(req, "message-attachment")
    if (blocked) return blocked
    await requireActiveUser()

    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }

    const result = await uploadMessageAttachment(file)
    return NextResponse.json({ path: result.path, url: result.url, mimeType: result.mimeType, size: result.size, name: result.name })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors du chargement de la vidéo"
    console.error("[message-attachment]", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
