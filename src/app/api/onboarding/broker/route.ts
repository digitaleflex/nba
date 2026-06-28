import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

const uploadRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

export async function POST(req: NextRequest) {
  const blocked = await uploadRateLimit(req, "broker-upload")
  if (blocked) return blocked

  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const userId = session.user.id
  const form = await req.formData()
  const brokerName = form.get("brokerName") as string
  const accountId = form.get("accountId") as string
  const video = form.get("video") as File

  if (!brokerName || !accountId || !video) {
    return NextResponse.json(
      { error: "Nom du broker, numéro de compte et vidéo requis" },
      { status: 400 }
    )
  }

  if (brokerName.length > 200 || accountId.length > 100) {
    return NextResponse.json(
      { error: "Nom du broker ou numéro de compte trop long" },
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

  await updateOnboardingStatus(userId, "ACTIVE")

  return NextResponse.json({ ok: true })
}
