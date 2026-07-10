import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { updateOnboardingStatus } from "@nba/lib/services/onboarding"
import { profileSchema, validateOrThrow, ValidationError } from "@nba/lib/validations"
import { AuthError } from "@nba/lib/auth-utils"

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) throw new AuthError("Non authentifié", 401)

    const body = await req.json()
    const parsed = validateOrThrow(profileSchema, body)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.phone !== undefined && { phone: parsed.phone }),
        ...(parsed.whatsapp !== undefined && { whatsapp: parsed.whatsapp }),
        country: parsed.country,
        language: parsed.language,
      },
    })

    await updateOnboardingStatus(session.user.id, "KYC_PENDING")

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}
