import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { sendKycSubmittedEmail, sendOnboardingStepEmail } from "@nba/lib/services/notifications"
import { documentTypeSchema } from "@nba/lib/validations"

const uploadRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

export async function POST(req: NextRequest) {
  const blocked = await uploadRateLimit(req, "kyc-upload")
  if (blocked) return blocked

  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const userId = session.user.id
  const form = await req.formData()

  const parsedDocType = documentTypeSchema.safeParse(form.get("documentType"))
  if (!parsedDocType.success) {
    return NextResponse.json({ error: "Type de document invalide" }, { status: 400 })
  }
  const documentType = parsedDocType.data

  const front = form.get("front") as File
  const back = form.get("back") as File | null

  if (!front) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
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

  await updateOnboardingStatus(userId, "BROKER_PENDING")

  // Notifier l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
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
}
