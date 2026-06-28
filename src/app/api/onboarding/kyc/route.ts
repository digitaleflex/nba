import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getStorage } from "@nba/lib/storage"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"

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
  const documentType = form.get("documentType") as string
  const front = form.get("front") as File
  const back = form.get("back") as File | null
  const selfie = form.get("selfie") as File | null

  if (!documentType || !front) {
    return NextResponse.json({ error: "Type de document et fichier requis" }, { status: 400 })
  }

  const storage = getStorage()

  // Execute uploads in parallel to optimize response time and reduce blocking overhead
  const [frontResult, backResult, selfieResult] = await Promise.all([
    storage.upload(front, "kyc"),
    back ? storage.upload(back, "kyc") : Promise.resolve(null),
    selfie ? storage.upload(selfie, "kyc") : Promise.resolve(null),
  ])

  const selfieFilePath = selfieResult?.path ?? null

  await prisma.kycDocument.create({
    data: {
      userId,
      documentType: documentType as any,
      frontFilePath: frontResult.path,
      backFilePath: backResult?.path ?? null,
      selfieFilePath,
      status: "PENDING",
    },
  })

  await updateOnboardingStatus(userId, "BROKER_PENDING")

  return NextResponse.json({ ok: true })
}
