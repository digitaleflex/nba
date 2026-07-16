import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus, getOnboardingState } from "@nba/lib/services/onboarding"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { sendBrokerSubmittedEmail, sendOnboardingStepEmail } from "@nba/lib/services/notifications"
import { z } from "zod"

const uploadRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

const brokerSchema = z.object({
  brokerName: z.string().min(1, "Nom du broker requis"),
  accountId: z.string().min(1, "Numéro de compte requis"),
})

export async function POST(req: NextRequest) {
  const blocked = await uploadRateLimit(req, "broker-upload")
  if (blocked) return blocked

  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Vérifier que le compte n'est pas suspendu
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } })
  if (!me?.isActive) {
    return NextResponse.json({ error: "Votre compte a été suspendu" }, { status: 403 })
  }

  const userId = session.user.id

  const state = await getOnboardingState(userId)
  if (!state.checklist.kycSubmitted) {
    return NextResponse.json(
      { error: "Vous devez d'abord soumettre vos documents d'identité" },
      { status: 403 }
    )
  }

  const form = await req.formData()

  const parsed = brokerSchema.safeParse({
    brokerName: form.get("brokerName"),
    accountId: form.get("accountId"),
  })
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ")
    return NextResponse.json({ error: messages }, { status: 400 })
  }

  const { brokerName, accountId } = parsed.data
  const video = form.get("video") as File

  if (!video) {
    return NextResponse.json(
      { error: "Vidéo requise" },
      { status: 400 }
    )
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
    select: { name: true, email: true },
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
}
