import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
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

  await updateOnboardingStatus(userId, "REVIEW_PENDING")

  return NextResponse.json({ ok: true })
}
