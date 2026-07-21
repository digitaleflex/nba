import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
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
      return errorResponse(400, ErrorCode.VALIDATION_MISSING_FIELD, "Fichier requis")
    }

    const result = await uploadMessageAttachment(file)
    return NextResponse.json({ path: result.path, url: result.url, mimeType: result.mimeType, size: result.size, name: result.name })
  } catch (error) {
    return handleAuthError(error)
  }
}
