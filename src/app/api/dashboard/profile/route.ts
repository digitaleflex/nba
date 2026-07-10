import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"
import { handleAuthError } from "@nba/lib/auth-utils"

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
        image: true,
        country: true,
        language: true,
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
    const { name, phone, whatsapp, country, language } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(country !== undefined && { country }),
        ...(language !== undefined && { language }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        whatsapp: true,
        image: true,
        country: true,
        language: true,
        onboardingStatus: true,
        role: { select: { name: true } },
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    return handleAuthError(error)
  }
}
