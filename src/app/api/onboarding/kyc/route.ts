import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { ErrorCode, errorResponse, AppError } from "@nba/lib/errors"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { sendKycSubmittedEmail, sendOnboardingStepEmail } from "@nba/lib/services/notifications"
import { documentTypeSchema } from "@nba/lib/validations"
import { msg } from "@nba/lib/messages"

const uploadRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

export async function POST(req: NextRequest) {
  try {
    const blocked = await uploadRateLimit(req, "kyc-upload")
    if (blocked) return blocked

    const session = await requireActiveUser()
    const userId = session.user.id
    const form = await req.formData()

    const parsedDocType = documentTypeSchema.safeParse(form.get("documentType"))
    if (!parsedDocType.success) {
      return errorResponse(400, ErrorCode.VALIDATION_ERROR, msg.onboarding.DOCUMENT_TYPE_INVALID)
    }
    const documentType = parsedDocType.data

    const front = form.get("front") as File
    const back = form.get("back") as File | null

    if (!front) {
      return errorResponse(400, ErrorCode.UPLOAD_INVALID, msg.onboarding.FILE_REQUIRED)
    }

    if (!front.type.startsWith("image/")) {
      return errorResponse(400, ErrorCode.UPLOAD_INVALID, msg.onboarding.FILE_MUST_BE_IMAGE)
    }
    if (back && !back.type.startsWith("image/")) {
      return errorResponse(400, ErrorCode.UPLOAD_INVALID, msg.onboarding.FILE_BACK_MUST_BE_IMAGE)
    }

    const storage = getStorage()

    const [frontResult, backResult] = await Promise.all([
      storage.upload(front, "kyc"),
      back ? storage.upload(back, "kyc") : Promise.resolve(null),
    ])

    await prisma.kycDocument.create({
      data: {
        userId,
        documentType,
        frontFilePath: frontResult.path,
        backFilePath: backResult?.path ?? null,
        status: "PENDING",
      },
    })

    await updateOnboardingStatus(userId, "REVIEW_PENDING")

    // Notifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (user) {
      await sendKycSubmittedEmail(user).catch((err) =>
        console.error("[kyc] email failed:", err)
      )
      await sendOnboardingStepEmail(
        user,
        "Vérification d'identité",
        "Vérification Broker",
      ).catch((err) =>
        console.error("[kyc] onboarding email failed:", err)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
