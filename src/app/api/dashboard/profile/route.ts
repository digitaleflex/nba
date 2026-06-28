import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { handleAuthError } from "@nba/lib/auth-utils"
import { dashboardProfileSchema, validateOrThrow, ValidationError } from "@nba/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        whatsapp: true,
        country: true,
        language: true,
        timezone: true,
        onboardingStatus: true,
        role: { select: { name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = validateOrThrow(dashboardProfileSchema, body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        country: true,
        language: true,
        timezone: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
