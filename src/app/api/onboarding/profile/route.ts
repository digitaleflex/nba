import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { country, language, timezone } = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: { country, language, timezone },
  })

  await updateOnboardingStatus(session.user.id, "KYC_PENDING")

  return NextResponse.json({ ok: true })
}
