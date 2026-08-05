import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { ErrorCode, errorResponse, AppError } from "@nba/lib/errors"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus, getOnboardingState } from "@nba/lib/services/onboarding"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { sendBrokerSubmittedEmail, sendOnboardingStepEmail } from "@nba/lib/services/notifications"
import { z } from "zod"
import { msg } from "@nba/lib/messages"

const uploadRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

const brokerSchema = z.object({
  brokerName: z.string().min(1, "Nom du broker requis"),
  accountId: z.string().min(1, "Numéro de compte requis"),
})

export async function POST(req: NextRequest) {
  try {
    const blocked = await uploadRateLimit(req, "broker-upload")
    if (blocked) return blocked

    const session = await requireActiveUser()
    const userId = session.user.id

    const state = await getOnboardingState(userId)
    if (!state.checklist.kycSubmitted) {
      throw new AppError({ code: ErrorCode.AUTH_FORBIDDEN, message: msg.onboarding.KYC_REQUIRED_FIRST, httpStatus: 403 })
    }

    const form = await req.formData()

    const parsed = brokerSchema.safeParse({
      brokerName: form.get("brokerName"),
      accountId: form.get("accountId"),
    })
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(", ")
      return errorResponse(400, ErrorCode.VALIDATION_ERROR, messages)
    }

    const { brokerName, accountId } = parsed.data
    const video = form.get("video") as File

    if (!video) {
      return errorResponse(400, ErrorCode.UPLOAD_INVALID, msg.onboarding.VIDEO_REQUIRED)
    }

    if (!video.type.startsWith("video/")) {
      return errorResponse(400, ErrorCode.UPLOAD_INVALID, msg.onboarding.FILE_MUST_BE_VIDEO)
    }

    const storage = getStorage()
    const videoResult = await storage.upload(video, "broker")

    await prisma.brokerVerification.create({
      data: {
        userId,
        brokerName,
        accountId,
        videoFilePath: videoResult.path,
        status: "PENDING",
      },
    })

    await updateOnboardingStatus(userId, "BROKER_PENDING")

    // Notifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (user) {
      await sendBrokerSubmittedEmail(user).catch((err) =>
        console.error("[broker] email failed:", err)
      )
      await sendOnboardingStepEmail(
        user,
        "Vérification Broker",
        null,
      ).catch((err) =>
        console.error("[broker] onboarding email failed:", err)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
