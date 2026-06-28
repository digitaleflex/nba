import { NextRequest, NextResponse } from "next/server"
import { getStorage } from "@nba/lib/storage"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const signalUploadLimit = rateLimitMiddleware({ window: 3600, max: 20 })

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

    const storage = getStorage()
    const result = await storage.upload(file, "signals")
    return NextResponse.json({ path: result.path })
  } catch (error) {
    return handleAuthError(error)
  }
}
