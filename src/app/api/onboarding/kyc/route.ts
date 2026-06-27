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
  const documentType = form.get("documentType") as string
  const front = form.get("front") as File
  const back = form.get("back") as File | null

  if (!documentType || !front) {
    return NextResponse.json({ error: "Type de document et fichier requis" }, { status: 400 })
  }

  const storage = getStorage()

  const frontResult = await storage.upload(front, "kyc")
  let backResult = null
  if (back) {
    backResult = await storage.upload(back, "kyc")
  }

  await prisma.kycDocument.create({
    data: {
      userId,
      documentType: documentType as any,
      frontFilePath: frontResult.path,
      backFilePath: backResult?.path ?? null,
      status: "PENDING",
    },
  })

  await updateOnboardingStatus(userId, "BROKER_PENDING")

  return NextResponse.json({ ok: true })
}
